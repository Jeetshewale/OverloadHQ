// ---------------------------------------------------------------
// OverloadHQ – AI Coach Routes
// POST /ai/analyze
// Uses Gemini (primary) → Groq (fallback) → Rule engine (final)
// ---------------------------------------------------------------

import { Router, Request, Response } from "express";
import { prisma, withRetry } from "../db";
import { authMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { config } from "../config";
import { logger } from "../logger";
import { aiAnalyzeResponseSchema, AiAnalyzeResponse } from "../schemas";
import { AppError } from "../middleware/errorHandler";
import { generateRuleBasedAnalysis } from "../services/ruleEngine";
import { callGemini } from "../services/gemini";
import { callGroq } from "../services/groq";

const router = Router();

// ---- Analyze ----
router.post(
  "/analyze",
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Check user daily limit (3 per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userCacheCount = await withRetry(() =>
      prisma.aiCache.count({
        where: {
          userId,
          createdAt: { gte: today },
        },
      })
    );

    if (userCacheCount >= config.ai.userDailyLimit) {
      // Return cached result if available
      const cached = await prisma.aiCache.findFirst({
        where: { userId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      });
      if (cached) {
        res.json({
          analysis: JSON.parse(cached.payloadJson),
          cached: true,
          source: "cache",
        });
        return;
      }
      throw new AppError(
        429,
        "Daily AI analysis limit reached. Try again tomorrow!"
      );
    }

    // Check for valid cache
    const validCache = await prisma.aiCache.findFirst({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (validCache) {
      res.json({
        analysis: JSON.parse(validCache.payloadJson),
        cached: true,
        source: "cache",
      });
      return;
    }

    // Get user data
    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          goal: true,
          experienceLevel: true,
          bodyWeightKg: true,
          preferredUnit: true,
        },
      })
    );

    if (!user) throw new AppError(404, "User not found");

    // Get last 8 weeks of workouts
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const workouts = await withRetry(() =>
      prisma.workout.findMany({
        where: { userId, date: { gte: eightWeeksAgo } },
        include: {
          sets: {
            orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }],
          },
        },
        orderBy: { date: "asc" },
      })
    );

    if (workouts.length === 0) {
      throw new AppError(
        400,
        "Log some workouts first so the AI coach can analyze your progress!"
      );
    }

    // Check global daily quota
    const globalUsage = await prisma.aiUsage.upsert({
      where: { date: today },
      update: {},
      create: { date: today, count: 0 },
    });

    const useAI = globalUsage.count < config.ai.dailyLimit;

    let analysis: AiAnalyzeResponse;
    let source = "rule_engine";

    if (useAI) {
      // Build prompt
      const prompt = buildPrompt(user, workouts);

      try {
        // Try Gemini first
        if (config.ai.geminiApiKey) {
          const raw = await callGemini(prompt);
          const parsed = parseAiResponse(raw);
          if (parsed) {
            analysis = parsed;
            source = "gemini";
            await prisma.aiUsage.update({
              where: { date: today },
              data: { count: { increment: 1 } },
            });
          } else {
            throw new Error("Failed to parse Gemini response");
          }
        } else {
          throw new Error("No Gemini API key");
        }
      } catch (geminiErr) {
        logger.warn({ err: geminiErr }, "Gemini failed, trying Groq");

        try {
          // Fallback to Groq
          if (config.ai.groqApiKey) {
            const raw = await callGroq(prompt);
            const parsed = parseAiResponse(raw);
            if (parsed) {
              analysis = parsed;
              source = "groq";
              await prisma.aiUsage.update({
                where: { date: today },
                data: { count: { increment: 1 } },
              });
            } else {
              throw new Error("Failed to parse Groq response");
            }
          } else {
            throw new Error("No Groq API key");
          }
        } catch (groqErr) {
          logger.warn({ err: groqErr }, "Groq failed, using rule engine");
          analysis = generateRuleBasedAnalysis(user, workouts);
          source = "rule_engine";
        }
      }
    } else {
      logger.info("AI daily quota reached, using rule engine");
      analysis = generateRuleBasedAnalysis(user, workouts);
      source = "rule_engine";
    }

    // Cache the result
    await prisma.aiCache.create({
      data: {
        userId,
        payloadJson: JSON.stringify(analysis!),
        expiresAt: new Date(
          Date.now() + config.ai.cacheTtlHours * 60 * 60 * 1000
        ),
      },
    });

    res.json({ analysis: analysis!, cached: false, source });
  })
);

function buildPrompt(user: any, workouts: any[]): string {
  const workoutSummary = workouts
    .map((w) => {
      const sets = w.sets
        .map(
          (s: any) =>
            `  ${s.exerciseName}: ${s.weightKg}kg x ${s.reps}${s.repsMax ? `-${s.repsMax}` : ""} reps (set ${s.setNumber})${s.isFormImproved ? " [form improved]" : ""}`
        )
        .join("\n");
      return `${w.date.toISOString().split("T")[0]} (${w.dayName}) – ${w.muscleGroup}:\n${sets}`;
    })
    .join("\n\n");

  return `You are an expert gym coach AI for a progressive overload tracking app.

USER PROFILE:
- Name: ${user.name}
- Goal: ${user.goal}
- Experience: ${user.experienceLevel}
- Body weight: ${user.bodyWeightKg ? user.bodyWeightKg + " kg" : "not set"}

RECENT WORKOUTS (last 8 weeks):
${workoutSummary}

ANALYSIS INSTRUCTIONS:
1. Analyze progressive overload across sessions for each exercise.
2. Use DOUBLE PROGRESSION: add reps until top of rep range, then increase weight by smallest increment (2.5 kg, or 1-2 kg for small muscles like rear delts).
3. Detect plateaus (no improvement over 3 sessions of the same exercise).
4. Tailor advice to the user's goal: ${user.goal}.
5. Consider their experience level: ${user.experienceLevel}.

Respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "summary": "1-2 sentence overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "nextWeekPlan": [
    {"exercise": "Exercise Name", "targetWeight": 55, "targetReps": "8-10", "targetSets": 3}
  ],
  "formTips": ["tip 1"],
  "recoveryTips": ["tip 1"],
  "plateauWarnings": ["warning if any, or empty array"]
}`;
}

function parseAiResponse(raw: string): AiAnalyzeResponse | null {
  try {
    // Try to extract JSON from the response
    let json = raw.trim();

    // Remove markdown code blocks if present
    if (json.startsWith("```")) {
      json = json.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(json);
    const validated = aiAnalyzeResponseSchema.parse(parsed);
    return validated;
  } catch (err) {
    logger.warn({ err, raw: raw.substring(0, 200) }, "Failed to parse AI response");
    return null;
  }
}

export default router;
