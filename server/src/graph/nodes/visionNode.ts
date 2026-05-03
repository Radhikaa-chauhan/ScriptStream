import { askAI, withRetry, extractJSON } from "../../utils/ai";
import { State, PrescriptionSchema } from "../state";
import { emitStatus } from "../../sockets/socketEvents";
import Tesseract from "tesseract.js";


const cleanText = (text: string) => {
  return text
    .replace(/[^a-zA-Z0-9\s()./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const extractMedications = (text: string) => {
  const lines = text.split("\n");
  const meds: any[] = [];

  for (let line of lines) {
    line = cleanText(line);

    const match = line.match(
      /([A-Z]{3,}[-A-Z]*)\s*\(?([\d\/]+)?\)?\s*(\d+\s?(?:mL|mg))?/i
    );

    if (match) {
      meds.push({
        name: match[1],
        dosage: match[2] || "",
        instructions: line,
        frequency: "",
      });
    }
  }

  return meds;
};

/**
 * Vision Agent Node (OCR + LLM Edition)
 */
export const visionNode = async (state: State) => {
  console.log("[VISION] Starting vision node (OCR + LLM)...");
  emitStatus("processing", "Vision Agent: Reading prescription using OCR...");

  try {
    if (!state.prescriptionImage) {
      return {
        status: "skipped",
        executionLogs: [
          ...state.executionLogs,
          "Vision Agent: Bypassed (No image in state)"
        ]
      };
    }

    let base64Data = state.prescriptionImage;
    let mimeType = "image/jpeg";

    // ✅ Clean base64 input
    if (base64Data.startsWith("data:")) {
      const match = base64Data.match(/^data:((?:image|application)\/[a-zA-Z0-9.+]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    // =========================
    // 🔥 STEP 1: OCR (IMAGE → TEXT)
    // =========================
    emitStatus("processing", "Vision Agent: Extracting text using OCR...");

    const ocrResult = await Tesseract.recognize(
      `data:${mimeType};base64,${base64Data}`,
      "eng"
    );

    const rawText = ocrResult.data.text;

    if (!rawText || rawText.trim().length < 10) {
      throw new Error("OCR failed: No readable text found.");
    }

    console.log("[VISION] OCR TEXT:\n", rawText);

    // =========================
    // 🔥 STEP 2: LLM STRUCTURING
    // =========================
    emitStatus("processing", "Vision Agent: Structuring extracted text...");

    const prompt = `
You are an expert pharmacist AI.

Below is raw OCR text from a prescription:

${rawText}

Extract structured data.

Return ONLY valid JSON (no markdown):

{
  "doctorName": "string",
  "patientName": "string",
  "date": "string",
  "medications": [
    {
      "name": "string",
      "dosage": "string",
      "instructions": "string",
      "frequency": "string"
    }
  ]
}
`;

    let rawData;

    try {
      const responseText = await withRetry(() => askAI(prompt));
      rawData = extractJSON(responseText);

    } catch (err) {
      console.warn("[VISION] LLM failed → using local parser");

      rawData = {
        doctorName: "",
        patientName: "",
        date: "",
        medications: extractMedications(rawText),
      };
    }

    const validationResult = PrescriptionSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.warn("[VISION] Zod validation failed:", validationResult.error);
      return {
        status: "error",
        executionLogs: [
          ...state.executionLogs,
          "Vision Agent: Extracted data failed schema validation."
        ]
      };
    }


    emitStatus(
      "waiting",
      "Vision Agent: Extraction complete. Please verify the medication list."
    );

    return {
      extractedData: validationResult.data,
      status: "verification_pending",
      executionLogs: [
        ...state.executionLogs,
        "Vision Agent: Successfully extracted medication data via OCR + LLM."
      ]
    };

  } catch (error: any) {
    console.error("[VISION ERROR]", error);

    emitStatus(
      "error",
      `Vision Agent: ${error.message || "Failed to process image."}`
    );

    return {
      status: "error",
      executionLogs: [
        ...state.executionLogs,
        `Vision Agent Error: ${error.message}`
      ]
    };
  }
};