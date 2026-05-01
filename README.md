# 🩺 ScriptStream

> An agentic system that digitizes handwritten medical prescriptions using LangGraph orchestration, Vision AI, and Retrieval-Augmented Generation — delivering structured drug data, safety warnings, and personalized medication schedules in real time.

---

## 📌 Overview

Handwritten prescriptions are a leading cause of medication errors worldwide. ScriptStream solves this by combining computer vision, a drug-safety vector database, and an AI agent pipeline to accurately extract, validate, and structure prescription data — with a human-in-the-loop review layer for low-confidence results.

The system accepts an image of a handwritten prescription, runs it through a 6-node agentic workflow, and outputs verified medication details, interaction warnings, and a daily adherence schedule — all surfaced through a real-time React dashboard and a conversational chat interface.

---
## ✨ Features

- **Vision OCR** — Extracts structured JSON from handwritten prescription images using Gemini / Claude Vision
- **RAG Drug Lookup** — Queries a ChromaDB vector database of drug profiles, contraindications, and side effects
- **Safety Analysis** — Cross-references extracted medications with the patient's existing prescription history to flag dangerous interactions
- **Adherence Scheduler** — Builds a personalized Morning / Noon / Evening / Night medication schedule based on clinical guidelines
- **Confidence Scoring** — Calculates a reliability score per prescription; flags low-confidence results for admin review
- **Admin Review Panel** — Human-in-the-loop interface for reviewing, correcting, and approving flagged scans before publishing to the patient
- **MediChat** — Persistent-memory conversational AI for patients to ask follow-up questions about their medications
- **Real-time Progress** — Socket.io powered live processing feed showing each agent step as it executes

---

## 🏗️ System Architecture

```
                    ┌─────────────────────────────────────┐
                    │         FastAPI Backend              │
                    │  POST /analyze   POST /chat          │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │         LangGraph StateGraph         │
                    │                                      │
                    │  ┌─────────┐    ┌──────────────┐    │
                    │  │ Vision  │───▶│  RAG_Lookup  │    │
                    │  └─────────┘    └──────┬───────┘    │
                    │                        │             │
                    │               ┌────────▼────────┐   │
                    │               │  Safety_Check   │   │
                    │               └────────┬────────┘   │
                    │                        │             │
                    │               ┌────────▼────────┐   │
                    │               │   Scheduler     │   │
                    │               └────────┬────────┘   │
                    │                        │             │
                    │               ┌────────▼────────┐   │
                    │               │  Verification   │   │
                    │               └────────┬────────┘   │
                    │                        │             │
                    │               ┌────────▼────────┐   │
                    │               │    Notifier     │   │
                    │               └─────────────────┘   │
                    └─────────────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │         React Frontend               │
                    │  Dashboard │ Upload │ Results        │
                    │  MediChat  │ Admin Ops               │
                    └─────────────────────────────────────┘
```

---
## Project Structure

```
ScriptStream/
├── main.py               # FastAPI server — /analyze, /chat endpoints
├── graph.py              # LangGraph StateGraph — nodes and edges
├── state.py              # Shared TypedDict state schema
├── agents/
│   ├── vision.py         # OCR extraction via Vision LLM
│   ├── safety.py         # Drug interaction detection
│   ├── scheduler.py      # Daily dose schedule builder
│   ├── verification.py   # Confidence score calculation
│   └── chat.py           # MediChat with persistent memory
├── core/
│   └── rag_engine.py     # ChromaDB setup and drug lookup tool
├── data/drug_profiles/   # Source files ingested into ChromaDB
├── frontend/             # React dashboard
├── requirements.txt
└── Dockerfile
```

---


## 🧠 State Schema

All six agents communicate through a shared `TypedDict` state:

```python
class PrescriptionState(TypedDict):
    image_path: str                  # Path to the uploaded prescription image
    prescription_data: dict          # Structured JSON extracted by the Vision agent
    rag_results: list[dict]          # Drug profiles retrieved from ChromaDB
    safety_warnings: list[str]       # Interaction warnings from the Safety agent
    daily_schedule: dict             # Morning/Noon/Evening/Night medication plan
    confidence_score: float          # 0.0–1.0 reliability score
    flagged_for_review: bool         # True if confidence < threshold
    patient_id: str                  # Patient identifier for context
    error: str | None                # Error message if any node fails
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | LangGraph |
| LLM / Vision | Google Gemini / Anthropic Claude |
| Vector Database | ChromaDB |
| Embeddings | sentence-transformers |
| Backend | FastAPI + Uvicorn |
| Real-time | Socket.io |
| Frontend | React 18 + Tailwind CSS |
| HTTP Client | Axios |
| File Upload | react-dropzone |
| Chat AI | Groq API (Llama 3) |
| Containerization | Docker |

---
## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Gemini or Anthropic API key
- A Groq API key (for MediChat)

### 1. Clone the repository

```bash
git clone https://github.com/Radhikaa-chauhan/ScriptStream.git
cd ScriptStream
```

### 2. Backend setup

```bash
pip install -r requirements.txt
```

Create a `.env` file in the root:

```env
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
CHROMA_PERSIST_DIR=./data/chroma
CONFIDENCE_THRESHOLD=0.85
```

Ingest drug data into ChromaDB:

```bash
python core/rag_engine.py --ingest
```

Start the FastAPI server:

```bash
uvicorn main:app --reload --port 4000
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_SOCKET_URL=http://localhost:4000
```

Start the React dev server:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Upload a prescription image; returns `job_id` |
| `GET` | `/api/result/{job_id}` | Poll for analysis result |
| `GET` | `/api/prescriptions` | Fetch all prescriptions for a patient |
| `GET` | `/api/prescriptions/{id}` | Fetch a single prescription result |
| `POST` | `/api/chat` | Send a MediChat message with prescription context |
| `POST` | `/api/admin/approve/{job_id}` | Admin approves and publishes a flagged result |
| `POST` | `/api/admin/reject/{job_id}` | Admin rejects a scan |
| `POST` | `/api/admin/escalate/{job_id}` | Admin escalates a case to a doctor |

### Upload flow

```
POST /api/analyze  (multipart/form-data, field: "file")
→ { "job_id": "JOB-1234", "status": "queued" }

# Connect to Socket.io with job_id to receive live events:
job:queued       → processing started
job:processing   → { step, progress }
job:completed    → { result }
job:failed       → { error }
log              → { time, level, msg }
```

---

## 🐳 Docker

Build and run the full stack with Docker Compose:

```bash
docker-compose up --build
```

This starts the FastAPI backend on port `4000` and the React frontend on port `3000`.

---

## 📋 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for Vision OCR | — |
| `GROQ_API_KEY` | Groq API key for MediChat (Llama 3) | — |
| `CHROMA_PERSIST_DIR` | Directory for ChromaDB persistence | `./data/chroma` |
| `CONFIDENCE_THRESHOLD` | Minimum score before flagging for review | `0.85` |
| `REACT_APP_API_URL` | Backend API base URL (frontend) | `http://localhost:4000/api` |
| `REACT_APP_SOCKET_URL` | Socket.io server URL (frontend) | `http://localhost:4000` |

---
## 🔒 Safety & Compliance

- All prescription data is processed locally; no patient data is sent to third-party services except the LLM API for OCR extraction.
- The Admin review panel ensures no AI-extracted result reaches a patient without human verification when confidence is below threshold.
- MediChat responses are derived from FDA drug database data and carry a disclaimer that they do not substitute professional medical advice.

---

