import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import all routers from your routes directory
from app.api.routes import auth, agent, salesforce, knowledge
from app.api.routes import batch, agent_chat, drafts

app = FastAPI(
    title="AgentIQ API", 
    version="1.0.0",
    description="Backend for AI-driven Sales Proposals with Salesforce RAG"
)

# --- Middleware ---
# Updated to handle both localhost and common development ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes Registration ---

# The Heart: Streaming Agent (LangGraph + RAG)
app.include_router(agent.router, prefix="/api/agent", tags=["Agentic RAG"])

# The Connectivity: OAuth Login and Callbacks
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

# The Data: Fetching Leads and Customer Context
app.include_router(salesforce.router, prefix="/api/salesforce", tags=["Salesforce Data"])

# The Knowledge: PDF Ingestion and Vector Store Management
app.include_router(knowledge.router, prefix="/api/kb", tags=["Knowledge Base"])

# The Batch: CSV File Processing
app.include_router(batch.router, prefix="/api/batch", tags=["Batch Processing"])

# The Chat: AI Agent Conversational Interface
app.include_router(agent_chat.router, prefix="/api/agent-chat", tags=["AI Agent Chat"])

# The Drafts: AI-Powered Draft Analysis and Insights
app.include_router(drafts.router, prefix="/api/drafts", tags=["Draft Analysis"])

# --- System Health ---

@app.get("/health")
async def health():
    """Check if the backend and environment variables are loaded."""
    return {
        "status": "up",
        "environment": {
            "sf_connected": bool(os.getenv("SF_CLIENT_ID")),
            "groq_connected": bool(os.getenv("GROQ_API_KEY")),
            "supabase_connected": bool(os.getenv("SUPABASE_URL"))
        }
    }

@app.get("/")
async def root():
    """Landing page instructions."""
    return {
        "message": "AgentIQ API is live.",
        "docs": "/docs",
        "next_step": "Visit /api/auth/login to authenticate with Salesforce."
    }