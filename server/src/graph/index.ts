import { graph } from "./graph";
import { State } from "./state";

/**
 * Entry point for the ScriptStream LangGraph Workflow.
 * Member 2 (Backend) will call this function from their Express route.
 * 
 * @param imageBase64 The raw prescription image data (base64 string)
 * @returns The final completed state of the graph
 */
export const runWorkflow = async (
  imageBase64: string,
  patientPhone: string   // ✅ ADD THIS PARAM
) => {

  const initialState: Partial<State> = {
    prescriptionImage: imageBase64,
    patientPhone: patientPhone,  // ✅ ADD THIS LINE

    extractedData: undefined,
    ragContext: "",
    safetyWarnings: [],
    schedule: { morning: [], afternoon: [], evening: [], night: [], notes: [] },
    executionLogs: ["Workflow Started: Image received."],
    chatHistory: [],
    status: "started"
  };

  try {
    console.log("Starting LangGraph execution...");
    const finalState = await graph.invoke(initialState);

    console.log("LangGraph execution completed.");
    return finalState;

  } catch (error) {
    console.error("Error during LangGraph execution:", error);
    throw error;
  }
}
