// ---------------------------------------------------------------
// OverloadHQ – Auth Middleware
// JWT in httpOnly cookie, extracts userId for downstream handlers.
// ---------------------------------------------------------------

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { logger } from "../logger";

export interface AuthPayload {
  userId: string;
  email: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[config.jwt.cookieName];

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.user = payload;
    next();
  } catch (err) {
    logger.debug({ err }, "Invalid JWT");
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry as string,
  });
}

export function setTokenCookie(res: Response, token: string): void {
  res.cookie(config.jwt.cookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

export function clearTokenCookie(res: Response): void {
  res.clearCookie(config.jwt.cookieName, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: "/",
  });
}
