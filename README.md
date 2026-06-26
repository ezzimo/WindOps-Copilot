WindOps Copilot
===============

WindOps Copilot is an AI assistant for monitoring and diagnosing wind turbine operations. It ingests telemetry data, detects anomalies, diagnoses root causes, recommends actions, and dispatches notifications through a multi-agent pipeline.

Overview
--------

The application processes sensor readings from wind turbines through a LangGraph-based pipeline. Each telemetry payload triggers a sequence of specialized agents that analyze the data, evaluate severity, and generate incidents and alerts when required. The system is designed to support operators with automated diagnostics and centralized observability.

The project is organized into three main components:

- Backend: FastAPI service that hosts the agent pipeline and REST API
- Frontend: React dashboard for visualizing turbines, alerts, incidents, and metrics
- MongoDB: Document store for telemetry, incidents, alerts, and reports

Architecture
------------

A telemetry request enters the FastAPI backend through the `/api/telemetry` endpoint. The payload is mapped to the shared `WindOpsState` and passed to the LangGraph pipeline. The graph executes the following agents in order:

1. Supervisor: validates required sensor fields
2. Monitoring: detects anomalies and assigns severity
3. Diagnosis: identifies the root cause
4. Decision: recommends an action and decides whether notification is required
5. Notification: creates an incident, generates a PDF report, sends an email, and logs an alert

Conditional edges route the state from monitoring to diagnosis only when an anomaly is detected, and from decision to notification only when the severity is `high` or `critical`.

Technology Stack
----------------

| Layer | Technology |
|-------|------------|
| Backend framework | FastAPI, Python 3.11 |
| Agent orchestration | LangGraph, LangChain |
| LLM providers | OpenAI, Groq, Google Gemini |
| Database | MongoDB 7 |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Render |

Project Structure
-----------------

```
.
├── backend/
│   ├── agents/           # LangGraph agent nodes
│   │   ├── supervisor/
│   │   ├── monitoring/
│   │   ├── diagnosis/
│   │   ├── decision/
│   │   └── notification/
│   ├── graph/            # State, graph definition, edges
│   ├── services/         # External integrations (email, reports)
│   ├── config.py         # Environment and provider configuration
│   ├── main.py           # FastAPI application
│   ├── database.py       # MongoDB client
│   └── repositories.py   # Incident and alert persistence
├── frontend/             # React dashboard
├── tests/                # Backend test suite
├── docker-compose.yml
└── .github/workflows/    # CI and deployment pipelines
```

Quick Start
-----------

### Prerequisites

- Docker and Docker Compose
- Git
- A valid API key for at least one supported LLM provider

### Run with Docker Compose

1. Clone the repository.
2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Fill in the required variables in `.env`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

MONGODB_URL=mongodb://mongodb:27017
MONGODB_DB=windops
```

4. Start the services:

```bash
docker compose up --build
```

The backend is available at `http://localhost:8000` and the frontend at `http://localhost:3000`.

### Run Backend Tests Locally

```bash
pip install -r backend/requirements.txt
pytest tests/ -v --tb=short
```

### Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

Main API Endpoints
------------------

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/telemetry` | Submit turbine telemetry and trigger the analysis pipeline |
| GET | `/api/turbines` | List supervised turbines |
| GET | `/api/alerts` | List alerts |
| GET | `/api/incidents` | List incidents |
| GET | `/api/incidents/{incident_id}` | Retrieve a single incident |
| GET | `/api/reports/{report_id}` | Download a generated PDF report |
| GET | `/api/emails` | List emails sent by the notification service |
| GET | `/api/metrics` | Retrieve real-time dashboard metrics |
| GET | `/health` | Backend health check |

CI/CD
-----

The repository includes two GitHub Actions workflows:

- `ci.yml`: runs backend tests against Python 3.11, builds the frontend with Node.js 20, builds Docker images, and performs a smoke test on the backend container.
- `deploy.yml`: triggers deployment hooks for the backend and frontend services on Render when changes are pushed to the `main` branch.

Environment Variables
---------------------

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openai` | Selected LLM provider: `openai`, `groq`, or `gemini` |
| `OPENAI_API_KEY` | empty | API key for OpenAI |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model name |
| `GROQ_API_KEY` | empty | API key for Groq |
| `GROQ_MODEL` | `llama3-70b-8192` | Groq model name |
| `GOOGLE_API_KEY` | empty | API key for Google Gemini |
| `GOOGLE_MODEL` | `gemini-1.5-flash` | Gemini model name |
| `MONGODB_URL` | `mongodb://mongodb:27017` | MongoDB connection string |
| `MONGODB_DB` | `windops` | MongoDB database name |

License
-------

This project is provided as-is for demonstration and educational purposes.
