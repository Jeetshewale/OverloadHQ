// ---------------------------------------------------------------
// OverloadHQ – Rule-Based Fallback Engine
// No AI, no API. Pure logic for workout recommendations.
// ---------------------------------------------------------------

import { AiAnalyzeResponse } from "../schemas";

interface UserProfile {
  name: string;
  goal: string;
  experienceLevel: string;
  bodyWeightKg: number | null;
}

interface WorkoutData {
  date: Date;
  dayName: string;
  muscleGroup: string;
  sets: Array<{
    exerciseName: string;
    setNumber: number;
    weightKg: number;
    reps: number;
    repsMax: number | null;
    isFormImproved: boolean;
  }>;
}

// Goal-specific rep ranges
const GOAL_REP_RANGES: Record<string, { min: number; max: number }> = {
  MUSCLE_BUILDING: { min: 6, max: 12 },
  STRENGTH: { min: 1, max: 6 },
  FAT_LOSS: { min: 8, max: 15 },
  ENDURANCE: { min: 15, max: 25 },
  GENERAL_FITNESS: { min: 8, max: 12 },
  RECOMPOSITION: { min: 6, max: 12 },
};

// Small muscle groups get smaller weight increments
const SMALL_MUSCLES = new Set([
  "Rear Delt Fly",
  "Lateral Raise",
  "Bicep Curl",
  "Tricep Extension",
  "Face Pull",
  "Wrist Curl",
  "Calf Raise",
]);

function getWeightIncrement(exerciseName: string): number {
  const isSmall = SMALL_MUSCLES.has(exerciseName) ||
    exerciseName.toLowerCase().includes("delt") ||
    exerciseName.toLowerCase().includes("curl") ||
    exerciseName.toLowerCase().includes("fly");
  return isSmall ? 1 : 2.5;
}

export function generateRuleBasedAnalysis(
  user: UserProfile,
  workouts: WorkoutData[]
): AiAnalyzeResponse {
  const repRange = GOAL_REP_RANGES[user.goal] || GOAL_REP_RANGES.GENERAL_FITNESS;

  // Group sets by exercise across all workouts, ordered by date
  const exerciseHistory = new Map<
    string,
    Array<{
      date: Date;
      sets: WorkoutData["sets"];
    }>
  >();

  for (const w of workouts) {
    const byExercise = new Map<string, WorkoutData["sets"]>();
    for (const s of w.sets) {
      if (!byExercise.has(s.exerciseName)) byExercise.set(s.exerciseName, []);
      byExercise.get(s.exerciseName)!.push(s);
    }
    for (const [name, sets] of byExercise) {
      if (!exerciseHistory.has(name)) exerciseHistory.set(name, []);
      exerciseHistory.get(name)!.push({ date: w.date, sets });
    }
  }

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const nextWeekPlan: AiAnalyzeResponse["nextWeekPlan"] = [];
  const plateauWarnings: string[] = [];
  const formTips: string[] = [];

  for (const [name, sessions] of exerciseHistory) {
    if (sessions.length === 0) continue;

    const latest = sessions[sessions.length - 1];
    const latestMaxWeight = Math.max(...latest.sets.map((s) => s.weightKg));
    const latestMaxReps = Math.max(
      ...latest.sets
        .filter((s) => s.weightKg === latestMaxWeight)
        .map((s) => s.repsMax || s.reps)
    );

    const increment = getWeightIncrement(name);

    // Check if all sets hit top of rep range → increase weight
    const allHitTop = latest.sets.every(
      (s) => (s.repsMax || s.reps) >= repRange.max
    );

    if (allHitTop) {
      strengths.push(
        `${name}: All sets hit ${repRange.max}+ reps. Ready to increase weight!`
      );
      nextWeekPlan.push({
        exercise: name,
        targetWeight: latestMaxWeight + increment,
        targetReps: `${repRange.min}-${repRange.max}`,
        targetSets: latest.sets.length,
      });
    } else if (latestMaxReps >= repRange.min) {
      // Normal progression: add reps
      nextWeekPlan.push({
        exercise: name,
        targetWeight: latestMaxWeight,
        targetReps: `${Math.min(latestMaxReps + 1, repRange.max)}-${repRange.max}`,
        targetSets: latest.sets.length,
      });
    } else {
      // Reps below range: keep weight, focus on form
      weaknesses.push(
        `${name}: Only ${latestMaxReps} reps at ${latestMaxWeight} kg (below target range of ${repRange.min}-${repRange.max}). Keep the weight and focus on form.`
      );
      nextWeekPlan.push({
        exercise: name,
        targetWeight: latestMaxWeight,
        targetReps: `${repRange.min}-${repRange.max}`,
        targetSets: latest.sets.length,
      });
    }

    // Detect plateau: no improvement over 3 consecutive sessions
    if (sessions.length >= 3) {
      const last3 = sessions.slice(-3);
      const weights = last3.map((s) =>
        Math.max(...s.sets.map((set) => set.weightKg))
      );
      const reps = last3.map((s) =>
        Math.max(...s.sets.map((set) => set.repsMax || set.reps))
      );

      const weightStuck =
        weights[0] === weights[1] && weights[1] === weights[2];
      const repsStuck = reps[0] === reps[1] && reps[1] === reps[2];

      if (weightStuck && repsStuck) {
        plateauWarnings.push(
          `${name}: No improvement over the last 3 sessions (${weights[0]} kg x ${reps[0]}). Consider: deload for 1 week (reduce weight by 10-15%), then build back up. Or try a variation of the exercise.`
        );
      }
    }

    // Check for reps drop vs previous session
    if (sessions.length >= 2) {
      const prev = sessions[sessions.length - 2];
      const prevMaxReps = Math.max(
        ...prev.sets.map((s) => s.repsMax || s.reps)
      );
      if (latestMaxReps < prevMaxReps && latestMaxWeight <= Math.max(...prev.sets.map(s => s.weightKg))) {
        weaknesses.push(
          `${name}: Reps dropped from ${prevMaxReps} to ${latestMaxReps}. Ensure adequate rest and nutrition.`
        );
      }
    }
  }

  // Check for exercises not trained in 2+ weeks
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  for (const [name, sessions] of exerciseHistory) {
    const lastSession = sessions[sessions.length - 1];
    if (lastSession.date < twoWeeksAgo) {
      formTips.push(
        `${name}: Not trained in over 2 weeks. Consider adding it back to maintain progress.`
      );
    }
  }

  // Recovery tips based on goal
  const recoveryTips: string[] = [];
  switch (user.goal) {
    case "MUSCLE_BUILDING":
      recoveryTips.push(
        "Aim for 7-9 hours of sleep for optimal muscle recovery.",
        "Consume 1.6-2.2g protein per kg of body weight daily."
      );
      break;
    case "STRENGTH":
      recoveryTips.push(
        "Rest 2-5 minutes between heavy sets for full strength recovery.",
        "Allow 48-72 hours before training the same muscle group again."
      );
      break;
    case "FAT_LOSS":
      recoveryTips.push(
        "Maintain a moderate caloric deficit (300-500 kcal) to preserve muscle.",
        "Prioritize protein intake (2g/kg) to minimize muscle loss during a cut."
      );
      break;
    case "ENDURANCE":
      recoveryTips.push(
        "Keep rest periods short (30-60 seconds) to build muscular endurance.",
        "Stay well hydrated during and after workouts."
      );
      break;
    default:
      recoveryTips.push(
        "Get 7-8 hours of quality sleep.",
        "Stay hydrated and eat balanced meals with adequate protein."
      );
  }

  // Summary
  const totalExercises = exerciseHistory.size;
  const totalWorkouts = workouts.length;
  const summary =
    strengths.length > weaknesses.length
      ? `Great progress, ${user.name}! ${totalWorkouts} workouts logged across ${totalExercises} exercises. Your progressive overload is on track for ${user.goal.replace(/_/g, " ").toLowerCase()}.`
      : `${user.name}, you logged ${totalWorkouts} workouts across ${totalExercises} exercises. There are areas to improve – focus on the recommendations below to keep progressing toward your ${user.goal.replace(/_/g, " ").toLowerCase()} goal.`;

  if (formTips.length === 0) {
    formTips.push(
      "Focus on controlled eccentrics (lowering phase) for better muscle activation.",
      "Avoid using momentum – if you need to swing, the weight is too heavy."
    );
  }

  return {
    summary,
    strengths: strengths.length > 0 ? strengths : ["Consistent training – keep it up!"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["No major weaknesses detected. Stay consistent!"],
    nextWeekPlan,
    formTips,
    recoveryTips,
    plateauWarnings,
  };
}
