// ---------------------------------------------------------------
// OverloadHQ – Express App Entry Point
// ---------------------------------------------------------------

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config, APP_NAME } from "./config";
import { logger } from "./logger";
import { errorHandler } from "./middleware/errorHandler";

// Routes
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import workoutRouter from "./routes/workouts";
import exerciseRouter from "./routes/exercises";
import progressRouter from "./routes/progress";
import exportRouter from "./routes/export";
import aiRouter from "./routes/ai";

const app = express();

// ---- Security ----
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins (localhost, vercel deployments, mobile, proxies) with credentials
      callback(null, true);
    },
    credentials: true,
  })
);

// ---- Body parsing ----
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ---- Rate limiting ----
// In development, allow high threshold so testing is never blocked
const isDev = config.nodeEnv !== "production";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  message: { error: "Too many requests, try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
});

if (!isDev) {
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/register", authLimiter);
  app.use("/api/v1", generalLimiter);
}

// ---- Request logging ----
app.use((req, _res, next) => {
  logger.debug({ method: req.method, path: req.path }, "Request");
  next();
});

// ---- Health check ----
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: APP_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    app: APP_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ---- API Routes ----
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/workouts", workoutRouter);
app.use("/api/v1/exercises", exerciseRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/export", exportRouter);
app.use("/api/v1/ai", aiRouter);

// ---- 404 ----
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ---- Error handler ----
app.use(errorHandler);

// ---- Start ----
const host = "0.0.0.0";
app.listen(config.port, host, () => {
  logger.info(
    { port: config.port, host, env: config.nodeEnv, app: APP_NAME },
    `${APP_NAME} backend running`
  );
  if (config.inviteCode) {
    logger.info("Invite code is ENABLED – registration requires a code");
  }
  if (!config.isSmtpConfigured) {
    logger.info(
      "SMTP not configured – forgot-password feature is disabled. Use scripts/reset-password.ts"
    );
  }
  logger.info(`CORS origin: ${config.frontendUrl}`);
  logger.info(`Social features: ${config.features.social ? "ON" : "OFF"}`);
});

export default app;
