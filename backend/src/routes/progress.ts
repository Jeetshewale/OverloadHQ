// ---------------------------------------------------------------
// OverloadHQ – Progress Routes
// GET /progress/exercise/:name – per-exercise stats & chart data
// GET /progress/summary        – weekly comparison, overload score
// GET /progress/prs            – personal records
// ---------------------------------------------------------------

import { Router, Request, Response } from "express";
import { prisma, withRetry } from "../db";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

// ---- Helper: Epley 1RM ----
function estimated1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// ---- Helper: Volume ----
function volume(weight: number, reps: number): number {
  return weight * reps;
}

// ---- Helper: percentage change ----
function pctChange(prev: number, curr: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

// ---- Helper: get start of week (Monday) ----
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ---- Exercise Progress ----
router.get(
  "/exercise/:name",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const exerciseName = decodeURIComponent(String(req.params.name));

    const sets = await withRetry(() =>
      prisma.exerciseSet.findMany({
        where: {
          exerciseName: { equals: exerciseName, mode: "insensitive" },
          workout: { userId },
        },
        include: { workout: { select: { date: true, dayName: true } } },
        orderBy: { workout: { date: "asc" } },
      })
    );

    if (sets.length === 0) {
      res.json({
        exerciseName,
        chartData: [],
        comparison: null,
        description: `No data found for ${exerciseName}.`,
      });
      return;
    }

    // Group by workout date
    const byDate = new Map<string, typeof sets>();
    for (const set of sets) {
      const key = set.workout.date.toISOString().split("T")[0];
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(set);
    }

    // Build chart data points
    const chartData = Array.from(byDate.entries()).map(([dateStr, dateSets]) => {
      const maxWeight = Math.max(...dateSets.map((s) => s.weightKg));
      const bestRepsAtMax = Math.max(
        ...dateSets.filter((s) => s.weightKg === maxWeight).map((s) => s.reps)
      );
      const totalVolume = dateSets.reduce(
        (sum, s) => sum + volume(s.weightKg, s.reps),
        0
      );
      const best1RM = Math.max(
        ...dateSets.map((s) => estimated1RM(s.weightKg, s.reps))
      );

      return {
        date: dateStr,
        maxWeight,
        bestReps: bestRepsAtMax,
        totalVolume: Math.round(totalVolume),
        estimated1RM: best1RM,
        setCount: dateSets.length,
      };
    });

    // This week vs last week comparison
    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekData = chartData.filter(
      (d) => new Date(d.date) >= thisWeekStart
    );
    const lastWeekData = chartData.filter(
      (d) =>
        new Date(d.date) >= lastWeekStart && new Date(d.date) < thisWeekStart
    );

    let comparison = null;
    if (thisWeekData.length > 0 && lastWeekData.length > 0) {
      const tw = thisWeekData[thisWeekData.length - 1];
      const lw = lastWeekData[lastWeekData.length - 1];
      comparison = {
        weight: {
          prev: lw.maxWeight,
          curr: tw.maxWeight,
          change: pctChange(lw.maxWeight, tw.maxWeight),
          direction:
            tw.maxWeight > lw.maxWeight
              ? "up"
              : tw.maxWeight < lw.maxWeight
              ? "down"
              : "equal",
        },
        reps: {
          prev: lw.bestReps,
          curr: tw.bestReps,
          change: pctChange(lw.bestReps, tw.bestReps),
          direction:
            tw.bestReps > lw.bestReps
              ? "up"
              : tw.bestReps < lw.bestReps
              ? "down"
              : "equal",
        },
        volume: {
          prev: lw.totalVolume,
          curr: tw.totalVolume,
          change: pctChange(lw.totalVolume, tw.totalVolume),
          direction:
            tw.totalVolume > lw.totalVolume
              ? "up"
              : tw.totalVolume < lw.totalVolume
              ? "down"
              : "equal",
        },
      };
    }

    // Generate text description
    let description = `${exerciseName}: `;
    if (chartData.length >= 2) {
      const latest = chartData[chartData.length - 1];
      const prev = chartData[chartData.length - 2];
      const weightPct = pctChange(prev.maxWeight, latest.maxWeight);
      const volPct = pctChange(prev.totalVolume, latest.totalVolume);

      if (latest.maxWeight > prev.maxWeight) {
        description += `top weight rose from ${prev.maxWeight} kg to ${latest.maxWeight} kg (+${weightPct}%)`;
      } else if (latest.maxWeight < prev.maxWeight) {
        description += `top weight dropped from ${prev.maxWeight} kg to ${latest.maxWeight} kg (${weightPct}%)`;
      } else {
        description += `top weight held at ${latest.maxWeight} kg`;
      }

      description += ` and you hit ${latest.bestReps} reps. `;

      if (volPct > 0) {
        description += `Volume is up ${volPct}% vs last session. Great progressive overload!`;
      } else if (volPct < 0) {
        description += `Volume is down ${Math.abs(volPct)}% vs last session. Focus on form and recovery.`;
      } else {
        description += `Volume is steady. Try adding a rep or small weight increase next time.`;
      }
    } else {
      description += `${chartData[0].maxWeight} kg x ${chartData[0].bestReps} reps. Keep training to track progress!`;
    }

    res.json({ exerciseName, chartData, comparison, description });
  })
);

// ---- Progress Summary ----
router.get(
  "/summary",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // This week workouts
    const thisWeekWorkouts = await withRetry(() =>
      prisma.workout.findMany({
        where: { userId, date: { gte: thisWeekStart } },
        include: { sets: true },
        orderBy: { date: "asc" },
      })
    );

    // Last week workouts
    const lastWeekWorkouts = await withRetry(() =>
      prisma.workout.findMany({
        where: {
          userId,
          date: { gte: lastWeekStart, lt: thisWeekStart },
        },
        include: { sets: true },
      })
    );

    // Total volume this week vs last week
    const thisWeekVolume = thisWeekWorkouts.reduce(
      (sum, w) =>
        sum + w.sets.reduce((s, set) => s + volume(set.weightKg, set.reps), 0),
      0
    );
    const lastWeekVolume = lastWeekWorkouts.reduce(
      (sum, w) =>
        sum + w.sets.reduce((s, set) => s + volume(set.weightKg, set.reps), 0),
      0
    );

    // Muscle groups trained this week
    const muscleGroupsTrained = [
      ...new Set(thisWeekWorkouts.map((w) => w.muscleGroup)),
    ];

    // Progressive overload score (0-100)
    // Checks each exercise: did weight or reps increase vs last occurrence?
    let improved = 0;
    let total = 0;

    const exerciseNames = [
      ...new Set(
        thisWeekWorkouts.flatMap((w) => w.sets.map((s) => s.exerciseName))
      ),
    ];

    for (const name of exerciseNames) {
      const thisWeekSets = thisWeekWorkouts
        .flatMap((w) => w.sets)
        .filter((s) => s.exerciseName === name);
      const lastWeekSets = lastWeekWorkouts
        .flatMap((w) => w.sets)
        .filter((s) => s.exerciseName === name);

      if (lastWeekSets.length === 0) continue;

      total++;

      const twMax = Math.max(...thisWeekSets.map((s) => s.weightKg));
      const lwMax = Math.max(...lastWeekSets.map((s) => s.weightKg));
      const twVol = thisWeekSets.reduce(
        (sum, s) => sum + volume(s.weightKg, s.reps),
        0
      );
      const lwVol = lastWeekSets.reduce(
        (sum, s) => sum + volume(s.weightKg, s.reps),
        0
      );

      if (twMax > lwMax || twVol > lwVol) improved++;
    }

    const overloadScore =
      total > 0 ? Math.round((improved / total) * 100) : null;

    // Streak: consecutive weeks with at least 1 workout
    const allWorkouts = await withRetry(() =>
      prisma.workout.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: "desc" },
      })
    );

    let streak = 0;
    let checkWeek = startOfWeek(now);
    const workoutDates = new Set(
      allWorkouts.map((w) => {
        const ws = startOfWeek(w.date);
        return ws.toISOString();
      })
    );

    while (workoutDates.has(checkWeek.toISOString())) {
      streak++;
      checkWeek.setDate(checkWeek.getDate() - 7);
    }

    res.json({
      thisWeek: {
        workoutCount: thisWeekWorkouts.length,
        totalSets: thisWeekWorkouts.reduce((sum, w) => sum + w.sets.length, 0),
        totalVolume: Math.round(thisWeekVolume),
        muscleGroupsTrained,
      },
      lastWeek: {
        workoutCount: lastWeekWorkouts.length,
        totalVolume: Math.round(lastWeekVolume),
      },
      volumeChange: pctChange(lastWeekVolume, thisWeekVolume),
      overloadScore,
      weeklyStreak: streak,
    });
  })
);

// ---- Personal Records ----
router.get(
  "/prs",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const allSets = await withRetry(() =>
      prisma.exerciseSet.findMany({
        where: { workout: { userId } },
        include: { workout: { select: { date: true } } },
        orderBy: { workout: { date: "asc" } },
      })
    );

    // Track PRs per exercise
    const prs: Array<{
      exerciseName: string;
      type: string;
      value: number;
      reps?: number;
      date: string;
      isNew: boolean;
    }> = [];

    const byExercise = new Map<string, typeof allSets>();
    for (const set of allSets) {
      if (!byExercise.has(set.exerciseName))
        byExercise.set(set.exerciseName, []);
      byExercise.get(set.exerciseName)!.push(set);
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const [name, sets] of byExercise.entries()) {
      // Max weight PR
      let maxWeight = 0;
      let maxWeightDate = "";
      let maxReps = 0;
      let maxRepsDate = "";
      let max1RM = 0;
      let max1RMDate = "";

      for (const set of sets) {
        if (set.weightKg > maxWeight) {
          maxWeight = set.weightKg;
          maxWeightDate = set.workout.date.toISOString().split("T")[0];
        }
        if (set.reps > maxReps) {
          maxReps = set.reps;
          maxRepsDate = set.workout.date.toISOString().split("T")[0];
        }
        const e1rm = estimated1RM(set.weightKg, set.reps);
        if (e1rm > max1RM) {
          max1RM = e1rm;
          max1RMDate = set.workout.date.toISOString().split("T")[0];
        }
      }

      prs.push({
        exerciseName: name,
        type: "MAX_WEIGHT",
        value: maxWeight,
        date: maxWeightDate,
        isNew: new Date(maxWeightDate) >= oneWeekAgo,
      });

      prs.push({
        exerciseName: name,
        type: "MAX_REPS",
        value: maxReps,
        date: maxRepsDate,
        isNew: new Date(maxRepsDate) >= oneWeekAgo,
      });

      prs.push({
        exerciseName: name,
        type: "ESTIMATED_1RM",
        value: max1RM,
        date: max1RMDate,
        isNew: new Date(max1RMDate) >= oneWeekAgo,
      });
    }

    res.json({
      prs,
      recentPRs: prs.filter((p) => p.isNew),
    });
  })
);

export default router;
