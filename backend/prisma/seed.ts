// ---------------------------------------------------------------
// OverloadHQ – Database Seed
// Seeds the Exercise library with common exercises.
// Run: npx tsx prisma/seed.ts
// ---------------------------------------------------------------

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXERCISES = [
  { name: "Lat Pulldown", muscleGroup: "BACK" },
  { name: "Vertical Row", muscleGroup: "BACK" },
  { name: "Upper Back Row", muscleGroup: "BACK" },
  { name: "Seated Cable Row", muscleGroup: "BACK" },
  { name: "Barbell Row", muscleGroup: "BACK" },
  { name: "Dumbbell Row", muscleGroup: "BACK" },
  { name: "T-Bar Row", muscleGroup: "BACK" },
  { name: "Pull-Up", muscleGroup: "BACK" },
  { name: "Chin-Up", muscleGroup: "BACK" },
  { name: "Deadlift", muscleGroup: "BACK" },
  { name: "Bench Press", muscleGroup: "CHEST" },
  { name: "Incline Bench Press", muscleGroup: "CHEST" },
  { name: "Decline Bench Press", muscleGroup: "CHEST" },
  { name: "Dumbbell Bench Press", muscleGroup: "CHEST" },
  { name: "Incline Dumbbell Press", muscleGroup: "CHEST" },
  { name: "Cable Fly", muscleGroup: "CHEST" },
  { name: "Chest Fly Machine", muscleGroup: "CHEST" },
  { name: "Push-Up", muscleGroup: "CHEST" },
  { name: "Dip", muscleGroup: "CHEST" },
  { name: "Overhead Press", muscleGroup: "SHOULDERS" },
  { name: "Dumbbell Shoulder Press", muscleGroup: "SHOULDERS" },
  { name: "Lateral Raise", muscleGroup: "SHOULDERS" },
  { name: "Rear Delt Fly", muscleGroup: "SHOULDERS" },
  { name: "Face Pull", muscleGroup: "SHOULDERS" },
  { name: "Front Raise", muscleGroup: "SHOULDERS" },
  { name: "Arnold Press", muscleGroup: "SHOULDERS" },
  { name: "Upright Row", muscleGroup: "SHOULDERS" },
  { name: "Squat", muscleGroup: "LEGS" },
  { name: "Front Squat", muscleGroup: "LEGS" },
  { name: "Leg Press", muscleGroup: "LEGS" },
  { name: "Romanian Deadlift", muscleGroup: "LEGS" },
  { name: "Leg Curl", muscleGroup: "LEGS" },
  { name: "Leg Extension", muscleGroup: "LEGS" },
  { name: "Bulgarian Split Squat", muscleGroup: "LEGS" },
  { name: "Lunge", muscleGroup: "LEGS" },
  { name: "Hip Thrust", muscleGroup: "LEGS" },
  { name: "Calf Raise", muscleGroup: "LEGS" },
  { name: "Barbell Curl", muscleGroup: "BICEPS" },
  { name: "Dumbbell Curl", muscleGroup: "BICEPS" },
  { name: "Hammer Curl", muscleGroup: "BICEPS" },
  { name: "Preacher Curl", muscleGroup: "BICEPS" },
  { name: "Cable Curl", muscleGroup: "BICEPS" },
  { name: "Concentration Curl", muscleGroup: "BICEPS" },
  { name: "Tricep Pushdown", muscleGroup: "TRICEPS" },
  { name: "Skull Crusher", muscleGroup: "TRICEPS" },
  { name: "Overhead Tricep Extension", muscleGroup: "TRICEPS" },
  { name: "Close-Grip Bench Press", muscleGroup: "TRICEPS" },
  { name: "Tricep Dip", muscleGroup: "TRICEPS" },
  { name: "Plank", muscleGroup: "CORE" },
  { name: "Hanging Leg Raise", muscleGroup: "CORE" },
  { name: "Cable Crunch", muscleGroup: "CORE" },
  { name: "Ab Wheel Rollout", muscleGroup: "CORE" },
  { name: "Russian Twist", muscleGroup: "CORE" },
  { name: "Treadmill Run", muscleGroup: "CARDIO" },
  { name: "Stationary Bike", muscleGroup: "CARDIO" },
  { name: "Rowing Machine", muscleGroup: "CARDIO" },
  { name: "Stair Climber", muscleGroup: "CARDIO" },
  { name: "Jump Rope", muscleGroup: "CARDIO" },
] as const;

async function seed() {
  console.log("🌱 Seeding exercise library...");

  const result = await prisma.exercise.createMany({
    data: EXERCISES.map((e) => ({
      name: e.name,
      muscleGroup: e.muscleGroup as any,
      createdByUserId: null,
    })),
    skipDuplicates: true,
  });

  console.log(`✅ Successfully seeded exercises (count: ${result.count})`);
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
