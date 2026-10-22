// ---------------------------------------------------------------
// OverloadHQ – Exercise Library Routes
// GET/POST /exercises
// ---------------------------------------------------------------

import { Router, Request, Response } from "express";
import { prisma, withRetry } from "../db";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import { createExerciseSchema } from "../schemas";

const router = Router();

// ---- List Exercises ----
// Returns global exercises (createdByUserId is null) + user's custom exercises
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { muscleGroup } = req.query;

    const where: any = {
      OR: [{ createdByUserId: null }, { createdByUserId: userId }],
    };

    if (muscleGroup) {
      where.muscleGroup = muscleGroup as string;
    }

    const exercises = await withRetry(() =>
      prisma.exercise.findMany({
        where,
        orderBy: { name: "asc" },
      })
    );

    res.json({ exercises });
  })
);

// ---- Create Custom Exercise ----
router.post(
  "/",
  authMiddleware,
  validate(createExerciseSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { name, muscleGroup } = req.body;

    // Try to create; if unique constraint fails, just return existing
    let exercise;
    try {
      exercise = await withRetry(() =>
        prisma.exercise.create({
          data: { name, muscleGroup, createdByUserId: userId },
        })
      );
    } catch {
      exercise = await prisma.exercise.findFirst({
        where: { name, createdByUserId: userId },
      });
    }

    res.status(201).json({ exercise });
  })
);

export default router;
