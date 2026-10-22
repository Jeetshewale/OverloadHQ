// ---------------------------------------------------------------
// OverloadHQ – CSV Export Route
// GET /export/csv
// ---------------------------------------------------------------

import { Router, Request, Response } from "express";
import { prisma, withRetry } from "../db";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

router.get(
  "/csv",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const workouts = await withRetry(() =>
      prisma.workout.findMany({
        where: { userId },
        include: {
          sets: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
        },
        orderBy: { date: "asc" },
      })
    );

    // Get user for unit preference
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredUnit: true },
    });

    const isLb = user?.preferredUnit === "LB";
    const kgToLb = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;

    const unit = isLb ? "lb" : "kg";
    const header = `Date,Day,Muscle Group,Exercise,Set,Weight (${unit}),Reps,Reps Max,Form Improved,Form Note,Notes\n`;

    const rows = workouts.flatMap((w) =>
      w.sets.map((s) => {
        const weight = isLb ? kgToLb(s.weightKg) : s.weightKg;
        return [
          w.date.toISOString().split("T")[0],
          w.dayName,
          w.muscleGroup,
          s.exerciseName,
          s.setNumber,
          weight,
          s.reps,
          s.repsMax || "",
          s.isFormImproved ? "Yes" : "No",
          `"${(s.formNote || "").replace(/"/g, '""')}"`,
          `"${(w.notes || "").replace(/"/g, '""')}"`,
        ].join(",");
      })
    );

    const csv = header + rows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="overloadhq_export_${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csv);
  })
);

export default router;
