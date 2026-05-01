import { graph } from "./graph";
import { State } from "./state";

/**
 * Entry point for the MediScript LangGraph Workflow.
 * Member 2 (Backend) will call this function from their Express route.
 * 
 * @param imageBase64 The raw prescription image data (base64 string)
 * @returns The final completed state of the graph
 */
export const runWorkflow = async (imageBase64: string) => {
  // Define the initial state payload
  const initialState: Partial<State> = {
    prescriptionImage: imageBase64,
    extractedData: undefined,
    ragContext: "",
    safetyWarnings: [],
    schedule: { morning: [], afternoon: [], evening: [], night: [], notes: [] },
    executionLogs: ["Workflow Started: Image received."],
    chatHistory: [],
    status: "started"
  };

  try {
    // Invoke the graph execution
    // Note: For V1, we run it sequentially. If we hit the "verification" node, 
    // we would handle the interrupt here.
    console.log("Starting LangGraph execution...");
    const finalState = await graph.invoke(initialState);
    
    console.log("LangGraph execution completed.");
    return finalState;
    
  } catch (error) {
    console.error("Error during LangGraph execution:", error);
    throw error;
  }
};
