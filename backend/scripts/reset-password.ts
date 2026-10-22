// ---------------------------------------------------------------
// OverloadHQ – Admin: Reset Password Script
// Usage: npx tsx scripts/reset-password.ts <email> <newPassword>
// For when SMTP is not configured.
// ---------------------------------------------------------------

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";

const prisma = new PrismaClient();

async function resetPassword() {
  const [, , email, newPassword] = process.argv;

  if (!email || !newPassword) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> <newPassword>");
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash: hash },
  });

  console.log(`✅ Password reset for ${email} (user: ${user.username})`);
}

resetPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
