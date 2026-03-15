from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
from pathlib import Path

from app.services.ai_insights import ai_insights_service
from app.services.pdf_engine import generate_proposal_pdf

router = APIRouter()

class DraftContent(BaseModel):
    content: str
    title: Optional[str] = None
    lead_data: Optional[Dict[str, Any]] = None

class DraftAnalysis(BaseModel):
    draft_id: Optional[str] = None
    content: str
    title: Optional[str] = None
    lead_data: Optional[Dict[str, Any]] = None

class DraftComparison(BaseModel):
    drafts: List[DraftAnalysis]

# In-memory storage for demo (replace with database in production)
draft_storage = {}

@router.post("/analyze")
async def analyze_draft(draft: DraftAnalysis):
    """Generate AI insights for a single draft."""
    try:
        insights = await ai_insights_service.generate_draft_insights(
            draft.content, 
            draft.lead_data
        )
        
        # Store draft if it has an ID
        if draft.draft_id:
            draft_storage[draft.draft_id] = {
                "content": draft.content,
                "title": draft.title,
                "lead_data": draft.lead_data,
                "insights": insights,
                "created_at": insights.get('generated_at')
            }
        
        return {
            "success": True,
            "insights": insights,
            "draft_id": draft.draft_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/batch-analyze")
async def analyze_multiple_drafts(drafts: List[DraftAnalysis]):
    """Generate AI insights for multiple drafts."""
    try:
        results = await ai_insights_service.generate_batch_insights([
            {
                "id": draft.draft_id,
                "content": draft.content,
                "title": draft.title,
                "lead_data": draft.lead_data
            }
            for draft in drafts
        ])
        
        # Store drafts
        for i, draft in enumerate(drafts):
            if draft.draft_id:
                draft_storage[draft.draft_id] = {
                    "content": draft.content,
                    "title": draft.title,
                    "lead_data": draft.lead_data,
                    "insights": results[i],
                    "created_at": results[i].get('generated_at')
                }
        
        return {
            "success": True,
            "total_analyzed": len(results),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@router.post("/compare")
async def compare_drafts(comparison: DraftComparison):
    """Compare multiple drafts and provide recommendations."""
    try:
        drafts_data = [
            {
                "content": draft.content,
                "title": draft.title or f"Draft {i+1}",
                "lead_data": draft.lead_data
            }
            for i, draft in enumerate(comparison.drafts)
        ]
        
        comparison_result = await ai_insights_service.compare_drafts(drafts_data)
        
        return {
            "success": True,
            "comparison": comparison_result,
            "drafts_compared": len(comparison.drafts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@router.get("/list")
async def list_drafts():
    """List all stored drafts with their insights."""
    try:
        drafts_list = []
        
        for draft_id, draft_data in draft_storage.items():
            drafts_list.append({
                "id": draft_id,
                "title": draft_data.get("title", "Untitled"),
                "created_at": draft_data.get("created_at"),
                "overall_score": draft_data.get("insights", {}).get("overall_score", 0),
                "success_probability": draft_data.get("insights", {}).get("success_probability", 0),
                "content_preview": draft_data.get("content", "")[:100] + "..." if len(draft_data.get("content", "")) > 100 else draft_data.get("content", "")
            })
        
        # Sort by creation date (newest first)
        drafts_list.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return {
            "success": True,
            "total_drafts": len(drafts_list),
            "drafts": drafts_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list drafts: {str(e)}")

@router.get("/{draft_id}")
async def get_draft_details(draft_id: str):
    """Get detailed information about a specific draft including insights."""
    try:
        if draft_id not in draft_storage:
            raise HTTPException(status_code=404, detail="Draft not found")
        
        draft_data = draft_storage[draft_id]
        
        return {
            "success": True,
            "draft": {
                "id": draft_id,
                "content": draft_data.get("content"),
                "title": draft_data.get("title"),
                "lead_data": draft_data.get("lead_data"),
                "insights": draft_data.get("insights"),
                "created_at": draft_data.get("created_at")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get draft: {str(e)}")

@router.post("/{draft_id}/improve")
async def improve_draft(draft_id: str, feedback: Optional[str] = None):
    """Generate an improved version of a draft based on AI insights."""
    try:
        if draft_id not in draft_storage:
            raise HTTPException(status_code=404, detail="Draft not found")
        
        draft_data = draft_storage[draft_id]
        insights = draft_data.get("insights", {})
        
        # Create improvement prompt based on insights
        improvement_prompt = f"""
        Please improve the following proposal draft based on these insights:
        
        ORIGINAL DRAFT:
        {draft_data.get('content', '')}
        
        AI INSIGHTS:
        - Overall Score: {insights.get('overall_score', 'N/A')}/10
        - Strengths: {', '.join(insights.get('strengths', []))}
        - Improvements Needed: {', '.join(insights.get('improvements', []))}
        - Missing Elements: {', '.join(insights.get('missing_elements', []))}
        - Recommended Actions: {', '.join(insights.get('recommended_actions', []))}
        
        Additional Feedback: {feedback or 'None provided'}
        
        Please provide an improved version that addresses all the identified issues.
        """
        
        from app.services.llm import llm_service
        from langchain_core.messages import HumanMessage, SystemMessage
        
        llm = llm_service.get_model()
        
        messages = [
            SystemMessage(content="You are an expert proposal writer improving sales proposals based on AI insights."),
            HumanMessage(content=improvement_prompt)
        ]
        
        response = await llm.ainvoke(messages)
        improved_content = response.content
        
        # Generate insights for the improved version
        improved_insights = await ai_insights_service.generate_draft_insights(
            improved_content, 
            draft_data.get("lead_data")
        )
        
        # Store improved version
        improved_draft_id = f"{draft_id}_improved"
        draft_storage[improved_draft_id] = {
            "content": improved_content,
            "title": f"{draft_data.get('title', 'Draft')} - Improved",
            "lead_data": draft_data.get("lead_data"),
            "insights": improved_insights,
            "created_at": improved_insights.get('generated_at'),
            "parent_draft_id": draft_id
        }
        
        return {
            "success": True,
            "improved_draft_id": improved_draft_id,
            "improved_content": improved_content,
            "improved_insights": improved_insights,
            "original_score": insights.get('overall_score', 0),
            "improved_score": improved_insights.get('overall_score', 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to improve draft: {str(e)}")

@router.delete("/{draft_id}")
async def delete_draft(draft_id: str):
    """Delete a draft and its insights."""
    try:
        if draft_id not in draft_storage:
            raise HTTPException(status_code=404, detail="Draft not found")
        
        del draft_storage[draft_id]
        
        return {
            "success": True,
            "message": f"Draft {draft_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete draft: {str(e)}")

@router.get("/analytics/summary")
async def get_analytics_summary():
    """Get analytics summary across all drafts."""
    try:
        if not draft_storage:
            return {
                "success": True,
                "total_drafts": 0,
                "analytics": {
                    "average_score": 0,
                    "average_success_probability": 0,
                    "total_improvements_suggested": 0,
                    "common_strengths": [],
                    "common_improvements": []
                }
            }
        
        total_score = 0
        total_success_prob = 0
        all_strengths = []
        all_improvements = []
        
        for draft_data in draft_storage.values():
            insights = draft_data.get("insights", {})
            total_score += insights.get("overall_score", 0)
            total_success_prob += insights.get("success_probability", 0)
            all_strengths.extend(insights.get("strengths", []))
            all_improvements.extend(insights.get("improvements", []))
        
        # Count common themes
        from collections import Counter
        common_strengths = Counter(all_strengths).most_common(5)
        common_improvements = Counter(all_improvements).most_common(5)
        
        analytics = {
            "average_score": round(total_score / len(draft_storage), 2),
            "average_success_probability": round(total_success_prob / len(draft_storage), 2),
            "total_improvements_suggested": len(all_improvements),
            "common_strengths": [{"theme": item[0], "count": item[1]} for item in common_strengths],
            "common_improvements": [{"theme": item[0], "count": item[1]} for item in common_improvements]
        }
        
        return {
            "success": True,
            "total_drafts": len(draft_storage),
            "analytics": analytics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")
