import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Path setup for app imports
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.services.supabase import supabase
from langchain_huggingface import HuggingFaceEmbeddings

# Initialize Local Model
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def ingest_text(text: str, metadata: dict = None):
    """Generates embeddings and inserts raw text into Supabase."""
    print(f"Adding to Knowledge Base: {text[:50]}...")
    
    # Generate the 384-dimensional vector locally on your Mac
    vector = embeddings.embed_query(text)
    
    data = {
        "content": text,
        "metadata": metadata or {"source": "manual_entry"},
        "embedding": vector
    }
    
    try:
        supabase.table("documents").insert(data).execute()
        print("✅ Success!")
    except Exception as e:
        print(f"❌ Supabase Error: {e}")

if __name__ == "__main__":
    # Title: AgentIQ Enterprise Product Manual
    
    # 1. Pro Plan Info
    ingest_text(
        "AgentIQ Pro Plan: Priced at $49/month. Designed for small teams. "
        "Includes standard Salesforce sync, 5 user seats, and 1 core knowledge base PDF. "
        "Perfect for budget-conscious startups."
    )
    
    # 2. Enterprise Plan Info
    ingest_text(
        "AgentIQ Enterprise Plan: Custom Pricing. Designed for large-scale operations. "
        "Includes unlimited user seats, 24/7 priority technical support, and unlimited "
        "document ingestion for RAG. Features advanced encryption and dedicated GPU inference."
    )
    
    # 3. Security/Technical Info
    ingest_text(
        "AgentIQ Technical Specs: Uses local 384-dimensional embeddings (all-MiniLM-L6-v2) "
        "for data privacy. Integrates via OAuth 2.0 with Salesforce Lightning and Classic."
    )

    print("\n🚀 Knowledge Base populated successfully!")