# 🩺 ScriptStream

> **An agentic AI system that digitizes handwritten medical prescriptions** — extracting structured drug data, detecting safety interactions, and building personalized medication schedules through a 6-node LangGraph orchestration pipeline.

**Live Demo:** [script-stream-mu.vercel.app](https://script-stream-mu.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Agent Pipeline](#agent-pipeline)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Safety & Compliance](#safety--compliance)
- [License](#license)

---

## Overview

Handwritten prescriptions are a leading cause of medication errors in healthcare settings. **ScriptStream** solves this critical problem by automating prescription digitization through an intelligent multi-agent AI system:

1. **Image Upload** — User uploads a prescription image
2. **AI OCR Processing** — Vision LLM extracts structured drug data from the prescription
3. **Drug Validation** — RAG lookup cross-references medications against FDA database
4. **Safety Analysis** — Detects drug interactions and contraindications
5. **Schedule Generation** — Creates personalized medication adherence plans
6. **Quality Assurance** — Admin review panel ensures low-confidence results are human-verified
7. **Real-time Notifications** — Socket.io provides live job tracking and results

The system uses **LangGraph** to orchestrate a 6-node agentic state machine, ensuring reliable and transparent processing at each step.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Vision OCR** | Google Gemini extracts structured JSON from prescription images |
| **Drug Interaction Detection** | Identifies contraindications, side effects, and harmful drug combinations |
| **Medication Schedule** | Generates time-based medication adherence plans (Morning/Noon/Evening/Night) |
| **Confidence Scoring** | Outputs reliability scores (0.0-1.0); flags low-confidence results for admin review |
| **MediChat** | AI-powered chatbot for medication Q&A, sourced from FDA database |
| **Admin Dashboard** | Approve, reject, or escalate flagged prescriptions |
| **Real-time Tracking** | Socket.io live job status updates |
| **Patient History** | Stores patient prescription history and medication interactions |
| **Multi-user Support** | JWT authentication with role-based access control |

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

### Request Flow

1. **Client Upload** — User uploads prescription image via `POST /api/analyze`
2. **Job Creation** — Route saves pending record to MongoDB with unique `job_id`
3. **Graph Invocation** — LangGraph state machine begins processing
4. **Real-time Updates** — Each agent node emits progress via Socket.io
5. **Result Storage** — Final analysis written back to MongoDB
6. **Client Notification** — Client receives `job:completed` event with results

---

## Agent Pipeline

```
Vision → RAG Lookup → Safety Check → Scheduler → Verification → Notifier
```

### Pipeline Stages

| Node | Input | Output | Responsibility |
|------|-------|--------|---|
| **Vision** | Image path | `prescription_data: JSON` | Extracts medication names, dosages, frequencies from prescription image using Google Gemini Vision |
| **RAG Lookup** | Drug names | `rag_results: DrugProfile[]` | Queries ChromaDB for drug profiles, side effects, contraindications, and FDA info |
| **Safety Check** | Drug list + Patient history | `safety_warnings: string[]` | Detects drug-drug interactions, allergies, and contraindications |
| **Scheduler** | Confirmed drugs | `daily_schedule: MedicationSchedule` | Builds time-based adherence plan (Morning/Noon/Evening/Night) |
| **Verification** | Full state | `confidence_score: 0.0–1.0` | Computes reliability score; routes low-confidence results to admin queue |
| **Notifier** | Final state | Socket.io event | Emits results to client and updates MongoDB |
---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Orchestration** | LangGraph | Multi-agent workflow orchestration |
| **Vision LLM** | Google Gemini | OCR extraction from prescription images |
| **Chat LLM** | Anthropic Claude + OpenRouter | MediChat responses |
| **Vector DB** | ChromaDB | Drug profile embeddings & semantic search |
| **Backend** | Express.js + TypeScript | REST API server |
| **Database** | MongoDB + Mongoose | Prescription & user data storage |
| **Auth** | JWT | Token-based authentication |
| **Real-time** | Socket.io | Live job tracking & notifications |
| **Frontend** | React 18 + Vite | Modern UI with HMR |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | Lucide React | Icon library |
| **Animations** | Framer Motion | Smooth transitions |
| **HTTP Client** | Axios | API requests |
| **File Upload** | react-dropzone | Drag-and-drop file handling |
| **Routing** | React Router v7 | Client-side navigation |
| **Task Queue** | BullMQ + Redis | Job queuing & workers |
| **Notifications** | Nodemailer + Twilio + n8n | Email/SMS/webhook notifications |
| **Security** | bcryptjs | Password hashing |

---

## Project Structure

```
ScriptStream/
│
├── client/                           # React + Vite frontend
│   ├── public/                       # Static assets
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # User dashboard with prescription history
│   │   │   ├── UploadIdle.jsx        # Prescription upload interface
│   │   │   ├── Processing.jsx        # Real-time job processing view
│   │   │   ├── AnalysisResults.jsx   # Results display with drug info
│   │   │   ├── MediChat.jsx          # AI medication chatbot
│   │   │   ├── AdminOps.jsx          # Admin review panel
│   │   │   └── Prescriptions.jsx     # Prescription history
│   │   ├── components/               # Reusable React components
│   │   ├── hooks/
│   │   │   ├── useSocket.js          # Socket.io integration
│   │   │   └── useUpload.js          # File upload handler
│   │   ├── services/
│   │   │   └── api.js                # Axios API service layer
│   │   └── context/
│   │       └── AppContext.jsx        # Global app state
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── .gitignore
│
├── server/                           # Express + TypeScript backend
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes.ts             # REST endpoints
│   │   │   └── auth.ts               # JWT middleware
│   │   ├── sockets/
│   │   │   └── socketEvents.ts       # Socket.io handlers
│   │   ├── database/
│   │   │   └── models.ts             # Mongoose schemas
│   │   └── graph/                    # LangGraph AI pipeline
│   │       ├── graph.ts              # StateGraph wiring
│   │       ├── state.ts              # State interface
│   │       └── nodes/
│   │           ├── visionNode.ts
│   │           ├── ragNode.ts
│   │           ├── safetyNode.ts
│   │           ├── schedulerNode.ts
│   │           ├── verificationNode.ts
│   │           └── notifierNode.ts
│   ├── server.ts
│   ├── tsconfig.json
│   ├── .env.example
│   ├── package.json
│   └── .gitignore
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js:** 18+ (LTS recommended)
- **MongoDB:** Local instance or MongoDB Atlas URI
- **API Keys Required:**
  - Google Gemini API key (Vision OCR)
  - Anthropic Claude API key (chat)
  - OpenRouter API key (alternative chat)
  - ChromaDB API key (optional, local instance supported)

### 1. Clone Repository

```bash
git clone https://github.com/Radhikaa-chauhan/ScriptStream.git
cd ScriptStream
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

#### Configure `server/.env`:

```env
# Express Server
PORT=8001
NODE_ENV=development

# LLM APIs
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# JWT & Auth
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=7d

# ChromaDB (Vector Store)
CHROMA_API_KEY=your_chroma_api_key
CHROMA_TENANT=default
CHROMA_DATABASE=ScriptStream

# MongoDB
MONGODB_URI=mongodb://localhost:27017/scriptstream
MONGODB_USER=optional_user
MONGODB_PASS=optional_password

# Redis (for BullMQ job queue)
UPSTASH_REDIS_URL=redis://localhost:6379

# Notifications
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook

```

#### Start Backend:

```bash
npm run dev
# Server runs on http://localhost:8001
```

### 3. Frontend Setup

```bash
cd client
npm install
```

#### Configure `client/.env`:

```env
VITE_API_URL=http://localhost:8001/api
VITE_SOCKET_URL=http://localhost:8001
VITE_APP_NAME=ScriptStream
```

#### Start Frontend:

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Verify Setup

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8001/api
- **WebSocket:** ws://localhost:8001

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ✗ | Register new user account |
| `POST` | `/api/auth/login` | ✗ | Login, returns JWT token |
| `POST` | `/api/auth/logout` | ✓ | Logout & invalidate token |

### Analysis Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/analyze` | ✓ | Upload prescription image → returns `job_id` |
| `GET` | `/api/result/:job_id` | ✓ | Poll for analysis result (JSON) |
| `GET` | `/api/prescriptions` | ✓ | Get all prescriptions for current user |
| `GET` | `/api/prescriptions/:id` | ✓ | Get single prescription details |
| `DELETE` | `/api/prescriptions/:id` | ✓ | Delete prescription from history |

### Chat & Assistance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/chat` | ✓ | MediChat message with prescription context |

### Admin Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/admin/queue` | ✓ | admin | Get flagged prescriptions pending review |
| `POST` | `/api/admin/approve/:job_id` | ✓ | admin | Approve flagged prescription |
| `POST` | `/api/admin/reject/:job_id` | ✓ | admin | Reject prescription |
| `POST` | `/api/admin/escalate/:job_id` | ✓ | admin | Escalate to doctor consultation |

---

## Safety & Compliance
- No patient data is sent to third-party services beyond the LLM API call for OCR extraction.
- The Admin review panel ensures no AI result reaches a patient without human sign-off when `confidence_score` is below the configured threshold.
- MediChat responses are sourced from the FDA drug database. All responses carry a disclaimer that they do not substitute professional medical advice.
---

## License

This project is licensed under the **MIT License**.
