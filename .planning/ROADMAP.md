# ROADMAP

## Milestone 1: The Multi-Agent MVP

### Phase 1: Foundation & State Orchestration
Goal: Establish the strictly-typed LangGraph foundation and the communication hub.

- [ ] **Phase 1.1**: Initialize Project Structure & State Annotation (REQ-AI-01)
  - Create `mediscript-ai-langgraph-js` directory and subfolders.
  - Set up `src/graph/state.ts` using Zod for robust data passing.
- [ ] **Phase 1.2**: Server & Socket.io Hub (REQ-BE-01)
  - Initialize Express server and Socket.io events for progress logging.
- [ ] **Phase 1.3**: Base Graph Construction (REQ-AI-06)
  - Map out the `graph.ts` structure with placeholder nodes.

### Phase 2: The Vision & Extraction Pipeline
Goal: Get the AI reading prescriptions and verifying them with the user.

- [ ] **Phase 2.1**: Vision Agent Node (REQ-AI-02)
  - Implement `visionNode.ts` with Claude 3.5 Sonnet image extraction.
- [ ] **Phase 2.2**: Human-in-the-loop Intercept
  - Implement the "Confirm Meds" logic between extraction and RAG.
- [ ] **Phase 2.3**: RAG & Safety Nodes (REQ-AI-03, REQ-INT-01)
  - Connect ChromaDB retrieval to the RAG node and build the safety logic.

### Phase 3: Scheduling, Chat & Delivery
Goal: Generate the final schedule and enable patient Q&A.

- [ ] **Phase 3.1**: Scheduling Agent (REQ-AI-04)
  - Implement `scheduleNode.ts` to map text instructions to timed slots.
- [ ] **Phase 3.2**: Chat Node & Memory (REQ-AI-05)
  - Build the `chatNode.ts` with conversational history persistence.
- [ ] **Phase 3.3**: Notification Logic (REQ-INT-02)
  - Connect the graph to n8n/WhatsApp delivery.

### Phase 4: Live UI & Integration
Goal: Connect the React frontend and launch the live dashboard.

- [ ] **Phase 4.1**: Upload & Progress Dashboard (REQ-FE-01, REQ-FE-02)
- [ ] **Phase 4.2**: Final Results & Chat Interface
- [ ] **Phase 4.3**: End-to-End System Testing
