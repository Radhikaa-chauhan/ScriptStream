import { askAI } from "./src/utils/ai";
import { PrescriptionSchema } from "./src/graph/state";

async function test() {
  const prompt = `You are an expert pharmacist AI. Extract all medication information from this prescription. 
Return ONLY a valid JSON object. Do not include markdown code blocks.

Expected JSON structure:
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
}`;

  try {
    const res = await askAI(prompt, "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", {
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        mimeType: "image/png"
    });
    console.log("Raw Response:\n", res);

    let jsonStr = res.trim();
    if (jsonStr.includes("```")) {
      jsonStr = jsonStr.replace(/```json|```/g, "").trim();
    }
    const rawData = JSON.parse(jsonStr);
    const validationResult = PrescriptionSchema.safeParse(rawData);
    console.log("Validation Result:", JSON.stringify(validationResult, null, 2));

  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

test();
