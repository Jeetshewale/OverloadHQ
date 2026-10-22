// ---------------------------------------------------------------
// OverloadHQ – App Configuration
// Single source of truth for app name and other constants.
// ---------------------------------------------------------------

export const APP_NAME = "OverloadHQ";

export const config = {
  appName: APP_NAME,
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    expiry: process.env.JWT_EXPIRY || "7d",
    cookieName: "overloadhq_token",
  },

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  backendUrl: process.env.BACKEND_URL || "http://localhost:4000",

  inviteCode: process.env.INVITE_CODE || "",

  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    groqApiKey: process.env.GROQ_API_KEY || "",
    groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    dailyLimit: parseInt(process.env.AI_DAILY_LIMIT || "100", 10),
    userDailyLimit: 3,
    cacheTtlHours: 24,
  },

  smtp: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "",
  },

  features: {
    social: process.env.FEATURE_SOCIAL === "true",
  },

  get isSmtpConfigured(): boolean {
    return !!(this.smtp.host && this.smtp.user && this.smtp.pass && this.smtp.from);
  },

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  },
} as const;
