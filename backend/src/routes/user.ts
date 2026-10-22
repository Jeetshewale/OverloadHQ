// ---------------------------------------------------------------
// OverloadHQ – User/Profile Routes
// GET/PATCH /user/profile, DELETE /user
// PATCH /user/password
// ---------------------------------------------------------------

import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma, withRetry } from "../db";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import { updateProfileSchema, changePasswordSchema } from "../schemas";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../logger";

const router = Router();
const SALT_ROUNDS = 12;

// ---- Get Profile ----
router.get(
  "/profile",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          goal: true,
          experienceLevel: true,
          bodyWeightKg: true,
          preferredUnit: true,
          visibility: true,
          onboardingDone: true,
          createdAt: true,
        },
      })
    );

    if (!user) throw new AppError(404, "User not found");
    res.json({ user });
  })
);

// ---- Update Profile ----
router.patch(
  "/profile",
  authMiddleware,
  validate(updateProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await withRetry(() =>
      prisma.user.update({
        where: { id: req.user!.userId },
        data: req.body,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          goal: true,
          experienceLevel: true,
          bodyWeightKg: true,
          preferredUnit: true,
          visibility: true,
          onboardingDone: true,
        },
      })
    );

    res.json({ user });
  })
);

// ---- Change Password ----
router.patch(
  "/password",
  authMiddleware,
  validate(changePasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { passwordHash: true },
      })
    );

    if (!user) throw new AppError(404, "User not found");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError(400, "Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash },
    });

    res.json({ message: "Password changed" });
  })
);

// ---- Delete Account ----
router.delete(
  "/",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Prisma cascade handles related records
    await withRetry(() => prisma.user.delete({ where: { id: userId } }));

    logger.info({ userId }, "User deleted their account");
    res.json({ message: "Account and all data permanently deleted" });
  })
);

export default router;
