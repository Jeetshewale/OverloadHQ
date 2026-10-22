// ---------------------------------------------------------------
// OverloadHQ – App Config (Frontend)
// ---------------------------------------------------------------

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "OverloadHQ";

export const API_BASE = "/api/v1";

export const MUSCLE_GROUPS = [
  "BACK",
  "CHEST",
  "SHOULDERS",
  "LEGS",
  "BICEPS",
  "TRICEPS",
  "ARMS",
  "CORE",
  "FULL_BODY",
  "CARDIO",
  "OTHER",
] as const;

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  BACK: "Back",
  CHEST: "Chest",
  SHOULDERS: "Shoulders",
  LEGS: "Legs",
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  ARMS: "Arms",
  CORE: "Core",
  FULL_BODY: "Full Body",
  CARDIO: "Cardio",
  OTHER: "Other",
};

export const MUSCLE_GROUP_EMOJIS: Record<string, string> = {
  BACK: "🔙",
  CHEST: "💪",
  SHOULDERS: "🤷",
  LEGS: "🦵",
  BICEPS: "💪",
  TRICEPS: "💪",
  ARMS: "💪",
  CORE: "🎯",
  FULL_BODY: "🏋️",
  CARDIO: "🏃",
  OTHER: "⚡",
};

export const GOAL_LABELS: Record<string, string> = {
  MUSCLE_BUILDING: "Muscle Building",
  STRENGTH: "Strength",
  FAT_LOSS: "Fat Loss",
  ENDURANCE: "Endurance",
  GENERAL_FITNESS: "General Fitness",
  RECOMPOSITION: "Body Recomposition",
};

export const GOAL_DESCRIPTIONS: Record<string, string> = {
  MUSCLE_BUILDING: "6-12 reps, moderate weight, 3-4 sets, 60-90s rest",
  STRENGTH: "1-6 reps, heavy weight, 3-5 min rest",
  FAT_LOSS: "Keep strength, higher frequency, supersets, add cardio",
  ENDURANCE: "15+ reps, short rest (30-60s)",
  GENERAL_FITNESS: "Balanced approach across all rep ranges",
  RECOMPOSITION: "Build muscle while losing fat – high protein, moderate deficit",
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  BEGINNER: "Beginner (< 1 year)",
  INTERMEDIATE: "Intermediate (1-3 years)",
  ADVANCED: "Advanced (3+ years)",
};

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
