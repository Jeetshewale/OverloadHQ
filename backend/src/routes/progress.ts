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

// ---- 4-Day Split Muscle Progressive Overload (Evaluated after 2 workout days of each muscle) ----
router.get(
  "/split-overload",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const requestedSplit = (req.query.split as string) || "4_DAY_SPLIT";
    const filterMuscle = req.query.muscleGroup as string | undefined;

    // Fetch all user workouts ordered by date ascending
    const workouts = await withRetry(() =>
      prisma.workout.findMany({
        where: { userId },
        include: {
          sets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
        },
        orderBy: { date: "asc" },
      })
    );

    const ALL_MUSCLES = [
      "CHEST",
      "BACK",
      "LEGS",
      "SHOULDERS",
      "BICEPS",
      "TRICEPS",
      "ARMS",
      "CORE",
      "FULL_BODY",
    ];

    const targetMuscles = filterMuscle
      ? [filterMuscle.toUpperCase()]
      : ALL_MUSCLES;

    const muscleAnalysis = targetMuscles.map((mg) => {
      // Find workouts that train this muscle group
      const matchingWorkouts = workouts.filter((w) => {
        const inEnum = w.muscleGroup === mg;
        const inArray = Array.isArray(w.muscleGroups) && w.muscleGroups.includes(mg);
        return inEnum || inArray;
      });

      const sessionCount = matchingWorkouts.length;
      // In 4-day split, progressive overload is evaluated after every 2 workout days of that muscle
      const cycleDay = sessionCount === 0 ? 0 : (sessionCount % 2 === 0 ? 2 : 1);
      const isOverloadEvaluated = sessionCount >= 2;

      if (!isOverloadEvaluated) {
        return {
          muscleGroup: mg,
          sessionCount,
          cycleDay,
          cycleTarget: 2,
          isOverloadEvaluated: false,
          status: sessionCount === 1 ? "BASELINE_SET" : "NO_SESSIONS",
          message:
            sessionCount === 1
              ? "Day 1 of 2 logged. Complete 1 more workout for this muscle to trigger Progressive Overload analysis!"
              : "No workouts logged for this muscle yet.",
          session1Date: sessionCount === 1 ? matchingWorkouts[0].date.toISOString().split("T")[0] : null,
          session2Date: null,
          volumeChange: 0,
          weightChange: 0,
          exercises: [],
        };
      }

      // Take the two most recent workout days for this muscle
      const session1 = matchingWorkouts[sessionCount - 2];
      const session2 = matchingWorkouts[sessionCount - 1];

      const s1Volume = session1.sets.reduce((sum, s) => sum + volume(s.weightKg, s.reps), 0);
      const s2Volume = session2.sets.reduce((sum, s) => sum + volume(s.weightKg, s.reps), 0);

      const s1MaxWeight = session1.sets.length > 0 ? Math.max(...session1.sets.map((s) => s.weightKg)) : 0;
      const s2MaxWeight = session2.sets.length > 0 ? Math.max(...session2.sets.map((s) => s.weightKg)) : 0;

      const volChange = pctChange(s1Volume, s2Volume);
      const wtChange = pctChange(s1MaxWeight, s2MaxWeight);

      // Per-exercise comparison
      const s1ExMap = new Map<string, { maxWeight: number; totalVolume: number; bestReps: number }>();
      for (const s of session1.sets) {
        const cur = s1ExMap.get(s.exerciseName) || { maxWeight: 0, totalVolume: 0, bestReps: 0 };
        cur.maxWeight = Math.max(cur.maxWeight, s.weightKg);
        cur.bestReps = Math.max(cur.bestReps, s.reps);
        cur.totalVolume += volume(s.weightKg, s.reps);
        s1ExMap.set(s.exerciseName, cur);
      }

      const exercises = [];
      const s2ExNames = [...new Set(session2.sets.map((s) => s.exerciseName))];
      for (const name of s2ExNames) {
        const sets2 = session2.sets.filter((s) => s.exerciseName === name);
        const maxWeight2 = Math.max(...sets2.map((s) => s.weightKg));
        const bestReps2 = Math.max(...sets2.map((s) => s.reps));
        const vol2 = sets2.reduce((sum, s) => sum + volume(s.weightKg, s.reps), 0);

        const past = s1ExMap.get(name);
        exercises.push({
          name,
          day1MaxWeight: past ? past.maxWeight : null,
          day2MaxWeight: maxWeight2,
          day1Reps: past ? past.bestReps : null,
          day2Reps: bestReps2,
          day1Volume: past ? Math.round(past.totalVolume) : null,
          day2Volume: Math.round(vol2),
          weightChange: past ? pctChange(past.maxWeight, maxWeight2) : null,
          volumeChange: past ? pctChange(past.totalVolume, vol2) : null,
          isOverload: past ? (maxWeight2 > past.maxWeight || vol2 > past.totalVolume) : true,
        });
      }

      let status: "ACHIEVED" | "STEADY" | "RECOVERY" = "STEADY";
      let message = "Maintained intensity across 2 workout days.";
      if (s2Volume > s1Volume || s2MaxWeight > s1MaxWeight) {
        status = "ACHIEVED";
        message = `Progressive overload achieved! Volume up ${volChange > 0 ? "+" + volChange + "%" : "steady"}, top load up ${wtChange > 0 ? "+" + wtChange + "%" : "steady"}.`;
      } else if (s2Volume < s1Volume * 0.95) {
        status = "RECOVERY";
        message = `Volume slightly down (${volChange}%). Prioritize sleep and recovery before the next cycle.`;
      }

      return {
        muscleGroup: mg,
        sessionCount,
        cycleDay: 2,
        cycleTarget: 2,
        isOverloadEvaluated: true,
        status,
        message,
        session1Date: session1.date.toISOString().split("T")[0],
        session2Date: session2.date.toISOString().split("T")[0],
        session1Volume: Math.round(s1Volume),
        session2Volume: Math.round(s2Volume),
        volumeChange: volChange,
        weightChange: wtChange,
        exercises,
      };
    });

    res.json({
      split: requestedSplit,
      trackingRule: "Progressive overload tracked after 2 workout days for each muscle group",
      muscleAnalysis: muscleAnalysis.filter((m) => m.sessionCount > 0 || (filterMuscle && m.muscleGroup === filterMuscle)),
    });
  })
);

export default router;
