import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.services.supabase import supabase_client, embeddings_model

router = APIRouter()

@router.post("/ingest")
async def ingest_document(file: UploadFile = File(...)):
    """Uploads, chunks, embeds, and stores a PDF in Supabase."""
    temp_path = f"temp_{file.filename}"
    
    try:
        # 1. Save uploaded file to local temp storage
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # 2. Load and Split the PDF
        loader = PyPDFLoader(temp_path)
        pages = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=600, 
            chunk_overlap=50
        )
        chunks = text_splitter.split_documents(pages)
        
        # 3. Generate Embeddings & Prepare for Supabase
        batch_data = []
        for chunk in chunks:
            vector = embeddings_model.embed_query(chunk.page_content)
            batch_data.append({
                "content": chunk.page_content,
                "metadata": {"source": file.filename, "page": chunk.metadata.get("page")},
                "embedding": vector
            })
            
        # 4. Upsert into Supabase
        supabase_client.table("documents").insert(batch_data).execute()
        
        return {
            "message": f"Successfully ingested {len(chunks)} chunks from {file.filename}",
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # 5. Cleanup temp file so your MacBook doesn't get cluttered
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.delete("/clear")
async def clear_knowledge_base():
    """Wipes the documents table so you can switch CRM contexts."""
    try:
        # This deletes all rows from the documents table
        supabase_client.table("documents").delete().neq("content", "forced_delete_hack").execute()
        return {"message": "Knowledge base cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))