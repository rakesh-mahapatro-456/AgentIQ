from langgraph.graph import StateGraph, END
from app.core.agent.state import AgentState
from app.core.agent.nodes import discovery_node, research_node, draft_proposal_node

# --- NEW: Router Function ---
def should_continue(state: AgentState):
    """
    Decide whether to research or end based on discovery results.
    """
    if not state.get("lead_data"):
        return "end"
    return "continue"

workflow = StateGraph(AgentState)

workflow.add_node("discovery", discovery_node)
workflow.add_node("researcher", research_node)
workflow.add_node("writer", draft_proposal_node)

workflow.set_entry_point("discovery")

# --- UPDATE: Conditional Edge ---
workflow.add_conditional_edges(
    "discovery",
    should_continue,
    {
        "continue": "researcher",
        "end": END
    }
)

workflow.add_edge("researcher", "writer")
workflow.add_edge("writer", END)

agent_app = workflow.compile()