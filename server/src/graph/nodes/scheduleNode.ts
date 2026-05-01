import { Anthropic } from "@anthropic-ai/sdk";
import { State } from "../state";
import { emitStatus } from "../../../server";

/**
 * Scheduling Agent Node
 * Responsible for mapping extracted dosage instructions into a strict 
 * daily schedule (Morning, Afternoon, Evening, Night).
 */
export const scheduleNode = async (state: State) => {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  emitStatus("processing", "Scheduling Agent: Generating daily medication schedule...");

  if (!state.extractedData || state.extractedData.medications.length === 0) {
    return {
      schedule: { morning: [], afternoon: [], evening: [], night: [], notes: ["No medications to schedule."] },
      executionLogs: [...state.executionLogs, "Scheduling Agent: Skipped (no medications)."],
      status: "schedule_complete"
    };
  }

  const medsData = JSON.stringify(state.extractedData.medications, null, 2);

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1500,
    system: `You are an expert medical scheduler AI.
    Your task is to take raw medication instructions and map them to a rigid 4-part daily schedule.
    
    CRITICAL RULES:
    1. Output ONLY valid JSON.
    2. Do NOT include any conversational text or markdown fences.
    3. Interpret medical abbreviations (e.g., BID = twice a day -> Morning & Evening).
    4. Group medications accurately into the right time slots. Include dosage.
    
    JSON Schema:
    {
      "morning": [ "string" ],
      "afternoon": [ "string" ],
      "evening": [ "string" ],
      "night": [ "string" ],
      "notes": [ "string" ]
    }
    
    Example Output:
    {
      "morning": ["Lisinopril 10mg - Take with food"],
      "afternoon": [],
      "evening": ["Lisinopril 10mg - Take with food", "Atorvastatin 20mg"],
      "night": [],
      "notes": ["Take Lisinopril with a full glass of water."]
    }`,
    messages: [
      {
        role: "user",
        content: `Medications to schedule:\n${medsData}\n\nGenerate the JSON schedule.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Scheduling Agent");
  }

  try {
    const schedule = JSON.parse(content.text);
    
    emitStatus("success", "Scheduling Agent: Daily schedule finalized.");
    
    return {
      schedule,
      executionLogs: [...state.executionLogs, "Scheduling Agent: Schedule generation complete."],
      status: "schedule_complete"
    };
  } catch (error) {
    emitStatus("error", "Scheduling Agent: Failed to parse schedule result.");
    throw new Error("Failed to parse JSON from Scheduling Agent");
  }
};
