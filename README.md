# AgentIQ 🚀

### The Agentic AI Workforce for Salesforce-Native Sales Automation

**AgentIQ** is an enterprise-grade AI platform built for the **NeuraX 2.0 National Level Hackathon**. It transforms how sales teams research, draft, and manage proposals by combining **LangGraph** multi-agent orchestration with live **Salesforce** CRM data and a private **RAG Knowledge Base**.

---

## 🏗️ System Architecture

### High-Level Project Architecture

> A bird's-eye view of the AgentIQ ecosystem — from frontend to backend services.

![Project Architecture](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773477241/archit_yfa8zp.png)

### Frontend ↔ Backend Interaction

> Detailed mapping of the Next.js to FastAPI communication flow, including SSE streaming, OAuth, and vector search.

![Frontend-Backend Architecture](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773477240/archi2_sjvsit.png)

---

## 🖼️ Platform Preview

### 🌐 Landing Page

![Landing Page](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542387/Screenshot_2026-03-15_at_08.08.14_tpjxem.png)

### 🔐 Sign In

![Sign In](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542389/Screenshot_2026-03-15_at_08.07.55_z8mdiq.png)

### 🤖 Agent Dashboard

> Real-time AI research, live streaming thought console, and proposal drafting with quality scoring.

![Dashboard](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542386/Screenshot_2026-03-15_at_08.05.58_lhoclp.png)

### 📊 Batch CSV Processing

> Scale personalization across hundreds of leads simultaneously with bulk draft generation.

![Batch Processing](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542387/Screenshot_2026-03-15_at_08.06.55_c7n1be.png)

### 📝 All Drafts

> Manage, review, and iterate on all generated proposals from a single view.

![All Drafts](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542387/Screenshot_2026-03-15_at_08.07.14_cdu6pd.png)

### 💬 AI Assistant

> Conversational AI assistant for on-demand sales strategy, objection handling, and research.

![AI Assistant](https://res.cloudinary.com/dqz5xgr5v/image/upload/v1773542387/Screenshot_2026-03-15_at_08.07.36_sn5qan.png)

---

## 🎯 Core Features

### 🤖 Agentic Workflow (LangGraph)
A four-node non-linear pipeline that automates the entire proposal lifecycle:
```
Discovery → Research → Draft → Score
```
- **Discovery Node** — Fetches live lead data from Salesforce CRM
- **Research Node** — Performs semantic search across the private Knowledge Base
- **Writer Node** — Generates hyper-personalized proposals using Llama 3.3 70B
- **Scoring Agent** — Critiques every draft on a 1–100 scale across multiple quality dimensions

### 📡 Live Thought Console
Full, real-time observability into the AI's reasoning process via SSE streaming. Watch every step of the agent's workflow unfold live in the browser.

### 📈 Proposal Quality Scoring
- Multi-criteria evaluation: Personalization, Professionalism, Value Proposition, CTA strength
- 1–100 quality score with color-coded visual indicators
- Success probability prediction for conversion estimates
- Automated AI insights with actionable improvement suggestions

### 🧠 RAG Knowledge Base
- PDF/DOC ingestion with intelligent chunking
- Supabase `pgvector` embeddings for semantic search
- File listing, metadata tracking, and bulk management
- Private company docs stay private — fully self-hosted vector store

### 🔗 Salesforce-Native Integration
- OAuth 2.0 PKCE authentication flow
- Real-time CRM data sync
- Direct lead record access and management
- Secure token storage and refresh handling

### 📦 Batch Processing
- CSV upload for bulk lead imports
- Mass proposal generation with configurable pipelines
- Advanced search and filter across all leads
- Analytics dashboard with processing metrics

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (React 19), Redux Toolkit, Tailwind CSS, Shadcn/ui, Lucide React |
| **Backend** | FastAPI (Python), LangGraph, Groq API (Llama 3.3 70B) |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **Auth** | Salesforce OAuth 2.0 PKCE |
| **Streaming** | Server-Sent Events (SSE) |

---

## 📁 Project Structure

### Backend API
```
/api/
├── auth/          # OAuth flow & token management
├── salesforce/    # Lead sync & CRM operations
├── agent/         # AI agent streaming & workflow
├── batch/         # Bulk lead processing
├── drafts/        # Draft analysis & management
├── kb/            # Knowledge base management
└── agent-chat/    # AI assistant chat
```

### Frontend
```
app/
├── (protected)/
│   ├── dashboard/     # Main agent workspace
│   ├── agent/         # AI assistant chat
│   ├── batch/         # Bulk operations
│   ├── drafts/        # Draft management
│   └── integrations/  # CRM & system connections
├── components/
│   ├── dashboard/     # AIAgentChat, KnowledgeBase
│   ├── batch/         # BatchModeDashboard
│   └── ui/            # Reusable component library
└── store/
    └── features/      # Redux state slices
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Supabase project with `pgvector` enabled
- Groq API key
- Salesforce Connected App credentials

### Backend Setup
```bash
cd backend
uv init
uv pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add: GROQ_API_KEY, SUPABASE_URL, SUPABASE_KEY, SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET

uv run uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install

# Configure environment
cp .env.local.example .env.local
# Add: NEXT_PUBLIC_API_URL

npm run dev
```

The app will be available at `http://localhost:3000` with the API running at `http://localhost:8000`.

---

## 🔧 Environment Variables

### Backend `.env`
```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
SALESFORCE_CLIENT_ID=your_sf_client_id
SALESFORCE_CLIENT_SECRET=your_sf_client_secret
SALESFORCE_REDIRECT_URI=http://localhost:8000/api/auth/callback
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🏆 Built For

**NeuraX 2.0 — National Level Hackathon**

Developed with ❤️ by **Team Techies**
