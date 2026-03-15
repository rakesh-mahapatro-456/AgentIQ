from typing import TypedDict, Annotated, List, Optional
import operator

class AgentState(TypedDict):
    # This stores the SF tokens from the login
    sf_context: dict 
    
    # Input data
    lead_email: str
    
    # Processed data
    lead_id: Optional[str]
    lead_data: Optional[dict]
    research_notes: Optional[str]
    final_proposal: Optional[str]
    
    # Logs (Annotated list allows nodes to ADD to logs rather than overwrite them)
    logs: Annotated[List[str], operator.add]