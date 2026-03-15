from typing import TypedDict, Annotated, List, Optional, Any
import operator

class AgentState(TypedDict):
    """Internal memory of the AgentIQ."""
    # Annotate with operator.add to append logs/thoughts as they happen
    logs: Annotated[List[str], operator.add]
    lead_id: str
    lead_data: Optional[dict[str, Any]]
    research_notes: Optional[str]
    final_proposal: Optional[str]
    ai_insights: Optional[dict[str, Any]]