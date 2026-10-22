// ---------------------------------------------------------------
// OverloadHQ – Email Service
// Uses Brevo free SMTP when configured. Silent no-op otherwise.
// ---------------------------------------------------------------

import nodemailer from "nodemailer";
import { config, APP_NAME } from "../config";
import { logger } from "../logger";

let transporter: nodemailer.Transporter | null = null;

if (config.isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false, // STARTTLS
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  if (!transporter) {
    logger.warn("SMTP not configured, skipping password reset email");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${config.smtp.from}>`,
      to,
      subject: `${APP_NAME} – Reset your password`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #10b981;">${APP_NAME}</h2>
          <p>You requested a password reset. Click the link below (valid for 1 hour):</p>
          <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px;">Reset Password</a></p>
          <p style="color: #888; font-size: 13px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
    logger.info({ to }, "Password reset email sent");
  } catch (err) {
    logger.error({ err, to }, "Failed to send password reset email");
    throw new Error("Failed to send email");
  }
}
