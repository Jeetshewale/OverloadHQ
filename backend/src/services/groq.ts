// ---------------------------------------------------------------
// OverloadHQ – Groq AI Service (Fallback)
// Uses Groq free tier via REST API.
// Check https://console.groq.com/docs/models for current free models.
// Free tier: ~30 RPM, 14400 RPD (as of late 2024).
// ---------------------------------------------------------------

import { config } from "../config";
import { logger } from "../logger";

export async function callGroq(prompt: string): Promise<string> {
  const apiKey = config.ai.groqApiKey;
  const model = config.ai.groqModel;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert gym coach. Respond with ONLY valid JSON, no markdown or code blocks.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(
      { status: response.status, body: errorText },
      "Groq API error"
    );
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    logger.error({ data }, "Groq returned no text");
    throw new Error("Groq returned empty response");
  }

  return text;
}
