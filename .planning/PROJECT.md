# The MediScript AI Solution

## What This Is

MediScript is an intelligent, real-time medical utility designed to digitize handwritten or printed prescriptions and automatically verify them for safety. It uses a Multi-Agent AI Workflow (via LangGraph.js) to extract medication data, cross-reference it against verified medical literature (OpenFDA), and generate optimized dosage schedules for patients.

## Core Value

Bridging the gap between raw LLM reasoning and real-world medical safety through a strictly orchestrated, multi-agent validation pipeline.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Prescription Digitization**: Vision Agent (Claude) extracts doctor, patient, medication, and dosage data from images.
- [ ] **Human-in-the-Loop Verification**: Patient confirms the extracted medication list before processing continues.
- [ ] **RAG-Powered Safety Checks**: Cross-references medications against OpenFDA data in ChromaDB to detect dangerous interactions.
- [ ] **Automated Scheduling**: Converts dosage instructions into a structured daily Morning/Evening schedule.
- [ ] **Real-time Progress Tracking**: Live Socket.io updates to the dashboard showing agent execution logs.
- [ ] **Multi-Channel Reminders**: Daily medication alerts sent via WhatsApp (via n8n) and Email.
- [ ] **Context-Aware Chat Engine**: Q&A interface for patients to ask follow-up questions about their specific prescription.

### Out of Scope

- [ ] **Medical Diagnosis**: The system does not diagnose conditions; it only analyzes prescribed medications.
- [ ] **Electronic Health Record (EHR) Integration**: Direct integration with hospital EHR systems is deferred to future versions.
- [ ] **Pharmacy Order Fulfillment**: The app does not facilitate the purchase or delivery of drugs.

## Context

- **Multi-Agent Orchestration**: Using LangGraph.js to manage a 7-node state machine (Vision, RAG, Safety, Scheduling, Verify, Notify, Chat).
- **Technology Mix**: Bridging Node.js/TypeScript backend with a React/Tailwind frontend via WebSockets for "live" AI feel.
- **Data Strategy**: OpenFDA acts as the "source of truth" to ground the AI's safety advice and prevent hallucinations.

## Constraints

- **Tech Stack**: TypeScript, LangGraph.js, React, Tailwind, Express, Socket.io.
- **Data Layer**: MongoDB (user data/schedules), ChromaDB (RAG), Redis (BullMQ).
- **Communication**: WhatsApp delivery is delegated to an external n8n workflow.
- **Safety**: Must include a human-in-the-loop confirmation step due to the high-risk nature of medical data.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| LangGraph.js | Provides the strict orchestration needed for a medical validation pipeline. | — Pending |
| OpenFDA for RAG | Reliable, verified source of medical data to prevent AI hallucinations. | — Pending |
| Human Confirm Step | Essential safety gate to ensure Vision Agent extraction is 100% accurate before analysis. | — Pending |
| BullMQ + n8n | Decouples the notification logic and provides robust scheduling for reminders. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-01 after project initialization*
