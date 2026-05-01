import { gemini, withRetryGemini } from "../../utils/gemini";
import { State, ScheduleSchema } from "../state";
import { emitStatus } from "../../sockets/socketEvents";

/**
 * Scheduling Agent Node
 * Responsible for mapping extracted dosage instructions into a strict 
 * daily schedule (Morning, Afternoon, Evening, Night).
 */
export const scheduleNode = async (state: State) => {
  console.log("[SCHEDULE] Starting schedule node...");
  emitStatus("processing", "Scheduling Agent: Generating daily medication schedule...");

  if (!state.extractedData || state.extractedData.medications.length === 0) {
    console.log("[SCHEDULE] No medications to schedule, skipping");
    return {
      schedule: { morning: [], afternoon: [], evening: [], night: [], notes: ["No medications to schedule."] },
      executionLogs: [...state.executionLogs, "Scheduling Agent: Skipped (no medications)."],
      status: "schedule_complete"
    };
  }

  const medsData = JSON.stringify(state.extractedData.medications, null, 2);

  const runScheduleAgent = async () => {
    return await gemini.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `You are an expert medical scheduler AI. Map raw medication instructions to the daily schedule. Interpret abbreviations like BID (twice daily), TID (three times daily), QID (four times daily). Return ONLY a valid JSON object with no markdown formatting.

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

Ensure all keys are present (use empty arrays if no medications for that time).`
    });
  };

  try {
    const response = await withRetryGemini(runScheduleAgent);
    
    // Extract text from Gemini response
    const responseText = response.text || "";
    
    if (!responseText) {
      throw new Error("Scheduling Agent returned empty response.");
    }

    // Parse JSON from response (handle potential markdown formatting)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    const parsedResponse = JSON.parse(jsonStr);

    // Validate with Zod
    const schedule = ScheduleSchema.parse(parsedResponse);
    
    emitStatus("success", "Scheduling Agent: Daily schedule finalized.");
    
    return {
      schedule,
      executionLogs: [...state.executionLogs, "Scheduling Agent: Schedule generation complete with Gemini JSON parsing."],
      status: "schedule_complete"
    };
  } catch (error: any) {
    emitStatus("error", `Scheduling Agent: ${error.message || "Failed to generate schedule."}`);
    throw error;
  }
};
