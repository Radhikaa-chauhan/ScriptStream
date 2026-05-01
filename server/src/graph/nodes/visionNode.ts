import { anthropic, withRetry } from "../../utils/anthropic";
import { State, PrescriptionSchema } from "../state";
import { emitStatus } from "../../../server";

/**
 * Vision Agent Node
 * Responsible for reading the prescription image and extracting medication JSON.
 */
export const visionNode = async (state: State) => {
  emitStatus("processing", "Vision Agent: Analyzing prescription image...");

  const toolDefinition = {
    name: "extract_prescription_data",
    description: "Extract medication details from a prescription image.",
    input_schema: {
      type: "object",
      properties: {
        doctorName: { type: "string", description: "Name of the doctor" },
        patientName: { type: "string", description: "Name of the patient" },
        date: { type: "string", description: "Date of the prescription" },
        medications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of the medication" },
              dosage: { type: "string", description: "Dosage (e.g. 500mg)" },
              instructions: { type: "string", description: "How to take it" },
              frequency: { type: "string", description: "How often (e.g. twice daily)" }
            },
            required: ["name", "dosage", "instructions"]
          }
        }
      },
      required: ["medications"]
    }
  };

  const runVisionAgent = async () => {
    return await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2000,
      system: "You are a medical data extraction specialist. Extract all medication information from this prescription image using the provided tool.",
      tools: [toolDefinition as any],
      tool_choice: { type: "tool", name: "extract_prescription_data" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: state.prescriptionImage,
              },
            },
            {
              type: "text",
              text: "Extract all medication information from this prescription.",
            },
          ],
        },
      ],
    });
  };

  try {
    const response = await withRetry(runVisionAgent);
    
    // Find the tool use block
    const toolUse = response.content.find((c: any) => c.type === "tool_use") as any;
    
    if (!toolUse) {
      throw new Error("Vision Agent failed to use the extraction tool.");
    }

    // Validate with Zod
    const extractedData = PrescriptionSchema.parse(toolUse.input);

    emitStatus("waiting", "Vision Agent: Extraction complete. Please verify the medication list.");

    return {
      extractedData,
      status: "verification_pending",
      executionLogs: [...state.executionLogs, "Vision Agent: Successfully extracted medication data with Tool Calling."]
    };
  } catch (error: any) {
    emitStatus("error", `Vision Agent: ${error.message || "Failed to process image."}`);
    throw error;
  }
};
