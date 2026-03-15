import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings

# 1. Path Setup
base_dir = Path(__file__).resolve().parents[2]
env_path = base_dir / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# 2. Initialize Clients
# Changed 'supabase' to 'supabase_client' to fix the ImportError
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize the local model (384-dim)
embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

async def get_relevant_docs(query: str, match_threshold: float = 0.3):
    query_embedding = embeddings_model.embed_query(query)
    
    rpc_params = {
        "query_embedding": query_embedding,
        "match_threshold": match_threshold,
        "match_count": 3,
    }
    
    try:
        response = supabase_client.rpc("match_documents", rpc_params).execute()
        
        if not response.data:
            return [{"content": "General AgentIQ product benefits: AI-driven sales, Salesforce integration, and automated proposals."}]
            
        return response.data
    except Exception as e:
        print(f"📡 Supabase RPC Error: {e}")
        return []