// ---------------------------------------------------------------
// OverloadHQ – Gemini AI Service
// Uses Google Gemini free tier via REST API.
// Check https://ai.google.dev/models for current free model names.
// Free tier: 1500 RPD, 1M TPM, 15 RPM (as of late 2024).
// ---------------------------------------------------------------

import { config } from "../config";
import { logger } from "../logger";

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = config.ai.geminiApiKey;
  const model = config.ai.geminiModel;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(
      { status: response.status, body: errorText },
      "Gemini API error"
    );
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    logger.error({ data }, "Gemini returned no text");
    throw new Error("Gemini returned empty response");
  }

  return text;
}
