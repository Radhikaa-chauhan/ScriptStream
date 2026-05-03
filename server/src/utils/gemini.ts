import { GoogleGenAI, Type, Schema } from "@google/genai";


console.log("[GEMINI] Loading Gemini client...");


/**
 * Centralized Gemini AI Client
 */
export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
console.log("[GEMINI] ✅ Gemini client initialized with API key");

/**
 * Basic retry wrapper for AI calls (Reused for Gemini)
 */
export const withRetryGemini = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      console.error("[GEMINI] ❌ Max retries exhausted");
      throw error;
    }
    console.warn(`[GEMINI] ⏰ Gemini API call failed. Retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetryGemini(fn, retries - 1, delay * 2);
  }
};
