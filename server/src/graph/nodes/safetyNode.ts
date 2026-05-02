import { askAI, withRetry, extractJSON } from "../../utils/ai";
import { State } from "../state";
import { emitStatus } from "../../sockets/socketEvents";
import { z } from "zod";

const SafetyWarningsSchema = z.object({
  warnings: z.array(z.string()),
});

/**
 * Safety Agent Node (OpenRouter Edition)
 */
export const safetyNode = async (state: State) => {
  console.log("[SAFETY] Starting safety node with OpenRouter...");
  emitStatus(
    "processing",
    "Safety Agent: Checking for dangerous drug interactions using Gemma-4...",
  );

  if (!state.extractedData || state.extractedData.medications.length === 0) {
    return {
      safetyWarnings: ["No medications found to analyze."],
      executionLogs: [...state.executionLogs, "Safety Agent: Skipped (no medications)."],
      status: "safety_check_complete",
    };
  }

  const medicationNames = state.extractedData.medications
    .map((m) => m.name)
    .join(", ");

  const prompt = `You are an expert clinical pharmacist AI. Review the medications and RAG context to identify drug interaction warnings. 
Return ONLY a valid JSON object. Do not include markdown code blocks.

Medications to evaluate: ${medicationNames}

Medical Literature (RAG Context):
${state.ragContext || "No specific literature found for these drugs."}

Return a JSON object like this:
{
  "warnings": ["warning1", "warning2"]
}

If no severe interactions are found, return an empty array.`;

  try {
    const responseText = await withRetry(() => askAI(prompt));
    
    if (!responseText) {
      throw new Error("Safety Agent returned empty response.");
    }

    const parsedResponse = extractJSON(responseText);
    
    // Fill in defaults if the reasoning model misses the warnings key
    const rawWarnings = {
      warnings: Array.isArray(parsedResponse.warnings) ? parsedResponse.warnings : []
    };

    const { warnings } = SafetyWarningsSchema.parse(rawWarnings);

    if (warnings.length > 0) {
      emitStatus("warning", `Safety Agent: Found ${warnings.length} potential interaction(s).`);
    } else {
      emitStatus("success", "Safety Agent: No dangerous interactions detected.");
    }

    return {
      safetyWarnings: [...state.safetyWarnings, ...warnings],
      executionLogs: [
        ...state.executionLogs,
        "Safety Agent: Evaluation complete using Gemma-4 via OpenRouter.",
      ],
      status: "safety_check_complete",
    };
  } catch (error: any) {
    emitStatus("error", `Safety Agent: ${error.message || "Failed to analyze safety."}`);
    throw error;
  }
};
