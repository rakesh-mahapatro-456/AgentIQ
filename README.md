<div align="center">

```
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗██╗ ██████╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██║██╔═══██╗
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ██║██║   ██║
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██║██║▄▄ ██║
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ██║╚██████╔╝
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚══▀▀═╝
```

**Agentic AI Workforce for Salesforce-Native Sales Automation**

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-000000?style=flat-square&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.13+-3776AB?style=flat-square&logo=python&logoColor=white)

*Built for **NeuraX 2.0 — National Level Hackathon** · Team Techies*

</div>

---

## `$ cat overview.txt`

AgentIQ automates the entire sales proposal lifecycle using a **LangGraph ReAct agent** that reasons across three registered tools — CRM Tool (Salesforce), RAG Tool (Supabase vector search), and Proposal Tool (FPDF2 PDF generation). The agent reasons, calls tools, validates context, and generates a personalized PDF exported via `/api/agent/export-pdf`.

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. DATA ACCESS & KNOWLEDGE BASE                                    │
│                                                                     │
│  Salesforce CRM ──simple-salesforce──► Real-time CRM Connector      │
│  (Leads, Opportunities, Account History)                            │
│                                                                     │
│  Product Knowledge Base (PDFs/Docs)                                 │
│  → Document Ingestion & Embedding (all-MiniLM-L6-v2, local)        │
│  → Vector Search via Supabase RPC (match_documents)                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│  2. AI AGENT ORCHESTRATION                                          │
│                                                                     │
│  Agentic Core Engine (LangGraph + LangChain + FastAPI)              │
│  ReAct Loop: Reason → Act → Observe → Reason...                     │
│                                                                     │
│  Agent Tools Registry:                                              │
│  ├── CRM Tool      →  fetch leads from Salesforce                  │
│  ├── RAG Tool      →  semantic search via Supabase RPC             │
│  └── Proposal Tool →  generate proposal content                     │
│                                                                     │
│  Groq API (Llama 3.3 70B Versatile) →  contextual reasoning        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│  3. OUTPUT & ACTION                                                 │
│                                                                     │
│  Agent generates proposal data (JSON)                               │
│  → PDF generation via FPDF2 (pdf_engine.py)                        │
│  → PDF exported via POST /api/agent/export-pdf                     │
│  → UI allows sales rep to review / edit draft                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## `$ cat frontend_backend_flow.txt`

```
Frontend (Next.js 16 / React 19)
  ├── Dashboard UI        →  Generate Proposal form
  ├── Agent Status        →  live step indicators via SSE stream
  │   Fetching CRM → Searching KB → Drafting PDF → Final Review
  └── Auth               →  Salesforce OAuth callback
                             tokens stored in localStorage

        │ 1. HTTP Request (/api/agent, /api/batch, etc.)
        ▼
FastAPI App Gateway
        │
        ▼
LangGraph Agent Orchestrator
  ├── Fetch Lead Data       (CRM Tool → simple-salesforce)
  ├── Search Product RAG    (RAG Tool → Supabase RPC match_documents)
  ├── Validate Context
  └── Generate PDF          (Proposal Tool → FPDF2 pdf_engine.py)
        │
        ▼
Supabase PostgreSQL
  ├── RAG Vectors (pgvector + match_documents RPC)
  └── Document embeddings

  Draft storage → in-memory dict (draft_storage = {})
                  (Supabase persistence planned, not yet implemented)

        │ SSE stream → agent step events only
        ▼             PDF fetched separately via POST /api/agent/export-pdf
Frontend receives result
```

---

## `$ cat features.txt`

### 🤖 ReAct Agent (LangGraph + LangChain)
- **ReAct loop** — Reason, Act, Observe cycle until proposal is complete
- Three registered tools: CRM Tool, RAG Tool, Proposal Tool
- Agent decides which tools to call and in what order based on context
- Groq API (Llama 3.3 70B Versatile) for all reasoning steps

### 📡 Live Thought Console (SSE Streaming)
- Every agent step streamed to the browser via Server-Sent Events
- Step indicators: Fetching CRM → Searching KB → Drafting PDF → Final Review
- Full agent observability — no black box

### 🧠 RAG Knowledge Base
- PDF/DOC ingestion with document chunking
- Local embeddings via **all-MiniLM-L6-v2**
- Vector search via **Supabase** (`documents` table + `match_documents` RPC)
- Semantic retrieval at query time via RAG Tool

### 🔗 Salesforce Integration
- **simple-salesforce** Python library for CRM API calls
- Fetches Leads, Opportunities, Account History
- Salesforce OAuth 2.0 PKCE auth flow
- Tokens stored in localStorage on frontend

### 📄 PDF Proposal Generation
- **FPDF2** (`backend/app/services/pdf_engine.py`)
- PDF exported via `POST /api/agent/export-pdf`
- UI allows sales rep to review and edit draft before use

### 📦 Batch Processing
- CSV upload for bulk lead imports
- Mass proposal generation pipeline
- Draft storage in-memory (`draft_storage = {}`) — Supabase persistence planned

---

## `$ cat stack.txt`

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  BACKEND                                                        │
│  FastAPI (Python 3.13+)    →  REST API + SSE streaming         │
│  LangGraph + LangChain     →  ReAct agent orchestration        │
│  Groq API / Llama 3.3 70B  →  contextual reasoning             │
│  simple-salesforce         →  Salesforce CRM API client        │
│  FPDF2                     →  PDF generation (pdf_engine.py)   │
│  all-MiniLM-L6-v2 (local)  →  document embeddings             │
│                                                                 │
│  DATABASE                                                       │
│  Supabase (Postgres+pgvector) → documents embeddings +          │
│                                match_documents RPC only        │
│  In-memory dict            →  draft storage (demo only)        │
│                                                                 │
│  AUTH                                                           │
│  Salesforce OAuth 2.0 PKCE →  tokens in localStorage (frontend)│
│                             +  in-memory token store (backend) │
│                                                                 │
│  STREAMING                                                      │
│  Server-Sent Events (SSE)  →  live agent step observability    │
│                                                                 │
│  FRONTEND                                                       │
│  Next.js 16 (React 19)     →  streaming UI                     │
│  Redux Toolkit             →  state management                 │
│  Tailwind CSS + shadcn/ui  →  components                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## `$ ls -la platform/`

### Landing Page
![Landing Page](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542387/Screenshot_2026-03-15_at_08.08.14_tpjxem.png)

### Sign In
![Sign In](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542389/Screenshot_2026-03-15_at_08.07.55_z8mdiq.png)

### Agent Dashboard
> Real-time AI research, live SSE thought console, proposal drafting

![Dashboard](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542386/Screenshot_2026-03-15_at_08.05.58_lhoclp.png)

### Batch CSV Processing
> Scale personalization across hundreds of leads simultaneously

![Batch Processing](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542387/Screenshot_2026-03-15_at_08.06.55_c7n1be.png)

### All Drafts
![All Drafts](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542387/Screenshot_2026-03-15_at_08.07.14_cdu6pd.png)

### AI Assistant
![AI Assistant](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542387/Screenshot_2026-03-15_at_08.07.36_sn5qan.png)

---

## `$ tree api/`

```
/api/
├── auth/          # Salesforce OAuth flow & token management
├── salesforce/    # Lead sync & CRM operations
├── agent/         # LangGraph ReAct agent + SSE streaming
├── batch/         # Bulk CSV lead processing pipeline
├── drafts/        # Draft storage & management
├── kb/            # Knowledge base — ingest, embed, search
└── agent-chat/    # Conversational AI assistant
```

```
frontend/my-app/
├── (protected)/
│   ├── dashboard/     # Main agent workspace + thought console
│   ├── agent/         # AI assistant chat
│   ├── batch/         # Bulk operations
│   ├── drafts/        # Draft management
│   └── integrations/  # CRM & system connections
├── components/
│   ├── dashboard/     # AIAgentChat, KnowledgeBase
│   ├── batch/         # BatchModeDashboard
│   └── ui/            # shadcn component library
└── store/
    └── features/      # Redux state slices
```

---

## `$ cat setup.txt`

### Prerequisites
```
Python 3.13+
Node.js 20+
Supabase project (pgvector enabled)
Groq API key
Salesforce Connected App credentials
```

### Backend
```bash
cd backend
uv sync   # installs from pyproject.toml + uv.lock
cp .env.example .env
uv run uvicorn app.main:app --reload
# API at http://localhost:8000
```

### Frontend
```bash
cd frontend/my-app
npm install
cp .env.local.example .env.local
npm run dev
# App at http://localhost:3000
```

---

## `$ cat .env.example`

### Backend
```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SF_CLIENT_ID=your_salesforce_client_id
SF_CLIENT_SECRET=your_salesforce_client_secret
SF_REDIRECT_URI=http://localhost:8000/api/auth/callback
```

### Frontend
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## `$ cat limitations.txt`

```
⚠  DEMO / HACKATHON BUILD — not production-hardened

In-memory storage:
  draft_storage = {}     →  drafts lost on server restart
  token store (backend)  →  Salesforce tokens not persisted

Not implemented:
  Email sending          →  no email service wired up
  HITL approval workflow →  UI review only, no backend state machine
  Draft persistence      →  Supabase drafts table planned, not built

Security notes:
  Salesforce tokens stored in localStorage (frontend)
  Backend token store is in-memory (demo only)
  Tokens passed as query params to some endpoints (avoid in production)
  Rotate all API keys before any public deployment
```

**Future work:** persist drafts + tokens to Supabase, add email delivery via SendGrid/Resend, implement proper HITL approve/reject state in LangGraph.

---

<div align="center">

```
$ echo $BUILT_FOR
  NeuraX 2.0 — National Level Hackathon
  Team Techies · Built with ❤️
```

</div>
