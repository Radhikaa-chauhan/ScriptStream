import { anthropic, withRetry } from "../../utils/anthropic";
import { State } from "../state";
import { emitStatus } from "../../../server";
import { z } from "zod";

const SafetyWarningsSchema = z.object({
  warnings: z.array(z.string())
});

/**
 * Safety Agent Node
 * Responsible for cross-referencing extracted medications against medical RAG context
 * to flag dangerous interactions.
 */
export const safetyNode = async (state: State) => {
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

  const toolDefinition = {
    name: "flag_safety_interactions",
    description: "Identify severe drug interactions based on the provided medical context.",
    input_schema: {
      type: "object",
      properties: {
        warnings: {
          type: "array",
          items: { type: "string", description: "A clear warning message about a specific interaction." },
          description: "List of identified drug-drug or drug-condition interactions."
        }
      },
      required: ["warnings"]
    }
  };

  const runSafetyAgent = async () => {
    return await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1500,
      system: "You are an expert clinical pharmacist AI. Review the medications and RAG context using the flag_safety_interactions tool. If no severe interactions are found, return an empty array.",
      tools: [toolDefinition as any],
      tool_choice: { type: "tool", name: "flag_safety_interactions" },
      messages: [
        {
          role: "user",
          content: `Medications to evaluate: ${medicationNames}\n\nMedical Literature (RAG Context):\n${state.ragContext || "No specific literature found for these drugs."}\n\nEvaluate the safety of this combination.`,
        },
      ],
    });
  };

  try {
    const response = await withRetry(runSafetyAgent);
    
    const toolUse = response.content.find((c: any) => c.type === "tool_use") as any;
    
    if (!toolUse) {
      throw new Error("Safety Agent failed to use the warning tool.");
    }

    // Validate with Zod
    const { warnings } = SafetyWarningsSchema.parse(toolUse.input);
    
    if (warnings.length > 0) {
      emitStatus("warning", `Safety Agent: Found ${warnings.length} potential interaction(s).`);
    } else {
      emitStatus("success", "Safety Agent: No dangerous interactions detected.");
    }
    
    return {
      safetyWarnings: [...state.safetyWarnings, ...warnings],
      executionLogs: [...state.executionLogs, "Safety Agent: Evaluation complete with Tool Calling."],
      status: "safety_check_complete"
    };
  } catch (error: any) {
    emitStatus("error", `Safety Agent: ${error.message || "Failed to analyze safety."}`);
    throw error;
  }
};
