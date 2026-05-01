import { Anthropic } from "@anthropic-ai/sdk";
import { State } from "../state";
import { emitStatus } from "../../../server";

/**
 * Safety Agent Node
 * Responsible for cross-referencing extracted medications against medical RAG context
 * to flag dangerous interactions.
 */
export const safetyNode = async (state: State) => {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  emitStatus("processing", "Safety Agent: Checking for dangerous drug interactions...");

  // If no medications were extracted, we can skip safety checks.
  if (!state.extractedData || state.extractedData.medications.length === 0) {
    return {
      safetyWarnings: ["No medications found to analyze."],
      executionLogs: [...state.executionLogs, "Safety Agent: Skipped (no medications)."],
      status: "safety_check_complete"
    };
  }

  const medicationNames = state.extractedData.medications.map(m => m.name).join(", ");

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1500,
    system: `You are an expert clinical pharmacist AI.
    Your task is to review the patient's medication list and cross-reference it against the provided medical literature (RAG Context).
    
    CRITICAL RULES:
    1. Only use the provided RAG Context to determine safety. Do not hallucinate interactions.
    2. Identify severe, life-threatening, or highly contraindicated interactions.
    3. Output your findings as a strict JSON array of strings, where each string is a clear warning message.
    4. If no severe interactions are found, return an empty array [].
    5. Do not include any other text besides the JSON array.
    
    Example Output (Dangerous):
    ["SEVERE: Lisinopril and Potassium Supplements can cause hyperkalemia.", "WARNING: Ibuprofen may reduce the efficacy of Lisinopril."]
    
    Example Output (Safe):
    []`,
    messages: [
      {
        role: "user",
        content: `Medications to evaluate: ${medicationNames}\n\nMedical Literature (RAG Context):\n${state.ragContext || "No specific literature found for these drugs."}\n\nEvaluate the safety of this combination. Return the JSON array of warnings.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Safety Agent");
  }

  try {
    const warnings = JSON.parse(content.text);
    
    if (!Array.isArray(warnings)) {
      throw new Error("Safety Agent did not return a JSON array");
    }

    if (warnings.length > 0) {
      emitStatus("warning", `Safety Agent: Found ${warnings.length} potential interaction(s).`);
    } else {
      emitStatus("success", "Safety Agent: No dangerous interactions detected.");
    }
    
    return {
      safetyWarnings: [...state.safetyWarnings, ...warnings],
      executionLogs: [...state.executionLogs, "Safety Agent: Evaluation complete."],
      status: "safety_check_complete"
    };
  } catch (error) {
    emitStatus("error", "Safety Agent: Failed to parse evaluation result.");
    throw new Error("Failed to parse JSON from Safety Agent");
  }
};
