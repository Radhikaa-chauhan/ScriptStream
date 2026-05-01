import { anthropic, withRetry } from "../../utils/anthropic";
import { State, ScheduleSchema } from "../state";
import { emitStatus } from "../../../server";

/**
 * Scheduling Agent Node
 * Responsible for mapping extracted dosage instructions into a strict 
 * daily schedule (Morning, Afternoon, Evening, Night).
 */
export const scheduleNode = async (state: State) => {
  emitStatus("processing", "Scheduling Agent: Generating daily medication schedule...");

  if (!state.extractedData || state.extractedData.medications.length === 0) {
    return {
      schedule: { morning: [], afternoon: [], evening: [], night: [], notes: ["No medications to schedule."] },
      executionLogs: [...state.executionLogs, "Scheduling Agent: Skipped (no medications)."],
      status: "schedule_complete"
    };
  }

  const medsData = JSON.stringify(state.extractedData.medications, null, 2);

  const toolDefinition = {
    name: "generate_medication_schedule",
    description: "Map medication instructions to a 4-part daily schedule.",
    input_schema: {
      type: "object",
      properties: {
        morning: { type: "array", items: { type: "string" }, description: "Meds to take in the morning" },
        afternoon: { type: "array", items: { type: "string" }, description: "Meds to take in the afternoon" },
        evening: { type: "array", items: { type: "string" }, description: "Meds to take in the evening" },
        night: { type: "array", items: { type: "string" }, description: "Meds to take at night" },
        notes: { type: "array", items: { type: "string" }, description: "Important safety notes or instructions" }
      },
      required: ["morning", "afternoon", "evening", "night", "notes"]
    }
  };

  const runScheduleAgent = async () => {
    return await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1500,
      system: "You are an expert medical scheduler AI. Map raw instructions to the daily schedule using the generate_medication_schedule tool. Interpret abbreviations like BID (twice daily).",
      tools: [toolDefinition as any],
      tool_choice: { type: "tool", name: "generate_medication_schedule" },
      messages: [
        {
          role: "user",
          content: `Medications to schedule:\n${medsData}\n\nGenerate the structured schedule.`,
        },
      ],
    });
  };

  try {
    const response = await withRetry(runScheduleAgent);
    
    const toolUse = response.content.find((c: any) => c.type === "tool_use") as any;
    
    if (!toolUse) {
      throw new Error("Scheduling Agent failed to use the schedule tool.");
    }

    // Validate with Zod
    const schedule = ScheduleSchema.parse(toolUse.input);
    
    emitStatus("success", "Scheduling Agent: Daily schedule finalized.");
    
    return {
      schedule,
      executionLogs: [...state.executionLogs, "Scheduling Agent: Schedule generation complete with Tool Calling."],
      status: "schedule_complete"
    };
  } catch (error: any) {
    emitStatus("error", `Scheduling Agent: ${error.message || "Failed to generate schedule."}`);
    throw error;
  }
};
