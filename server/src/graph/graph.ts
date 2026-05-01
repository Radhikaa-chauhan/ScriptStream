import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { StateAnnotation } from "./state";
import { visionNode } from "./nodes/visionNode";
import { ragLookupNode } from "./nodes/ragLookupNode";
import { safetyNode } from "./nodes/safetyNode";
import { scheduleNode } from "./nodes/scheduleNode";
import { notifyNode } from "./nodes/notifyNode";
import { chatNode } from "./nodes/chatNode";


/**
 * The ScriptStream AI Workflow
 * 7-Node State Machine
 */
console.log("[GRAPH] Initializing LangGraph workflow...");

// Note: ragLookupNode and notifyNode will be implemented by Member 4

// In-memory checkpointer for Human-in-the-loop state saving
const checkpointer = new MemorySaver();
console.log("[GRAPH] Memory checkpoint saver created");


const workflow = new StateGraph(StateAnnotation)
  // 1. Vision Node
  .addNode("vision", visionNode)

  // 2. Verification Gate (Human confirms extraction)
  .addNode("verification", async (state) => {
    console.log("[GRAPH] Verification gate reached");
    // Controller pauses graph here until human confirms
    return { status: "ready_for_analysis" };
  })

  // 3. RAG Lookup Node (Member 4)
  .addNode("ragLookup", ragLookupNode)

  // 4. Safety Node
  .addNode("safety", safetyNode)

  // 5. Schedule Node (Renamed to scheduler to avoid state channel collision)
  .addNode("scheduler", scheduleNode)

  // 6. Notification Node (Member 4)
  .addNode("notify", notifyNode)

  // 7. Chat Node
  .addNode("chat", chatNode)

  // Define Directed Flow
  .addEdge(START, "vision")
  .addEdge("vision", "verification")
  .addEdge("verification", "ragLookup")
  .addEdge("ragLookup", "safety")

  // Conditional routing: if safety fails, we might go to END or back to human.
  // For V1, we flow sequentially through the pipeline
  .addEdge("safety", "scheduler")
  .addEdge("scheduler", "notify")

  // Chat node runs in a loop or asynchronously after the main pipeline finishes
  .addEdge("notify", "chat")
  .addEdge("chat", END);

// Compile the graph with the checkpointer and interrupt condition
export const graph = workflow.compile({
  checkpointer,
  interruptBefore: ["verification"],
});
