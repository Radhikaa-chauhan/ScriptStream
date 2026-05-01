import { StateGraph, START, END } from "@langchain/langgraph";
import { StateAnnotation } from "./state";
import { visionNode } from "./nodes/visionNode";
import { safetyNode } from "./nodes/safetyNode";
import { scheduleNode } from "./nodes/scheduleNode";
import { chatNode } from "./nodes/chatNode";

// Note: ragLookupNode and notifyNode will be implemented by Member 4


/**
 * The MediScript AI Workflow
 * 7-Node State Machine
 */
const workflow = new StateGraph(StateAnnotation)
  // 1. Vision Node
  .addNode("vision", visionNode)

  // 2. Verification Gate (Human confirms extraction)
  .addNode("verification", async (state) => {
    // Controller pauses graph here until human confirms
    return { status: "ready_for_analysis" };
  })

  // 3. RAG Lookup Node (Placeholder for Member 4's logic)
  .addNode("ragLookup", async (state) => {
    return { status: "rag_complete", ragContext: "Sample medical literature fetched from ChromaDB." };
  })

  // 4. Safety Node
  .addNode("safety", safetyNode)

  // 5. Schedule Node
  .addNode("schedule", scheduleNode)

  // 6. Notification Node (Placeholder for Member 4's n8n logic)
  .addNode("notify", async (state) => {
    return { status: "notified" };
  })

  // 7. Chat Node
  .addNode("chat", chatNode)

  // Define Directed Flow
  .addEdge(START, "vision")
  .addEdge("vision", "verification")
  .addEdge("verification", "ragLookup")
  .addEdge("ragLookup", "safety")

  // Conditional routing: if safety fails, we might go to END or back to human.
  // For V1, we flow sequentially through the pipeline
  .addEdge("safety", "schedule")
  .addEdge("schedule", "notify")

  // Chat node runs in a loop or asynchronously after the main pipeline finishes
  .addEdge("notify", "chat")
  .addEdge("chat", END);

export const graph = workflow.compile();
