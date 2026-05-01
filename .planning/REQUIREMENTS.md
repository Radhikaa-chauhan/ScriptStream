# REQUIREMENTS

## Vision
A multi-agent medical prescription digitizer and safety checker using LangGraph.js and Claude 3.5 Sonnet.

## Core Requirements (Member 3 Focus)

### AI Orchestration (LangGraph)
- **REQ-AI-01**: Define strictly typed state annotation using Zod for the graph lifecycle.
- **REQ-AI-02**: Implement Vision Agent node to extract medication/dosage JSON from images using Claude 3.5 Sonnet.
- **REQ-AI-03**: Implement Safety Agent node to cross-reference extracted data against RAG context.
- **REQ-AI-04**: Implement Scheduling Agent node to parse dosing instructions into structured timing.
- **REQ-AI-05**: Implement Chat Node for patient follow-up Q&A with session memory.
- **REQ-AI-06**: Orchestrate a 7-node state machine with conditional routing and state persistence.

### Integration (Member 4 Support)
- **REQ-INT-01**: Integrate ChromaDB RAG retrieval into the RAG node.
- **REQ-INT-02**: Trigger n8n/WhatsApp notifications via the Notification node.

## System Requirements

### Frontend (Member 1)
- **REQ-FE-01**: React/Tailwind UI for file uploads and prescription visualization.
- **REQ-FE-02**: Real-time progress tracking via Socket.io updates.

### Backend (Member 2)
- **REQ-BE-01**: Express server with Socket.io integration for event streaming.
- **REQ-BE-02**: MongoDB storage for user accounts and final medication schedules.

## Scoping
- **V1 (Current)**: Core 7-node graph, OpenFDA RAG, Socket.io progress tracking, WhatsApp via n8n.
- **V2**: OCR error correction interface, Doctor verification portal, EHR integration.
- **Out of Scope**: Direct drug purchasing, clinical diagnosis.
