import { askAI, withRetry, extractJSON } from "../../utils/ai";
import { State, ScheduleSchema } from "../state";
import { emitStatus } from "../../sockets/socketEvents";

/**
 * Scheduling Agent Node (OpenRouter Edition)
 */
export const scheduleNode = async (state: State) => {
  console.log("[SCHEDULE] Starting schedule node with OpenRouter...");
  emitStatus("processing", "Scheduling Agent: Generating daily medication schedule using Gemma-4...");

  if (!state.extractedData || state.extractedData.medications.length === 0) {
    return {
      schedule: { morning: [], afternoon: [], evening: [], night: [], notes: ["No medications to schedule."] },
      executionLogs: [...state.executionLogs, "Scheduling Agent: Skipped (no medications)."],
      status: "schedule_complete"
    };
  }

  const medsData = JSON.stringify(state.extractedData.medications, null, 2);

  const prompt = `You are an expert medical scheduler AI. Map raw medication instructions to the daily schedule. 
Interpret abbreviations like BID (twice daily), TID (three times daily), QID (four times daily). 
Return ONLY a valid JSON object. Do not include markdown code blocks.

Medications to schedule:
${medsData}

Return a JSON object like this:
{
  "morning": ["medication name with time"],
  "afternoon": ["medication name with time"],
  "evening": ["medication name with time"],
  "night": ["medication name with time"],
  "notes": ["important safety notes"]
}

Ensure all keys are present (use empty arrays if no medications for that time).`;

  try {
    const responseText = await withRetry(() => askAI(prompt));
    
    if (!responseText) {
      throw new Error("Scheduling Agent returned empty response.");
    }

    const parsedResponse = extractJSON(responseText);
    
    // Fill in defaults if the reasoning model misses some keys
    const rawSchedule = {
      morning: Array.isArray(parsedResponse.morning) ? parsedResponse.morning : [],
      afternoon: Array.isArray(parsedResponse.afternoon) ? parsedResponse.afternoon : [],
      evening: Array.isArray(parsedResponse.evening) ? parsedResponse.evening : [],
      night: Array.isArray(parsedResponse.night) ? parsedResponse.night : [],
      notes: Array.isArray(parsedResponse.notes) ? parsedResponse.notes : []
    };

    const schedule = ScheduleSchema.parse(rawSchedule);
    
    emitStatus("success", "Scheduling Agent: Daily schedule finalized.");
    
    return {
      schedule,
      executionLogs: [...state.executionLogs, "Scheduling Agent: Schedule generation complete using Gemma-4."],
      status: "schedule_complete"
    };
  } catch (error: any) {
    emitStatus("error", `Scheduling Agent: ${error.message || "Failed to generate schedule."}`);
    throw error;
  }
};
