import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

console.log("[AI] Loading OpenRouter client via OpenAI SDK...");

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5174",
    "X-Title": "ScriptStream",
  },
});

console.log("[AI] ✅ OpenRouter client ready");

/**
 * ✅ FREE MODELS (TEXT)
 */
const TEXT_MODELS = [
  "tencent/hy3-preview:free"
];

/**
 * ✅ FREE VISION MODELS
 */
const VISION_MODELS = [
  "openbmb/minicpm-v",
];

/**
 * 🔥 MAIN AI FUNCTION (AUTO MODEL + FALLBACK)
 */
export const askAI = async (
  prompt: string,
  model?: string,
  image?: { data: string; mimeType: string }
): Promise<string> => {

  // 🔥 Choose model list
  const modelsToTry = image
    ? VISION_MODELS
    : model
      ? [model]
      : TEXT_MODELS;

  for (const m of modelsToTry) {
    try {
      console.log(`[AI] Trying model: ${m}`);

      const message: any = image
        ? [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${image.mimeType};base64,${image.data}`,
            },
          },
        ]
        : prompt;

      const res = await openrouter.chat.completions.create({
        model: m,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      });

      const content = res.choices[0]?.message?.content;

      if (content) {
        console.log(`[AI] ✅ Success with ${m}`);
        return content;
      }

    } catch (err: any) {
      console.warn(`[AI] ❌ Model ${m} failed:`, err?.response?.data || err.message);

      // 🔥 skip to next model
      continue;
    }
  }

  throw new Error("All models failed (free tier exhausted or unavailable)");
};

/**
 * 🔁 RETRY WRAPPER
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      console.error("[AI] ❌ Max retries exhausted");
      throw error;
    }

    console.warn(
      `[AI] ⏰ Retrying in ${delay}ms... (${retries} retries left)`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
};

/**
 * 🧠 JSON EXTRACTOR (VERY IMPORTANT)
 */
export const extractJSON = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        throw new Error("Invalid JSON format inside response.");
      }
    }
    throw new Error("No JSON found in response.");
  }
};