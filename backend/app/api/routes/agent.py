import json
import os
from typing import Optional
from fastapi import APIRouter, Body, Query, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from app.core.agent.graph import agent_app
from app.services.pdf_engine import generate_proposal_pdf

router = APIRouter()

@router.get("/stream")
async def stream_agent(
    lead_email: str = Query(...),
    access_token: Optional[str] = Query(None),
    instance_url: Optional[str] = Query(None)
):
    # Ensure logs start empty and state is clean for each run
    initial_state = {
        "lead_email": lead_email,
        "sf_context": {
            "access_token": access_token,
            "instance_url": instance_url
        },
        "logs": [] 
    }

    async def event_generator():
        try:
            async for event in agent_app.astream(initial_state):
                # We wrap in data: prefix for standard SSE compliance
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            # Send a clear error event if the agent crashes (e.g., Groq rate limit)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/export-pdf")
async def export_pdf(data: dict = Body(...)):
    """Generates and returns a professional PDF of the proposal."""
    full_content = data.get("content", "")
    lead_name = data.get("lead_name", "Lead").replace(" ", "_")
    
    if not full_content:
        raise HTTPException(status_code=400, detail="No content provided")
    
    # Logic to only put the Proposal part in the PDF
    if "---EMAIL_END---" in full_content:
        # Takes everything after the separator
        proposal_body = full_content.split("---EMAIL_END---")[-1].strip()
    else:
        proposal_body = full_content

    try:
        filename = f"Proposal_{lead_name}.pdf"
        file_path = generate_proposal_pdf(proposal_body, filename)
        
        return FileResponse(
            path=file_path, 
            media_type="application/pdf", 
            filename=filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))