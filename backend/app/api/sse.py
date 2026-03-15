import asyncio
import json
from fastapi import Request
# Ensure this matches the name in your graph.py (you named it agent_app there)
from app.core.agent.graph import agent_app 

async def stream_agent_updates(request: Request, sf_data: dict):
    """
    Streams the LangGraph execution steps to the frontend via SSE.
    sf_data contains: access_token, instance_url, and lead_email.
    """
    # Initial state must match your AgentState definition in state.py
    initial_state = {
        "sf_context": {
            "access_token": sf_data.get("access_token"),
            "instance_url": sf_data.get("instance_url")
        },
        "lead_email": sf_data.get("lead_email"),
        "logs": ["🚀 Initializing AgentIQ..."],
        "lead_data": {},
        "research_notes": "",
        "final_proposal": ""
    }

    try:
        # We use astream to get updates after every node execution
        async for event in agent_app.astream(initial_state):
            if await request.is_disconnected():
                print("Client disconnected from SSE stream.")
                break
                
            # 'event' will contain the output of each node (e.g., {'discovery': {...}})
            yield {
                "event": "update",
                "data": json.dumps(event)
            }
            
    except Exception as e:
        print(f"Streaming Error: {e}")
        yield {
            "event": "error",
            "data": json.dumps({"detail": str(e)})
        }