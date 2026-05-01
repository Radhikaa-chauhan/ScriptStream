import { Anthropic } from "@anthropic-ai/sdk";
import { State } from "../state";
import { emitStatus } from "../../../server";

/**
 * Vision Agent Node
 * Responsible for reading the prescription image and extracting medication JSON.
 */
export const visionNode = async (state: State) => {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  emitStatus("processing", "Vision Agent: Analyzing prescription image...");

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 2000,
    system: `You are a medical data extraction specialist. 
    Your task is to extract medication details from prescription images into a strict JSON format.
    
    CRITICAL RULES:
    1. Output ONLY valid JSON.
    2. Do NOT include any conversational text or markdown fences.
    3. If a field is missing, use null.
    4. Ensure dosage units (mg, ml, etc.) are preserved.
    
    JSON Schema:
    {
      "doctorName": string | null,
      "patientName": string | null,
      "date": string | null,
      "medications": [
        {
          "name": string,
          "dosage": string,
          "instructions": string,
          "frequency": string
        }
      ]
    }`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg", // Assume jpeg, adjust based on input
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

  // Extract the text content from Claude's response
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Vision Agent");
  }

  try {
    const extractedData = JSON.parse(content.text);

    emitStatus("waiting", "Vision Agent: Extraction complete. Please verify the medication list.");

    return {
      extractedData,
      status: "verification_pending",
      executionLogs: [...state.executionLogs, "Vision Agent: Successfully extracted medication data."]
    };
  } catch (error) {
    emitStatus("error", "Vision Agent: Failed to parse extraction result.");
    throw new Error("Failed to parse JSON from Vision Agent");
  }
};
