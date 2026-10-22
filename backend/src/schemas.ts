// ---------------------------------------------------------------
// OverloadHQ – Zod Validation Schemas
// Shared between routes for request validation.
// ---------------------------------------------------------------

import { z } from "zod";

// Enums matching Prisma
export const GoalEnum = z.enum([
  "MUSCLE_BUILDING",
  "STRENGTH",
  "FAT_LOSS",
  "ENDURANCE",
  "GENERAL_FITNESS",
  "RECOMPOSITION",
]);

export const ExperienceLevelEnum = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);

export const PreferredUnitEnum = z.enum(["KG", "LB"]);
export const VisibilityEnum = z.enum(["PRIVATE", "FRIENDS"]);

export const MuscleGroupEnum = z.enum([
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
]);

// ---- Auth ----
export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscores only"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
  inviteCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ---- Profile ----
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  goal: GoalEnum.optional(),
  experienceLevel: ExperienceLevelEnum.optional(),
  bodyWeightKg: z.number().positive().optional().nullable(),
  preferredUnit: PreferredUnitEnum.optional(),
  visibility: VisibilityEnum.optional(),
  onboardingDone: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// ---- Exercise Set ----
export const exerciseSetSchema = z.object({
  exerciseName: z.string().min(1, "Exercise name required").max(100),
  setNumber: z.number().int().positive(),
  weightKg: z.number().min(0, "Weight cannot be negative"),
  reps: z.number().int().positive("Must do at least 1 rep"),
  repsMax: z.number().int().positive().optional().nullable(),
  isFormImproved: z.boolean().default(false),
  formNote: z.string().max(500).optional().nullable(),
});

// ---- Workout ----
export const createWorkoutSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  muscleGroup: MuscleGroupEnum,
  notes: z.string().max(1000).optional().nullable(),
  isSample: z.boolean().default(false),
  sets: z.array(exerciseSetSchema).min(1, "Add at least one set"),
});

export const updateWorkoutSchema = z.object({
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
    .optional(),
  muscleGroup: MuscleGroupEnum.optional(),
  notes: z.string().max(1000).optional().nullable(),
  sets: z.array(exerciseSetSchema).min(1).optional(),
});

// ---- Exercise library ----
export const createExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: MuscleGroupEnum,
});

// ---- AI Coach ----
export const aiAnalyzeResponseSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  nextWeekPlan: z.array(
    z.object({
      exercise: z.string(),
      targetWeight: z.number(),
      targetReps: z.string(),
      targetSets: z.number(),
    })
  ),
  formTips: z.array(z.string()),
  recoveryTips: z.array(z.string()),
  plateauWarnings: z.array(z.string()),
});

export type AiAnalyzeResponse = z.infer<typeof aiAnalyzeResponseSchema>;

// ---- Query params ----
export const workoutQuerySchema = z.object({
  muscleGroup: MuscleGroupEnum.optional(),
  exercise: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
