// ---------------------------------------------------------------
// OverloadHQ – Admin: User Count Script
// Usage: npx tsx scripts/user-count.ts
// ---------------------------------------------------------------

import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function userCount() {
  const count = await prisma.user.count();
  const users = await prisma.user.findMany({
    select: { username: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log(`\n📊 Total users: ${count}\n`);
  if (users.length > 0) {
    console.log("Recent users:");
    for (const u of users) {
      console.log(`  ${u.username} (${u.email}) – joined ${u.createdAt.toLocaleDateString()}`);
    }
  }
}

userCount()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
