from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from app.services.salesforce import sf_service
from app.services.llm import llm_service
from langchain_core.messages import HumanMessage, SystemMessage

router = APIRouter()

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []
    lead_id: Optional[str] = None
    context: Optional[str] = None
    auth_token: Optional[str] = None
    instance_url: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    conversation_history: List[ChatMessage]
    sources: List[str] = []

@router.post("/chat")
async def chat_with_agent(request: ChatRequest, access_token: Optional[str] = Header(None), instance_url: Optional[str] = Header(None)):
    """Chat with AI agent that has access to CRM data and product information."""
    
    try:
        # Use auth tokens from request or headers
        token = request.auth_token or access_token
        url = request.instance_url or instance_url
        
        # Build context from CRM data and knowledge base
        context_data = await build_context(request.lead_id, request.context, token, url)
        
        # Build conversation history for context
        history_context = ""
        if request.conversation_history:
            for msg in request.conversation_history[-5:]:  # Last 5 messages for context
                history_context += f"{msg.role}: {msg.content}\n"
        
        # Create a simple rule-based response for now (can be enhanced with real AI later)
        ai_response = await generate_ai_response(request.message, context_data, history_context, token, url)
        
        # Update conversation history
        updated_history = request.conversation_history.copy()
        updated_history.append(ChatMessage(role="user", content=request.message))
        updated_history.append(ChatMessage(role="assistant", content=ai_response))
        
        # Extract sources
        sources = ["CRM Database", "Product Documentation", "Knowledge Base"]
        if token and url:
            sources = ["Salesforce CRM", "Product Documentation", "Knowledge Base"]
        
        return ChatResponse(
            response=ai_response,
            conversation_history=updated_history,
            sources=sources
        )
        
    except Exception as e:
        print(f"Chat error: {e}")
        # Return a fallback response instead of throwing an error
        fallback_response = "I'm here to help with your sales questions. Could you please try asking that question again in a different way?"
        
        updated_history = request.conversation_history.copy()
        updated_history.append(ChatMessage(role="user", content=request.message))
        updated_history.append(ChatMessage(role="assistant", content=fallback_response))
        
        return ChatResponse(
            response=fallback_response,
            conversation_history=updated_history,
            sources=["System"]
        )

async def generate_ai_response(message: str, context_data: str, history: str, auth_token: Optional[str] = None, instance_url: Optional[str] = None) -> str:
    """Generate AI-powered response using Groq LLM with real-time Salesforce data."""
    
    print(f"🤖 AI Agent processing message: '{message}'")
    print(f"🔑 Has auth: {bool(auth_token and instance_url)}")
    
    # Build dynamic system prompt
    system_prompt = await build_dynamic_system_prompt(auth_token, instance_url, context_data)
    
    # Build conversation context
    conversation_context = f"Previous conversation:\n{history}\n\n" if history else ""
    conversation_context += f"Context data: {context_data}\n\n"
    conversation_context += f"User message: {message}"
    
    try:
        # Get AI model
        llm = llm_service.get_model()
        
        # Create messages for the LLM
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=conversation_context)
        ]
        
        # Generate response
        response = await llm.ainvoke(messages)
        ai_response = response.content
        
        print(f"✅ AI Response generated: {ai_response[:100]}...")
        return ai_response
        
    except Exception as e:
        print(f"❌ Error generating AI response: {e}")
        # Fallback to rule-based response if AI fails
        return generate_simple_response(message, context_data, history, auth_token, instance_url)

async def build_dynamic_system_prompt(auth_token: Optional[str], instance_url: Optional[str], context_data: str) -> str:
    """Build a dynamic system prompt with real-time data."""
    
    base_prompt = """You are an AI sales assistant for AgentIQ, an AI-powered sales intelligence platform. 

Your role is to help sales teams with:
- Lead analysis and qualification
- Sales strategy and approach recommendations  
- Product information about AgentIQ
- CRM data insights from Salesforce
- Personalized proposal generation

Key AgentIQ Details:
- AI lead analysis with 87% accuracy
- Automated proposal generation
- CRM integration (Salesforce, HubSpot, etc.)
- Real-time data synchronization
- SOC 2 compliance and enterprise security
- Pricing: Starter ($99/mo), Professional ($299/mo), Enterprise (custom)
- Typical ROI: 25-40% increase in qualified leads, 15-20 hours/week time savings

Communication Style:
- Be professional but conversational
- Use data-driven insights
- Provide actionable recommendations
- Be helpful and specific
- Use emojis sparingly for emphasis
"""
    
    # Add real-time Salesforce context if available
    if auth_token and instance_url:
        try:
            leads_data = fetch_salesforce_leads(auth_token, instance_url)
            if leads_data and len(leads_data) > 0:
                base_prompt += f"\n\nCurrent Salesforce Context:\n"
                base_prompt += f"- You have access to {len(leads_data)} leads from their CRM\n"
                
                # Add a few sample leads for context
                for i, lead in enumerate(leads_data[:3]):
                    name = lead.get('Name', 'Unknown')
                    company = lead.get('Company', 'Unknown Company')
                    status = lead.get('Status', 'Unknown Status')
                    base_prompt += f"- {name} from {company} (Status: {status})\n"
                    
        except Exception as e:
            print(f"Error fetching Salesforce context for prompt: {e}")
    
    base_prompt += "\n\nProvide specific, actionable advice based on the available data. If you don't have enough information, ask clarifying questions."
    
    return base_prompt

def generate_simple_response(message: str, context_data: str, history: str, auth_token: Optional[str] = None, instance_url: Optional[str] = None) -> str:
    """Generate a simple rule-based response for demonstration."""
    message_lower = message.lower()
    
    print(f"🤖 AI Agent processing message: '{message}'")
    print(f"🔑 Has auth: {bool(auth_token and instance_url)}")
    
    # Check if user is talking about a specific lead from context
    if auth_token and instance_url:
        # Extract lead names from the conversation history or context
        mentioned_lead = extract_mentioned_lead(message, history, context_data)
        
        if mentioned_lead:
            print(f"🎯 Found mentioned lead: {mentioned_lead}")
            return generate_lead_specific_response(message, mentioned_lead, auth_token, instance_url)
    
    # Lead-related questions with Salesforce data
    elif any(keyword in message_lower for keyword in ["leads", "lead", "crm", "salesforce", "my leads", "your leads", "list leads"]):
        print(f"📋 Detected lead-related question")
        if auth_token and instance_url:
            try:
                print(f"🔍 Fetching Salesforce leads...")
                # Fetch real leads from Salesforce
                leads_data = fetch_salesforce_leads(auth_token, instance_url)
                print(f"📊 Got leads data: {leads_data}")
                if leads_data and len(leads_data) > 0:
                    print(f"✅ Formatting response for {len(leads_data)} leads")
                    return format_leads_response(leads_data)
                else:
                    print(f"❌ No leads found")
                    return "I don't see any leads in your Salesforce CRM. Would you like me to help you fetch leads or check your connection?"
            except Exception as e:
                print(f"❌ Error fetching Salesforce leads: {e}")
                return "I'm having trouble accessing your Salesforce data right now. Please check your connection and try again."
        else:
            print(f"❌ No auth tokens available")
            return "I can help you with your Salesforce leads! To access your real lead data, please make sure you're authenticated with Salesforce. Then I can show you detailed information about your current leads, their status, and provide personalized sales strategies."
    
    # Product-related questions
    elif any(keyword in message_lower for keyword in ["product", "feature", "pricing", "agentiq"]):
        if "pricing" in message_lower:
            return "AgentIQ offers three pricing tiers: Starter ($99/month) for up to 100 leads, Professional ($299/month) for up to 1,000 leads, and Enterprise with custom pricing for unlimited leads. Each tier includes our core AI-powered lead analysis and proposal generation features."
        elif "feature" in message_lower:
            return "AgentIQ's key features include AI-powered lead scoring with 87% accuracy, automated proposal generation, seamless CRM integration with Salesforce and HubSpot, and real-time data synchronization. Our platform typically saves sales reps 15-20 hours per week."
        else:
            return "AgentIQ is an AI-powered sales intelligence platform that helps sales teams improve lead qualification and proposal generation. Our customers typically see a 25-40% increase in qualified leads and significant time savings in their sales process."
    
    # Sales strategy questions
    elif any(keyword in message_lower for keyword in ["approach", "strategy", "how to", "sales"]):
        if "lead" in message_lower:
            return "For effective lead engagement, I recommend researching their company and industry first, personalizing your outreach based on their specific needs, and focusing on how AgentIQ can solve their particular pain points. Would you like me to help you craft a personalized approach for a specific lead?"
        else:
            return "A successful sales strategy involves understanding your prospect's needs, demonstrating clear value, and building trust through personalized communication. AgentIQ can help by providing AI-driven insights and automated proposal generation tailored to each prospect."
    
    # ROI and value questions
    elif any(keyword in message_lower for keyword in ["roi", "value", "benefit", "worth"]):
        return "AgentIQ customers typically achieve a 20-35% increase in sales revenue and a 30-50% reduction in customer acquisition costs. The platform saves 15-20 hours per week per sales rep through automation and AI-powered insights. Most customers see ROI within the first 3 months."
    
    # Technical questions
    elif any(keyword in message_lower for keyword in ["integration", "crm", "security", "data"]):
        if "security" in message_lower:
            return "AgentIQ is SOC 2 compliant with AES-256 encryption for all data. We undergo quarterly security audits and are GDPR ready. Your data is secure and we maintain 99.9% uptime with our enterprise-grade infrastructure."
        elif "integration" in message_lower:
            return "AgentIQ integrates seamlessly with Salesforce Sales Cloud, HubSpot, Microsoft Dynamics 365, Zoho CRM, and Pipedrive. We also offer custom API integration for other systems. Real-time data sync ensures your information is always up-to-date across platforms."
        else:
            return "AgentIQ offers comprehensive CRM integration and robust data security. We support all major CRM platforms and ensure your data is protected with enterprise-grade security measures."
    
    # Default response
    else:
        return "I'm here to help you with AgentIQ and sales-related questions. I can provide information about our products, pricing, integration capabilities, sales strategies, and access your Salesforce leads data. What specific aspect would you like to know more about?"

def extract_mentioned_lead(message: str, history: str, context_data: str) -> Optional[str]:
    """Extract lead name mentioned in conversation."""
    message_lower = message.lower()
    
    # Check if message contains an email address
    import re
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, message)
    
    if emails:
        # If email found, try to fetch lead data to get the name
        email = emails[0]
        # This will be handled in generate_lead_specific_response
        return email
    
    # Extract lead names from the context/history (real leads only)
    all_text = (history + " " + context_data).lower()
    
    # Look for patterns that might be lead names
    # This will extract names from real CRM data only
    
    # Find potential lead names from context (format: "Name - Company")
    lead_pattern = r'(\w+\s+\w+)\s*-\s*\w+'
    potential_leads = re.findall(lead_pattern, all_text)
    
    for lead_name in potential_leads:
        if lead_name.lower() in message_lower:
            return lead_name.title()
    
    # Also check for single word names that might be mentioned
    words = message_lower.split()
    for word in words:
        if word.capitalize() in all_text and len(word) > 3:  # Only consider longer words as names
            return word.title()
    
    return None

def generate_lead_specific_response(message: str, lead_name: str, auth_token: str, instance_url: str) -> str:
    """Generate response specific to a mentioned lead."""
    message_lower = message.lower()
    
    # Fetch lead details
    leads_data = fetch_salesforce_leads(auth_token, instance_url)
    lead_info = None
    
    if leads_data:
        for lead in leads_data:
            if lead_name.lower() in lead.get('Name', '').lower():
                lead_info = lead
                break
    
    if not lead_info:
        return f"I don't have specific information about {lead_name} in your current leads. Let me fetch your latest lead data to help you better."
    
    # Generate contextual response based on lead info
    company = lead_info.get('Company', 'Unknown Company')
    title = lead_info.get('Title', 'Unknown Title')
    status = lead_info.get('Status', 'Unknown Status')
    industry = lead_info.get('Industry', 'Unknown Industry')
    
    response_parts = [f"🎯 **Regarding {lead_name} from {company}:**\n"]
    response_parts.append(f"📊 **Current Status:** {status}")
    response_parts.append(f"🏢 **Role:** {title}")
    if industry != 'Unknown Industry':
        response_parts.append(f"🏭 **Industry:** {industry}")
    
    # Analyze the user's intent about this lead
    if any(keyword in message_lower for keyword in ["buying", "interested", "likely", "prospect", "hot"]):
        response_parts.append(f"\n💡 **Sales Strategy for {lead_name}:**")
        response_parts.append(f"• Since you sense buying interest, focus on demonstrating ROI and value")
        response_parts.append(f"• Highlight how AgentIQ can solve {company}'s specific pain points")
        response_parts.append(f"• Suggest a personalized demo tailored to their {title} role")
        response_parts.append(f"• Reference similar companies in the {industry} sector that have succeeded with AgentIQ")
        
        if status == "Open - Not Contacted":
            response_parts.append(f"\n⚡ **Next Steps:**")
            response_parts.append(f"• Priority outreach - this lead shows buying signals")
            response_parts.append(f"• Prepare industry-specific case studies for {industry}")
            response_parts.append(f"• Schedule demo within 48 hours to maintain momentum")
    
    elif any(keyword in message_lower for keyword in ["approach", "strategy", "how", "contact"]):
        response_parts.append(f"\n💡 **Recommended Approach for {lead_name}:**")
        response_parts.append(f"• Research {company} recent news and challenges")
        response_parts.append(f"• Personalize outreach around their {title} responsibilities")
        response_parts.append(f"• Focus on efficiency and ROI given their executive role")
        response_parts.append(f"• Use data-driven insights relevant to {industry} sector")
    
    else:
        response_parts.append(f"\n💡 **How can I help you with {lead_name}?**")
        response_parts.append(f"• Want a personalized sales strategy?")
        response_parts.append(f"• Need help crafting outreach messaging?")
        response_parts.append(f"• Should we prioritize this lead over others?")
        response_parts.append(f"• Want to discuss potential objections and responses?")
    
    return "\n".join(response_parts)

def fetch_salesforce_leads(auth_token: str, instance_url: str) -> Optional[List[dict]]:
    """Fetch leads from Salesforce CRM (checks both Leads and Contacts)."""
    try:
        sf = sf_service.get_client(auth_token, instance_url)
        
        # First try to query leads
        lead_query = """
        SELECT Id, Name, Company, Title, Email, Phone, Industry, Status, LastActivityDate, AnnualRevenue 
        FROM Lead 
        ORDER BY CreatedDate DESC 
        LIMIT 10
        """
        
        lead_result = sf.query(lead_query)
        
        if lead_result['totalSize'] > 0:
            return lead_result['records']
        
        # If no leads, check for contacts
        contact_query = """
        SELECT Id, Name, Title, Email, Phone, Account.Name, Account.Industry
        FROM Contact 
        ORDER BY CreatedDate DESC 
        LIMIT 10
        """
        
        contact_result = sf.query(contact_query)
        
        if contact_result['totalSize'] > 0:
            # Convert contacts to lead-like format
            contacts = []
            for contact in contact_result['records']:
                contacts.append({
                    'Id': contact['Id'],
                    'Name': contact['Name'],
                    'Company': contact.get('Account', {}).get('Name', 'Unknown Account'),
                    'Title': contact.get('Title', ''),
                    'Email': contact.get('Email', ''),
                    'Phone': contact.get('Phone', ''),
                    'Industry': contact.get('Account', {}).get('Industry', 'Unknown'),
                    'Status': 'Contact - Active'
                })
            return contacts
        
        return []
        
    except Exception as e:
        print(f"Error fetching Salesforce leads: {e}")
        return None

def format_leads_response(leads: List[dict]) -> str:
    """Format leads data for user-friendly response."""
    if not leads:
        return "I don't see any leads in your Salesforce CRM at the moment."
    
    response_parts = [
        f"I found {len(leads)} leads in your Salesforce CRM:\n"
    ]
    
    for i, lead in enumerate(leads[:5], 1):  # Show top 5 leads
        name = lead.get('Name', 'Unknown')
        company = lead.get('Company', 'Unknown Company')
        title = lead.get('Title', 'Unknown Title')
        email = lead.get('Email', 'No email')
        status = lead.get('Status', 'No status')
        phone = lead.get('Phone', 'No phone')
        industry = lead.get('Industry', 'Unknown industry')
        
        response_parts.append(f"📊 **Lead #{i}: {name}**")
        response_parts.append(f"   🏢 {title} at {company}")
        if industry != 'Unknown industry':
            response_parts.append(f"   🏭 Industry: {industry}")
        response_parts.append(f"   📧 Email: {email}")
        if phone != 'No phone':
            response_parts.append(f"   📞 Phone: {phone}")
        response_parts.append(f"   📈 Status: {status}")
        response_parts.append("")
    
    if len(leads) > 5:
        response_parts.append(f"📋 ... and {len(leads) - 5} more leads")
        response_parts.append("")
    
    response_parts.append("💡 Would you like me to:")
    response_parts.append("   • Provide specific sales strategies for any of these leads?")
    response_parts.append("   • Help you prioritize them based on their potential?")
    response_parts.append("   • Suggest the best approach for each lead's industry?")
    
    return "\n".join(response_parts)

async def build_context(lead_id: Optional[str], custom_context: Optional[str], auth_token: Optional[str] = None, instance_url: Optional[str] = None) -> str:
    """Build context from CRM data and knowledge base."""
    context_parts = []
    
    # Add custom context if provided
    if custom_context:
        context_parts.append(f"ADDITIONAL CONTEXT: {custom_context}")
    
    # Add lead-specific CRM data if lead_id provided
    if lead_id:
        context_parts.append(f"CURRENT LEAD ID: {lead_id}")
        context_parts.append("LEAD DATA: Available in Salesforce CRM system")
    
    # Add product information
    context_parts.append("""
PRODUCT KNOWLEDGE:
AgentIQ is an AI-powered sales intelligence platform with the following key features:
- AI lead analysis with 87% accuracy
- Automated proposal generation
- CRM integration (Salesforce, HubSpot, etc.)
- Real-time data synchronization
- SOC 2 compliance and enterprise security
- Pricing: Starter ($99/mo), Professional ($299/mo), Enterprise (custom)
- Typical ROI: 25-40% increase in qualified leads, 15-20 hours/week time savings
""")
    
    return "\n".join(context_parts)

@router.get("/context/{lead_id}")
async def get_lead_context(lead_id: str):
    """Get contextual information for a specific lead."""
    try:
        context = await build_context(lead_id, None)
        return {"context": context, "lead_id": lead_id}
    except Exception as e:
        return {"context": f"Context available for lead {lead_id}", "lead_id": lead_id}

@router.post("/clear-history")
async def clear_chat_history():
    """Clear chat history (for privacy/session reset)."""
    return {"message": "Chat history cleared successfully"}
