// ---------------------------------------------------------------
// OverloadHQ – App Config (Frontend)
// ---------------------------------------------------------------

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "OverloadHQ";

export const API_BASE = "/api/v1";

export const MUSCLE_GROUPS = [
  "CHEST",
  "BACK",
  "LEGS",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
  "ARMS",
  "CORE",
  "FULL_BODY",
  "CARDIO",
  "OTHER",
] as const;

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  CHEST: "Chest",
  BACK: "Back",
  LEGS: "Legs",
  SHOULDERS: "Shoulders",
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  ARMS: "Arms",
  CORE: "Core",
  FULL_BODY: "Full Body",
  CARDIO: "Cardio",
  OTHER: "Other",
};

export const MUSCLE_GROUP_EMOJIS: Record<string, string> = {
  CHEST: "💪",
  BACK: "🔙",
  LEGS: "🦵",
  SHOULDERS: "🤷",
  BICEPS: "🦾",
  TRICEPS: "💥",
  ARMS: "💪",
  CORE: "🎯",
  FULL_BODY: "🏋️",
  CARDIO: "🏃",
  OTHER: "⚡",
};

// Popular multi-select muscle presets for fast 1-click selection
export const MUSCLE_PRESETS = [
  { label: "Chest & Triceps", groups: ["CHEST", "TRICEPS"] },
  { label: "Back & Biceps", groups: ["BACK", "BICEPS"] },
  { label: "Push (Chest/Sh/Tri)", groups: ["CHEST", "SHOULDERS", "TRICEPS"] },
  { label: "Pull (Back/Bi)", groups: ["BACK", "BICEPS"] },
  { label: "Legs & Core", groups: ["LEGS", "CORE"] },
  { label: "Shoulders & Arms", groups: ["SHOULDERS", "ARMS"] },
  { label: "Upper Body", groups: ["CHEST", "BACK", "SHOULDERS", "ARMS"] },
  { label: "Full Body", groups: ["FULL_BODY"] },
];

export const WORKOUT_SPLITS = [
  "4_DAY_SPLIT",
  "PPL",
  "UPPER_LOWER",
  "FULL_BODY",
  "BRO_SPLIT",
  "OTHER",
] as const;

export const WORKOUT_SPLIT_LABELS: Record<string, string> = {
  "4_DAY_SPLIT": "4-Day Split",
  PPL: "Push / Pull / Legs (PPL)",
  UPPER_LOWER: "Upper / Lower",
  FULL_BODY: "Full Body",
  BRO_SPLIT: "Bro Split (5-Day)",
  OTHER: "Other / Custom",
};

export const WORKOUT_SPLIT_DESCRIPTIONS: Record<string, string> = {
  "4_DAY_SPLIT": "Progressive overload tracked after 2 workout days of each muscle group.",
  PPL: "Push (Chest/Shoulders/Triceps), Pull (Back/Biceps), Legs (Quads/Hamstrings/Calves).",
  UPPER_LOWER: "Alternating Upper Body and Lower Body strength & hypertrophy sessions.",
  FULL_BODY: "Whole body stimulation 3 days per week with balanced recovery.",
  BRO_SPLIT: "Dedicated single muscle group specialization each day (Chest, Back, Arms, Shoulders, Legs).",
  OTHER: "Custom split tailored to your schedule.",
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
