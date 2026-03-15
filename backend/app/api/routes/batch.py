from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import pandas as pd
from io import StringIO

from app.services.batch_processor import process_csv_batch
from app.services.salesforce import sf_service
from app.services.ai_insights import ai_insights_service
from app.core.agent.nodes import draft_proposal_node
from app.core.agent.state import AgentState

router = APIRouter()

class LeadSearchRequest(BaseModel):
    query: Optional[str] = None
    industry: Optional[str] = None
    status: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    limit: int = 50

class BatchDraftRequest(BaseModel):
    lead_ids: List[str]
    draft_type: str = "email"  # "email" or "proposal"
    template_type: Optional[str] = None
    personalization_level: str = "medium"  # "low", "medium", "high"

class BatchWorkflowRequest(BaseModel):
    name: str
    lead_ids: List[str]
    steps: List[Dict[str, Any]]

# In-memory storage for batch operations (replace with database in production)
batch_leads = []
batch_workflows = []
batch_drafts = []

@router.post("/upload")
async def upload_csv_leads(file: UploadFile = File(...)):
    """Upload and process CSV leads file."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    try:
        # Process the CSV
        results = await process_csv_batch(content)
        
        # Store leads for batch operations
        for lead in results:
            lead['id'] = f"lead_{len(batch_leads) + 1}"
            lead['source'] = 'csv_upload'
            batch_leads.append(lead)
        
        return {
            "success": True,
            "total_processed": len(results),
            "leads": results,
            "batch_id": f"batch_{len(batch_workflows) + 1}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV processing failed: {str(e)}")

@router.post("/sync-salesforce")
async def sync_salesforce_leads(access_token: str = Query(...), instance_url: str = Query(...)):
    """Sync leads from Salesforce to batch mode."""
    try:
        sf_leads = sf_service.fetch_all_leads(access_token, instance_url)
        
        # Store Salesforce leads
        for lead in sf_leads:
            lead['id'] = f"sf_{lead.get('Id', len(batch_leads))}"
            lead['source'] = 'salesforce'
            batch_leads.append(lead)
        
        return {
            "success": True,
            "total_synced": len(sf_leads),
            "leads": sf_leads[:10],  # Return first 10 for preview
            "batch_id": f"batch_sf_{len(batch_workflows) + 1}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Salesforce sync failed: {str(e)}")

@router.post("/leads/search")
async def search_leads(search_request: LeadSearchRequest):
    """Search and filter leads in batch mode."""
    try:
        filtered_leads = batch_leads.copy()
        
        # Apply filters
        if search_request.query:
            query_lower = search_request.query.lower()
            filtered_leads = [
                lead for lead in filtered_leads
                if any(
                    query_lower in str(lead.get(field, '')).lower()
                    for field in ['Name', 'Company', 'Email', 'Industry', 'Notes', 'name', 'company', 'email', 'industry', 'notes']
                )
            ]
        
        if search_request.industry:
            industry_lower = search_request.industry.lower()
            filtered_leads = [
                lead for lead in filtered_leads
                if industry_lower in str(lead.get('Industry', '')).lower() or industry_lower in str(lead.get('industry', '')).lower()
            ]
        
        if search_request.status:
            filtered_leads = [
                lead for lead in filtered_leads
                if search_request.status.lower() in str(lead.get('Status', '')).lower()
            ]
        
        if search_request.company_size:
            filtered_leads = [
                lead for lead in filtered_leads
                if search_request.company_size.lower() in str(lead.get('Employees', '')).lower()
            ]
        
        if search_request.location:
            location_lower = search_request.location.lower()
            filtered_leads = [
                lead for lead in filtered_leads
                if any(
                    location_lower in str(lead.get(field, '')).lower()
                    for field in ['Location', 'Company', 'State']
                )
            ]
        
        # Limit results
        results = filtered_leads[:search_request.limit]
        
        return {
            "success": True,
            "total_found": len(filtered_leads),
            "leads": results,
            "filters_applied": {
                "query": search_request.query,
                "industry": search_request.industry,
                "status": search_request.status,
                "company_size": search_request.company_size,
                "location": search_request.location
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/leads")
async def get_all_leads(limit: int = 100):
    """Get all leads in batch mode."""
    try:
        return {
            "success": True,
            "total_leads": len(batch_leads),
            "leads": batch_leads[:limit]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leads: {str(e)}")

@router.get("/leads/{lead_id}")
async def get_lead_details(lead_id: str):
    """Get detailed information about a specific lead."""
    try:
        lead = next((l for l in batch_leads if l.get('id') == lead_id), None)
        
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return {
            "success": True,
            "lead": lead
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get lead: {str(e)}")

@router.post("/drafts/generate")
async def generate_batch_drafts(request: BatchDraftRequest):
    """Generate drafts for multiple leads in batch."""
    try:
        generated_drafts = []
        
        for lead_id in request.lead_ids:
            lead = next((l for l in batch_leads if l.get('id') == lead_id), None)
            
            if not lead:
                continue
            
            # Create agent state for this lead
            agent_state = AgentState(
                logs=[],
                lead_id=lead_id,
                lead_data={
                    "name": lead.get('Name', 'Unknown'),
                    "company": lead.get('Company', 'Unknown Company'),
                    "industry": lead.get('Industry', 'General'),
                    "needs": lead.get('Notes', lead.get('Description', 'Standard needs'))
                },
                research_notes="Standard product information available",
                final_proposal=None,
                ai_insights=None
            )
            
            # Generate proposal using the agent
            result = await draft_proposal_node(agent_state)
            
            # Parse the proposal content
            proposal_content = result.get('final_proposal', '')
            email_draft = ""
            formal_proposal = ""
            
            if '---EMAIL_END---' in proposal_content:
                parts = proposal_content.split('---EMAIL_END---')
                email_draft = parts[0].strip()
                formal_proposal = parts[1].strip() if len(parts) > 1 else ""
            else:
                if request.draft_type == "email":
                    email_draft = proposal_content
                else:
                    formal_proposal = proposal_content
            
            # Generate AI insights
            insights = await ai_insights_service.generate_draft_insights(
                email_draft or formal_proposal,
                agent_state.get('lead_data')
            )
            
            draft_data = {
                "id": f"draft_{len(batch_drafts) + 1}",
                "lead_id": lead_id,
                "lead_name": lead.get('Name', 'Unknown'),
                "lead_company": lead.get('Company', 'Unknown'),
                "draft_type": request.draft_type,
                "email_draft": email_draft,
                "formal_proposal": formal_proposal,
                "insights": insights,
                "generated_at": insights.get('generated_at'),
                "template_type": request.template_type,
                "personalization_level": request.personalization_level
            }
            
            batch_drafts.append(draft_data)
            generated_drafts.append(draft_data)
        
        return {
            "success": True,
            "total_generated": len(generated_drafts),
            "drafts": generated_drafts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch draft generation failed: {str(e)}")

@router.get("/drafts")
async def get_batch_drafts():
    """Get all generated batch drafts."""
    try:
        return {
            "success": True,
            "total_drafts": len(batch_drafts),
            "drafts": batch_drafts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get drafts: {str(e)}")

@router.post("/workflows/create")
async def create_batch_workflow(request: BatchWorkflowRequest):
    """Create a batch workflow for lead processing."""
    try:
        workflow = {
            "id": f"workflow_{len(batch_workflows) + 1}",
            "name": request.name,
            "lead_ids": request.lead_ids,
            "steps": request.steps,
            "status": "created",
            "created_at": pd.Timestamp.now().isoformat(),
            "progress": 0,
            "completed_steps": [],
            "results": {}
        }
        
        batch_workflows.append(workflow)
        
        return {
            "success": True,
            "workflow": workflow
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow creation failed: {str(e)}")

@router.post("/workflows/{workflow_id}/start")
async def start_batch_workflow(workflow_id: str):
    """Start executing a batch workflow."""
    try:
        workflow = next((w for w in batch_workflows if w.get('id') == workflow_id), None)
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow['status'] = 'running'
        workflow['started_at'] = pd.Timestamp.now().isoformat()
        
        # Execute workflow steps (simplified for demo)
        results = {}
        for i, step in enumerate(workflow['steps']):
            step_type = step.get('type')
            
            if step_type == 'generate_drafts':
                draft_request = BatchDraftRequest(
                    lead_ids=workflow['lead_ids'],
                    draft_type=step.get('draft_type', 'email'),
                    template_type=step.get('template_type'),
                    personalization_level=step.get('personalization_level', 'medium')
                )
                
                draft_result = await generate_batch_drafts(draft_request)
                results[f'step_{i+1}'] = draft_result
                
            elif step_type == 'analyze_insights':
                # Analyze insights for all leads
                insights_summary = {}
                for lead_id in workflow['lead_ids']:
                    lead_drafts = [d for d in batch_drafts if d.get('lead_id') == lead_id]
                    if lead_drafts:
                        insights_summary[lead_id] = lead_drafts[0].get('insights', {})
                
                results[f'step_{i+1}'] = {
                    "total_analyzed": len(insights_summary),
                    "insights": insights_summary
                }
            
            workflow['completed_steps'].append(f"step_{i+1}")
            workflow['progress'] = (len(workflow['completed_steps']) / len(workflow['steps'])) * 100
        
        workflow['status'] = 'completed'
        workflow['completed_at'] = pd.Timestamp.now().isoformat()
        workflow['results'] = results
        
        return {
            "success": True,
            "workflow": workflow
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")

@router.get("/workflows")
async def get_batch_workflows():
    """Get all batch workflows."""
    try:
        return {
            "success": True,
            "total_workflows": len(batch_workflows),
            "workflows": batch_workflows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflows: {str(e)}")

@router.get("/workflows/{workflow_id}")
async def get_workflow_details(workflow_id: str):
    """Get detailed information about a specific workflow."""
    try:
        workflow = next((w for w in batch_workflows if w.get('id') == workflow_id), None)
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        return {
            "success": True,
            "workflow": workflow
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflow: {str(e)}")

@router.get("/analytics")
async def get_batch_analytics():
    """Get analytics for batch operations."""
    try:
        # Lead analytics
        industries = {}
        statuses = {}
        sources = {}
        
        for lead in batch_leads:
            industry = lead.get('Industry', 'Unknown')
            status = lead.get('Status', 'Unknown')
            source = lead.get('source', 'Unknown')
            
            industries[industry] = industries.get(industry, 0) + 1
            statuses[status] = statuses.get(status, 0) + 1
            sources[source] = sources.get(source, 0) + 1
        
        # Draft analytics
        draft_scores = []
        success_probabilities = []
        
        for draft in batch_drafts:
            insights = draft.get('insights', {})
            draft_scores.append(insights.get('overall_score', 0))
            success_probabilities.append(insights.get('success_probability', 0))
        
        analytics = {
            "leads": {
                "total": len(batch_leads),
                "by_industry": industries,
                "by_status": statuses,
                "by_source": sources
            },
            "drafts": {
                "total": len(batch_drafts),
                "average_score": sum(draft_scores) / len(draft_scores) if draft_scores else 0,
                "average_success_probability": sum(success_probabilities) / len(success_probabilities) if success_probabilities else 0
            },
            "workflows": {
                "total": len(batch_workflows),
                "completed": len([w for w in batch_workflows if w.get('status') == 'completed']),
                "running": len([w for w in batch_workflows if w.get('status') == 'running'])
            }
        }
        
        return {
            "success": True,
            "analytics": analytics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics generation failed: {str(e)}")

@router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str):
    """Delete a lead from batch mode."""
    try:
        global batch_leads
        batch_leads = [l for l in batch_leads if l.get('id') != lead_id]
        
        return {
            "success": True,
            "message": f"Lead {lead_id} deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete lead: {str(e)}")

@router.delete("/drafts/{draft_id}")
async def delete_draft(draft_id: str):
    """Delete a draft from batch mode."""
    try:
        global batch_drafts
        batch_drafts = [d for d in batch_drafts if d.get('id') != draft_id]
        
        return {
            "success": True,
            "message": f"Draft {draft_id} deleted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete draft: {str(e)}")

# Legacy endpoint for backward compatibility
@router.post("/process")
async def batch_process_leads(file: UploadFile = File(...)):
    """Legacy endpoint for CSV processing."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    try:
        results = await process_csv_batch(content)
        return {"total_processed": len(results), "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))