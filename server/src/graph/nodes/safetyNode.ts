import { gemini, withRetryGemini } from "../../utils/gemini";
import { State } from "../state";
import { emitStatus } from "../../sockets/socketEvents";
import { z } from "zod";

const SafetyWarningsSchema = z.object({
  warnings: z.array(z.string()),
});

/**
 * Safety Agent Node
 * Responsible for cross-referencing extracted medications against medical RAG context
 * to flag dangerous interactions.
 */
export const safetyNode = async (state: State) => {
  console.log("[SAFETY] Starting safety node...");
  emitStatus(
    "processing",
    "Safety Agent: Checking for dangerous drug interactions...",
  );

  // If no medications were extracted, we can skip safety checks.
  if (!state.extractedData || state.extractedData.medications.length === 0) {
    console.log("[SAFETY] No medications to analyze, skipping safety checks");
    return {
      safetyWarnings: ["No medications found to analyze."],
      executionLogs: [
        ...state.executionLogs,
        "Safety Agent: Skipped (no medications).",
      ],
      status: "safety_check_complete",
    };
  }

  const medicationNames = state.extractedData.medications
    .map((m) => m.name)
    .join(", ");
  console.log("[SAFETY] Analyzing medications:", medicationNames);

  const runSafetyAgent = async () => {
    return await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert clinical pharmacist AI. Review the medications and RAG context to identify drug interaction warnings. Return ONLY a valid JSON object with no markdown formatting.

Medications to evaluate: ${medicationNames}

Medical Literature (RAG Context):
${state.ragContext || "No specific literature found for these drugs."}

Return a JSON object like this:
{
  "warnings": ["warning1", "warning2"]
}

If no severe interactions are found, return an empty array.`,
    });
  };

  try {
    const response = await withRetryGemini(runSafetyAgent);

    // Extract text from Gemini response
    const responseText = response.text || "";

    if (!responseText) {
      throw new Error("Safety Agent returned empty response.");
    }

    // Parse JSON from response (handle potential markdown formatting)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    const parsedResponse = JSON.parse(jsonStr);

    // Validate with Zod
    const { warnings } = SafetyWarningsSchema.parse(parsedResponse);

    if (warnings.length > 0) {
      emitStatus(
        "warning",
        `Safety Agent: Found ${warnings.length} potential interaction(s).`,
      );
    } else {
      emitStatus(
        "success",
        "Safety Agent: No dangerous interactions detected.",
      );
    }

    return {
      safetyWarnings: [...state.safetyWarnings, ...warnings],
      executionLogs: [
        ...state.executionLogs,
        "Safety Agent: Evaluation complete with Gemini JSON parsing.",
      ],
      status: "safety_check_complete",
    };
  } catch (error: any) {
    emitStatus(
      "error",
      `Safety Agent: ${error.message || "Failed to analyze safety."}`,
    );
    throw error;
  }
};
