import os
from langchain_groq import ChatGroq
from app.core.agent.state import AgentState
from app.services.salesforce import sf_service
from app.services.supabase import get_relevant_docs
from app.services.ai_insights import ai_insights_service

# Initialize the LLM
llm = ChatGroq(
    temperature=0.1, 
    model_name="llama-3.3-70b-versatile", 
    api_key=os.getenv("GROQ_API_KEY")
)

async def discovery_node(state: AgentState):
    """Node 1: Sync Salesforce Data."""
    email = state.get("lead_email")
    ctx = state.get("sf_context", {})

    access_token = ctx.get("access_token") or os.getenv("SF_ACCESS_TOKEN")
    instance_url = ctx.get("instance_url") or os.getenv("SF_INSTANCE_URL")

    lead = None
    if access_token and instance_url:
        try:
            lead = sf_service.fetch_lead_by_email(
                access_token=access_token,
                instance_url=instance_url,
                email=email
            )
        except Exception as e:
            print(f"📡 SF Sync Error: {e}")

    # No demo fallbacks - only return real data
    if not lead:
        return {"logs": [f"❌ Lead {email} not found in Salesforce CRM."]}

    return {
        "lead_id": lead['Id'],
        "lead_data": {
            "name": lead.get('Name', 'Unknown Lead'),
            "company": lead['Company'],
            "industry": lead.get('Industry', 'General'),
            "needs": lead['Description']
        },
        "logs": [f"✅ Data Synced for {lead.get('Name', 'Unknown Lead')}."]
    }

async def research_node(state: AgentState):
    """Node 2: Search Knowledge Base using Local Embeddings."""
    lead_data = state.get('lead_data', {})
    needs = lead_data.get('needs') or "General product info"
    industry = lead_data.get('industry') or "General"
    
    search_query = f"Industry: {industry}. Customer needs: {needs}"
    
    # This calls your Supabase vector search
    results = await get_relevant_docs(search_query)
    context = "\n".join([r['content'] for r in results])
    
    return {
        "logs": ["🔍 Local embedding generated. Searching vector database..."],
        "research_notes": context
    }

async def draft_proposal_node(state: AgentState):
    """Node 3: Generate the Final Proposal using Llama 3.3 with AI Insights."""
    lead = state.get("lead_data")
    context = state.get("research_notes") or "Standard AgentIQ services."

    system_msg = (
        "You are a Senior Sales Engineer at AgentIQ. "
        "Generate two distinct components:\n"
        "1. EMAIL DRAFT: A personalized 3-sentence outreach email.\n"
        "2. SALES PROPOSAL: A formal 3-paragraph business proposal for a PDF attachment.\n\n"
        "CRITICAL: Separate these two with the exact string '---EMAIL_END---'. "
        "Do not include the email text inside the formal proposal section."
    )
    
    human_msg = f"""
    Draft for {lead['name']} at {lead['company']}.
    Industry: {lead['industry']}
    Needs: {lead['needs']}
    Product Context: {context}
    """

    # Invoke LLM
    response = await llm.ainvoke([
        ("system", system_msg),
        ("human", human_msg)
    ])
    
    proposal_content = response.content
    
    # --- DEBUG PRINT FOR TERMINAL ---
    print("\n" + "🚀" * 15)
    print("📬 AGENT GENERATED OUTPUT (RAW):")
    print("-" * 30)
    print(proposal_content)
    print("-" * 30)
    print("🚀" * 15 + "\n")
    # --------------------------------
    
    # Generate AI insights for the draft
    print("🧠 Generating AI insights for the proposal draft...")
    try:
        insights = await ai_insights_service.generate_draft_insights(
            proposal_content, 
            lead
        )
        print(f"✅ AI Insights generated - Overall Score: {insights.get('overall_score', 'N/A')}/10")
        
        # Add insights to logs
        insight_logs = [
            f"🧠 AI Analysis Complete:",
            f"   📊 Overall Score: {insights.get('overall_score', 'N/A')}/10",
            f"   🎯 Success Probability: {insights.get('success_probability', 'N/A')}%",
            f"   💪 Key Strengths: {', '.join(insights.get('strengths', [])[:2])}",
            f"   🔧 Suggested Improvements: {len(insights.get('improvements', []))} areas identified"
        ]
        
    except Exception as e:
        print(f"❌ Error generating AI insights: {e}")
        insights = {"error": "Failed to generate insights", "overall_score": 5}
        insight_logs = ["❌ AI insights generation failed"]
    
    return {
        "final_proposal": proposal_content,
        "ai_insights": insights,
        "logs": [
            "✅ Email outreach draft created.",
            "✅ Formal sales proposal generated for PDF.",
            "✅ AI-powered analysis completed."
        ] + insight_logs
    }

async def scoring_agent_node(state: AgentState):
    """Node 4: Score the final proposal based on personalization and quality."""
    lead = state.get("lead_data", {})
    proposal = state.get("final_proposal", "")
    
    if not proposal:
        return {
            "logs": ["❌ No proposal content to score."],
            "quality_score": 0,
            "success_probability": 0
        }
    
    scoring_prompt = f"""
    You are an expert sales proposal evaluator. Rate the following proposal on a scale of 1-100.
    
    Lead Information:
    - Name: {lead.get('name', 'Unknown')}
    - Company: {lead.get('company', 'Unknown')}
    - Industry: {lead.get('industry', 'Unknown')}
    - Needs: {lead.get('needs', 'Not specified')}
    
    Proposal Content:
    {proposal[:2000]}  # First 2000 chars for context
    
    Evaluate based on:
    1. Personalization (40%): How well is it tailored to the lead's company/industry/needs?
    2. Professionalism (30%): Is the tone appropriate and well-structured?
    3. Value Proposition (20%): Does it clearly communicate value?
    4. Call to Action (10%): Is there a clear next step?
    
    Return your response in this exact format:
    SCORE: <1-100>
    SUCCESS_PROBABILITY: <1-100%>
    FEEDBACK: <brief feedback on strengths and weaknesses>
    """
    
    try:
        response = await llm.ainvoke([("human", scoring_prompt)])
        content = response.content
        
        # Parse the response
        import re
        score_match = re.search(r'SCORE:\s*(\d+)', content)
        success_match = re.search(r'SUCCESS_PROBABILITY:\s*(\d+)', content)
        feedback_match = re.search(r'FEEDBACK:\s*(.+)', content, re.DOTALL)
        
        quality_score = int(score_match.group(1)) if score_match else 75
        success_probability = int(success_match.group(1)) if success_match else 50
        feedback = feedback_match.group(1).strip() if feedback_match else "No feedback provided"
        
        print(f"🎯 Scoring Agent Results:")
        print(f"   Quality Score: {quality_score}/100")
        print(f"   Success Probability: {success_probability}%")
        print(f"   Feedback: {feedback[:100]}...")
        
        return {
            "logs": [
                f"🎯 Proposal Quality Score: {quality_score}/100",
                f"📈 Predicted Success Rate: {success_probability}%",
                f"💬 Scoring Feedback: {feedback[:100]}..."
            ],
            "quality_score": quality_score,
            "success_probability": success_probability,
            "scoring_feedback": feedback
        }
        
    except Exception as e:
        print(f"❌ Scoring agent error: {e}")
        return {
            "logs": [f"❌ Scoring agent failed: {str(e)}"],
            "quality_score": 50,
            "success_probability": 50,
            "scoring_feedback": "Scoring failed"
        }