# 🩺 ScriptStream

> An agentic AI system that digitizes handwritten medical prescriptions — extracting structured drug data, detecting safety interactions, and building personalized medication schedules through a LangGraph-orchestrated pipeline with real-time progress updates.

---

## Overview

Handwritten prescriptions are a leading cause of medication errors. ScriptStream solves this by running prescription images through a 6-node agentic state machine — from Vision OCR to a final verified schedule — with Socket.io delivering live progress to the frontend and MongoDB persisting all results. Low-confidence results are held in an admin review queue before they reach the patient.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Express / Node.js Server               │
│                                                          │
│   server.ts ──► src/api/routes.ts ──► src/graph/         │
│                       │                  graph.invoke    │
│                       │                  state.ts        │
│                       │                  nodes/          │
│                 src/sockets/                             │
│                 socketEvents.ts ◄── node progress emit   │
│                       │                                  │
│                 src/database/                            │
│                 models.ts ◄──► MongoDB                   │
└──────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│              React + Vite Frontend (client/)             │
│   Dashboard │ Upload │ Processing │ Results │ MediChat   │
│                    Admin Ops                             │
└──────────────────────────────────────────────────────────┘
```

**Request flow:**
1. Client calls `POST /api/analyze` with a prescription image
2. `routes.ts` saves a pending record to MongoDB via `models.ts`
3. `routes.ts` triggers `graph.invoke` — the LangGraph state machine runs
4. Each agent node emits real-time status logs via `socketEvents.ts`
5. On completion, the result is written back to MongoDB
6. Client receives `job:completed` via Socket.io and renders results

---

## Agent Pipeline

```
Vision → RAG Lookup → Safety Check → Scheduler → Verification → Notifier
```

| Node | Responsibility |
|---|---|
| **Vision** | Prompts a Vision LLM to extract structured JSON from the prescription image |
| **RAG Lookup** | Queries ChromaDB for drug profiles, side effects, and contraindications |
| **Safety Check** | Cross-references extracted drugs with patient history; generates warnings |
| **Scheduler** | Builds a Morning / Noon / Evening / Night medication adherence plan |
| **Verification** | Computes a `confidence_score`; routes low-confidence results to admin queue |
| **Notifier** | Emits the final result to Socket.io and updates MongoDB |

---
## Project Structure

```
ScriptStream/
│
├── client/                           # React + Vite frontend
│   ├── public/                       # Static assets
│   ├── src/                          # Application source
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── UploadIdle.jsx
│   │   │   ├── Processing.jsx
│   │   │   ├── AnalysisResults.jsx
│   │   │   ├── MediChat.jsx
│   │   │   ├── AdminOps.jsx
│   │   │   └── Prescriptions.jsx
│   │   ├── components/
│   │   ├── hooks/
│   │   │   ├── useSocket.js          # Real-time Socket.io job tracking
│   │   │   └── useUpload.js          # File upload + job_id handler
│   │   ├── services/
│   │   │   └── api.js                # Axios API service layer
│   │   └── context/
│   │       └── AppContext.jsx         # Global app state
│   ├── index.html                    # Vite entry HTML
│   ├── eslint.config.js
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   ├── package-lock.json
│   └── .gitignore
│
├── server/                           # Express + TypeScript backend
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes.ts             # All REST endpoints + graph.invoke trigger
│   │   │   └── auth.ts               # JWT middleware
│   │   ├── sockets/
│   │   │   └── socketEvents.ts       # Socket.io event handlers & emitters
│   │   ├── database/
│   │   │   └── models.ts             # Mongoose schemas — User, Prescription
│   │   └── graph/                    # LangGraph AI state machine
│   │       ├── graph.ts              # StateGraph — node wiring and edges
│   │       ├── state.ts              # Shared state interface
│   │       └── nodes/                # Vision, RAG, Safety, Scheduler, etc.
│   ├── server.ts                     # Express entry point
│   ├── tsconfig.json
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   └── .gitignore
│
├── .agent/                           # Agentic dev workflow runner
│   ├── agents/                       # Agent task definitions
│   ├── get-shit-done/                # Task execution utilities
│   ├── hooks/                        # Lifecycle hooks
│   │   ├── gsd-check-update-worker.js
│   │   ├── gsd-check-update.js
│   │   ├── gsd-context-monitor.js
│   │   ├── gsd-phase-boundary.sh
│   │   ├── gsd-prompt-guard.js
│   │   ├── gsd-read-guard.js
│   │   ├── gsd-read-injection-scanner.js
│   │   ├── gsd-session-state.sh
│   │   ├── gsd-statusline.js
│   │   ├── gsd-validate-commit.sh
│   │   └── gsd-workflow-guard.js
│   ├── skills/
│   └── package.json
│
├── .planning/                        # Architecture & planning docs
├── .gitignore
├── architecture_diff.md              # Backend before/after evolution
├── package-lock.json
└── README.md
```


---

## Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | LangGraph |
| LLM / Vision | Google Gemini / Anthropic Claude |
| Vector Database | ChromaDB |
| Backend | Express.js + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT |
| Real-time | Socket.io |
| Frontend | React 18 + Vite + Tailwind CSS |
| HTTP Client | Axios |
| File Upload | react-dropzone |
| Chat AI | OpenRouter API |

---

## State Schema

All agent nodes share a single state object defined in `src/graph/state.ts`:

```typescript
interface PrescriptionState {
  image_path: string;           // Uploaded prescription image path
  prescription_data: object;    // Structured JSON from Vision node
  rag_results: object[];        // Drug profiles from ChromaDB
  safety_warnings: string[];    // Detected drug interactions
  daily_schedule: object;       // Morning / Noon / Evening / Night plan
  confidence_score: number;     // 0.0 – 1.0 reliability score
  flagged_for_review: boolean;  // Routes to admin queue if true
  patient_id: string;
  error: string | null;
}
```

---

## Getting Started

**Prerequisites:** Node.js 18+, MongoDB instance, Gemini API key, OpenRouter API key

### 1. Clone

```bash
git clone https://github.com/Radhikaa-chauhan/ScriptStream.git
cd ScriptStream
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
```

Configure `.env`:

```env
# Express Server Config
PORT=8001
GEMINI_API_KEY=
OPENROUTER_API_KEY=
JWT_SECRET=your_super_secret_jwt_key_change_this

# ChromaDB
CHROMA_API_KEY=
CHROMA_TENANT=
CHROMA_DATABASE=ScriptStream

# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/scriptstream

# Notifications (Email / WhatsApp via n8n)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
N8N_WEBHOOK_URL=
```

```bash
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
```

Configure `client/.env`:

```env
VITE_API_URL=http://localhost:8001/api
VITE_SOCKET_URL=http://localhost:8001
```

```bash
npm run dev   # → http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | ✗ | Login, returns JWT |
| `POST` | `/api/auth/register` | ✗ | Register new user |
| `POST` | `/api/analyze` | ✓ | Upload prescription image → returns `job_id` |
| `GET` | `/api/result/:job_id` | ✓ | Poll for analysis result |
| `GET` | `/api/prescriptions` | ✓ | All prescriptions for current user |
| `GET` | `/api/prescriptions/:id` | ✓ | Single prescription detail |
| `POST` | `/api/chat` | ✓ | MediChat message with prescription context |
| `POST` | `/api/admin/approve/:job_id` | ✓ | Approve flagged scan |
| `POST` | `/api/admin/reject/:job_id` | ✓ | Reject scan |
| `POST` | `/api/admin/escalate/:job_id` | ✓ | Escalate to doctor |

### Socket.io Events

Connect with your `job_id` as a query param to receive live updates:

```
job:queued        →  { jobId }
job:processing    →  { jobId, step, progress }
job:completed     →  { jobId, result }
job:failed        →  { jobId, error }
log               →  { time, level, msg }
```

---

## Safety & Compliance

- No patient data is sent to third-party services beyond the LLM API call for OCR extraction.
- The Admin review panel ensures no AI result reaches a patient without human sign-off when `confidence_score` is below the configured threshold.
- MediChat responses are sourced from the FDA drug database. All responses carry a disclaimer that they do not substitute professional medical advice.

---

## License

MIT
