import { gemini, withRetryGemini } from "../../utils/gemini";
import { State, PrescriptionSchema } from "../state";
import { emitStatus } from "../../sockets/socketEvents";
import { Type, Schema } from "@google/genai";

/**
 * Vision Agent Node
 * Responsible for reading the prescription image and extracting medication JSON using Google Gemini.
 */
export const visionNode = async (state: State) => {
  console.log("[VISION] Starting vision node...");
  emitStatus("processing", "Vision Agent: Analyzing prescription image using Gemini...");

  // Define the structured output schema for Gemini
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      doctorName: { type: Type.STRING, description: "Name of the doctor" },
      patientName: { type: Type.STRING, description: "Name of the patient" },
      date: { type: Type.STRING, description: "Date of the prescription" },
      medications: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the medication" },
            dosage: { type: Type.STRING, description: "Dosage (e.g. 500mg)" },
            instructions: { type: Type.STRING, description: "How to take it" },
            frequency: { type: Type.STRING, description: "How often (e.g. twice daily)" }
          },
          required: ["name", "dosage", "instructions"]
        }
      }
    },
    required: ["medications"]
  };

  const runVisionAgent = async () => {
    console.log("[VISION] Preparing image for Gemini analysis...");
    // Strip the "data:image/jpeg;base64," prefix if it exists in the state
    let base64Data = state.prescriptionImage;
    let mimeType = "image/jpeg";
    
    if (base64Data.startsWith("data:")) {
      const match = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    return await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Extract all medication information from this prescription image." },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temp for more deterministic extraction
      }
    });
  };

  try {
    const response = await withRetryGemini(runVisionAgent);
    const jsonText = response.text;
    
    if (!jsonText) {
      throw new Error("Gemini Agent returned empty content.");
    }

    const rawData = JSON.parse(jsonText);

    // Validate with our existing Zod Schema
    const extractedData = PrescriptionSchema.parse(rawData);

    emitStatus("waiting", "Vision Agent: Extraction complete. Please verify the medication list.");

    return {
      extractedData,
      status: "verification_pending",
      executionLogs: [...state.executionLogs, "Vision Agent: Successfully extracted medication data with Gemini 1.5 Flash."]
    };
  } catch (error: any) {
    emitStatus("error", `Vision Agent: ${error.message || "Failed to process image with Gemini."}`);
    throw error;
  }
};
