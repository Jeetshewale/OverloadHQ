// ---------------------------------------------------------------
// OverloadHQ – Auth Routes
// POST /auth/register, /auth/login, /auth/logout
// POST /auth/forgot, /auth/reset
// GET  /auth/me
// ---------------------------------------------------------------

import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma, withRetry } from "../db";
import { config } from "../config";
import { logger } from "../logger";
import {
  authMiddleware,
  generateToken,
  setTokenCookie,
  clearTokenCookie,
} from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas";
import { AppError } from "../middleware/errorHandler";
import { sendPasswordResetEmail } from "../services/email";

const router = Router();
const SALT_ROUNDS = 12;

// ---- Register ----
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, username, password, name, inviteCode } = req.body;

    // Check invite code if required
    if (config.inviteCode && config.inviteCode !== inviteCode) {
      throw new AppError(403, "Invalid invite code");
    }

    // Check existing user
    const existing = await withRetry(() =>
      prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      })
    );

    if (existing) {
      if (existing.email === email) {
        throw new AppError(409, "Email already registered");
      }
      throw new AppError(409, "Username already taken");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await withRetry(() =>
      prisma.user.create({
        data: { email, username, passwordHash, name },
        select: { id: true, email: true, username: true, name: true, onboardingDone: true },
      })
    );

    const token = generateToken({ userId: user.id, email: user.email });
    setTokenCookie(res, token);

    logger.info({ userId: user.id, username }, "User registered");
    res.status(201).json({ user });
  })
);

// ---- Login ----
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          passwordHash: true,
          onboardingDone: true,
        },
      })
    );

    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Invalid email or password");
    }

    const token = generateToken({ userId: user.id, email: user.email });
    setTokenCookie(res, token);

    logger.info({ userId: user.id }, "User logged in");
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  })
);

// ---- Logout ----
router.post("/logout", (_req: Request, res: Response): void => {
  clearTokenCookie(res);
  res.json({ message: "Logged out" });
});

// ---- Me ----
router.get(
  "/me",
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

    if (!user) {
      throw new AppError(404, "User not found");
    }

    res.json({ user });
  })
);

// ---- Forgot Password ----
router.post(
  "/forgot",
  validate(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!config.isSmtpConfigured) {
      throw new AppError(
        501,
        "Password reset via email is not configured. Contact the admin."
      );
    }

    const { email } = req.body;

    // Always return success to prevent email enumeration
    const user = await withRetry(() =>
      prisma.user.findUnique({ where: { email }, select: { id: true } })
    );

    if (user) {
      // Delete any existing tokens for this user
      await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

      // Generate token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(email, resetUrl);
      logger.info({ userId: user.id }, "Password reset email sent");
    }

    res.json({ message: "If that email exists, a reset link has been sent." });
  })
);

// ---- Reset Password ----
router.post(
  "/reset",
  validate(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const resetRecord = await withRetry(() =>
      prisma.passwordReset.findFirst({
        where: {
          tokenHash,
          expiresAt: { gt: new Date() },
        },
      })
    );

    if (!resetRecord) {
      throw new AppError(400, "Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    logger.info({ userId: resetRecord.userId }, "Password reset successful");
    res.json({ message: "Password has been reset. You can now log in." });
  })
);

export default router;
