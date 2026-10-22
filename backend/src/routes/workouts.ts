// ---------------------------------------------------------------
// OverloadHQ – Workout Routes
// GET/POST /workouts, GET/PUT/DELETE /workouts/:id
// POST /workouts/sample, DELETE /workouts/sample
// ---------------------------------------------------------------

import { Router, Request, Response } from "express";
import { prisma, withRetry } from "../db";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  workoutQuerySchema,
} from "../schemas";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// Day name helper
function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

// ---- List Workouts ----
router.get(
  "/",
  authMiddleware,
  validate(workoutQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { muscleGroup, exercise, dateFrom, dateTo, page, limit } = req.query as any;

    const where: any = { userId };

    if (muscleGroup) where.muscleGroup = muscleGroup;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }
    if (exercise) {
      where.sets = { some: { exerciseName: { contains: exercise, mode: "insensitive" } } };
    }

    const skip = ((page as number) - 1) * (limit as number);

    const [workouts, total] = await withRetry(() =>
      prisma.$transaction([
        prisma.workout.findMany({
          where,
          include: {
            sets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
          },
          orderBy: { date: "desc" },
          skip,
          take: limit as number,
        }),
        prisma.workout.count({ where }),
      ])
    );

    res.json({
      workouts,
      pagination: {
        page: page as number,
        limit: limit as number,
        total,
        totalPages: Math.ceil(total / (limit as number)),
      },
    });
  })
);

// ---- Get Single Workout ----
router.get(
  "/:id",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const workout = await withRetry(() =>
      prisma.workout.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
        include: {
          sets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
        },
      })
    );

    if (!workout) throw new AppError(404, "Workout not found");
    res.json({ workout });
  })
);

// ---- Create Workout ----
router.post(
  "/",
  authMiddleware,
  validate(createWorkoutSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { date, muscleGroup, notes, isSample, sets } = req.body;

    const parsedDate = new Date(date);
    const dayName = getDayName(parsedDate);

    const workout = await withRetry(() =>
      prisma.workout.create({
        data: {
          userId,
          date: parsedDate,
          dayName,
          muscleGroup,
          notes,
          isSample: isSample || false,
          sets: {
            create: sets.map((s: any) => ({
              exerciseName: s.exerciseName,
              setNumber: s.setNumber,
              weightKg: s.weightKg,
              reps: s.reps,
              repsMax: s.repsMax || null,
              isFormImproved: s.isFormImproved || false,
              formNote: s.formNote || null,
            })),
          },
        },
        include: {
          sets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
        },
      })
    );

    // Auto-save custom exercise names to the user's library
    const exerciseNames = [...new Set(sets.map((s: any) => s.exerciseName))] as string[];
    for (const name of exerciseNames) {
      // Try to create a user-specific exercise entry; ignore if already exists
      await prisma.exercise.create({
        data: {
          name,
          muscleGroup,
          createdByUserId: userId,
        },
      }).catch(() => {
        // Already exists — that's fine
      });
    }

    res.status(201).json({ workout });
  })
);

// ---- Update Workout ----
router.put(
  "/:id",
  authMiddleware,
  validate(updateWorkoutSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Verify ownership
    const existing = await withRetry(() =>
      prisma.workout.findFirst({
        where: { id: req.params.id, userId },
      })
    );

    if (!existing) throw new AppError(404, "Workout not found");

    const { date, muscleGroup, notes, sets } = req.body;

    const updateData: any = {};
    if (date) {
      const parsedDate = new Date(date);
      updateData.date = parsedDate;
      updateData.dayName = getDayName(parsedDate);
    }
    if (muscleGroup) updateData.muscleGroup = muscleGroup;
    if (notes !== undefined) updateData.notes = notes;

    // If sets are provided, replace all sets
    if (sets) {
      await prisma.exerciseSet.deleteMany({
        where: { workoutId: req.params.id },
      });

      updateData.sets = {
        create: sets.map((s: any) => ({
          exerciseName: s.exerciseName,
          setNumber: s.setNumber,
          weightKg: s.weightKg,
          reps: s.reps,
          repsMax: s.repsMax || null,
          isFormImproved: s.isFormImproved || false,
          formNote: s.formNote || null,
        })),
      };
    }

    const workout = await withRetry(() =>
      prisma.workout.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          sets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
        },
      })
    );

    res.json({ workout });
  })
);

// ---- Delete Workout ----
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await withRetry(() =>
      prisma.workout.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
      })
    );

    if (!existing) throw new AppError(404, "Workout not found");

    await prisma.workout.delete({ where: { id: req.params.id } });
    res.json({ message: "Workout deleted" });
  })
);

// ---- Load Sample Data ----
// NOTE: This route MUST be registered BEFORE the /:id route
// But Express matches in order, so we use the full path /sample
router.post(
  "/sample",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Check if sample already exists
    const existing = await withRetry(() =>
      prisma.workout.findFirst({ where: { userId, isSample: true } })
    );

    if (existing) {
      throw new AppError(409, "Sample data already loaded");
    }

    const sampleDate = new Date("2026-10-22T10:00:00Z");

    const workout = await withRetry(() =>
      prisma.workout.create({
        data: {
          userId,
          date: sampleDate,
          dayName: getDayName(sampleDate),
          muscleGroup: "BACK",
          notes: "Sample Back Day – delete this anytime!",
          isSample: true,
          sets: {
            create: [
              { exerciseName: "Lat Pulldown", setNumber: 1, weightKg: 50, reps: 8, repsMax: 9 },
              { exerciseName: "Lat Pulldown", setNumber: 2, weightKg: 55, reps: 8, repsMax: 9 },
              { exerciseName: "Vertical Row", setNumber: 1, weightKg: 65, reps: 7 },
              { exerciseName: "Vertical Row", setNumber: 2, weightKg: 70, reps: 5 },
              { exerciseName: "Upper Back Row", setNumber: 1, weightKg: 50, reps: 8 },
              { exerciseName: "Upper Back Row", setNumber: 2, weightKg: 60, reps: 6 },
              { exerciseName: "Rear Delt Fly", setNumber: 1, weightKg: 5, reps: 8 },
              { exerciseName: "Rear Delt Fly", setNumber: 2, weightKg: 10, reps: 5 },
            ],
          },
        },
        include: { sets: true },
      })
    );

    res.status(201).json({ workout });
  })
);

// ---- Delete Sample Data ----
router.delete(
  "/sample/all",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await withRetry(() =>
      prisma.workout.deleteMany({
        where: { userId: req.user!.userId, isSample: true },
      })
    );

    res.json({ message: `Deleted ${result.count} sample workout(s)` });
  })
);

export default router;
