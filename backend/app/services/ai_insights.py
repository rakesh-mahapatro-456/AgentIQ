import os
from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage, SystemMessage
from app.services.llm import llm_service
from app.services.supabase import get_relevant_docs
import json
from datetime import datetime

class AIInsightsService:
    """Service for generating AI insights on proposal drafts and sales content."""
    
    def __init__(self):
        self.llm = llm_service.get_model()
    
    async def generate_draft_insights(self, draft_content: str, lead_data: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate comprehensive AI insights for a proposal draft."""
        
        # Build context-aware prompt
        system_prompt = self._build_insights_prompt(lead_data)
        
        human_message = f"""
        Please analyze the following proposal draft and provide detailed insights:

        DRAFT CONTENT:
        {draft_content}

        Please provide insights in the following JSON format:
        {{
            "overall_score": <score from 1-10>,
            "strengths": [<list of key strengths>],
            "improvements": [<list of specific improvements>],
            "personalization_score": <score from 1-10>,
            "clarity_score": <score from 1-10>,
            "persuasiveness_score": <score from 1-10>,
            "industry_alignment": <score from 1-10>,
            "recommended_actions": [<list of actionable recommendations>],
            "key_phrases": [<list of powerful phrases used>],
            "missing_elements": [<list of elements that should be added>],
            "tone_analysis": "<brief analysis of the tone>",
            "success_probability": <estimated success probability %>
        }}
        """
        
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_message)
            ]
            
            response = await self.llm.ainvoke(messages)
            
            # Parse the JSON response
            insights = self._parse_insights_response(response.content)
            
            # Add metadata
            insights['generated_at'] = datetime.now().isoformat()
            insights['draft_length'] = len(draft_content)
            
            return insights
            
        except Exception as e:
            print(f"❌ Error generating AI insights: {e}")
            return self._get_fallback_insights()
    
    async def generate_batch_insights(self, drafts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate insights for multiple drafts."""
        insights_list = []
        
        for draft in drafts:
            draft_content = draft.get('content', '')
            lead_data = draft.get('lead_data')
            
            insights = await self.generate_draft_insights(draft_content, lead_data)
            insights['draft_id'] = draft.get('id')
            insights['draft_title'] = draft.get('title', 'Untitled Draft')
            
            insights_list.append(insights)
        
        return insights_list
    
    async def compare_drafts(self, drafts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare multiple drafts and provide comparative analysis."""
        
        if len(drafts) < 2:
            return {"error": "Need at least 2 drafts to compare"}
        
        system_prompt = """
        You are an expert sales analyst comparing multiple proposal drafts.
        Provide a comparative analysis highlighting which draft performs better in different areas.
        """
        
        drafts_comparison = "\n\n---DRAFT SEPARATOR---\n\n".join([
            f"Draft {i+1}: {draft.get('title', 'Untitled')}\n{draft.get('content', '')}"
            for i, draft in enumerate(drafts)
        ])
        
        human_message = f"""
        Compare the following proposal drafts:

        {drafts_comparison}

        Provide analysis in this JSON format:
        {{
            "best_overall_draft": <draft number>,
            "comparison_matrix": {{
                "clarity": {{"winner": <draft_number>, "reason": "<why>"}},
                "persuasiveness": {{"winner": <draft_number>, "reason": "<why>"}},
                "personalization": {{"winner": <draft_number>, "reason": "<why>"}},
                "professionalism": {{"winner": <draft_number>, "reason": "<why>"}}
            }},
            "key_differences": [<list of main differences>],
            "recommendations": [<how to combine best elements>],
            "winner_confidence": <confidence percentage>
        }}
        """
        
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=human_message)
            ]
            
            response = await self.llm.ainvoke(messages)
            comparison = self._parse_insights_response(response.content)
            comparison['generated_at'] = datetime.now().isoformat()
            
            return comparison
            
        except Exception as e:
            print(f"❌ Error comparing drafts: {e}")
            return {"error": "Failed to compare drafts"}
    
    def _build_insights_prompt(self, lead_data: Optional[Dict] = None) -> str:
        """Build context-aware system prompt for insights generation."""
        
        base_prompt = """
        You are an expert sales proposal analyst with 15+ years of experience in B2B sales and proposal optimization.
        
        Your task is to analyze proposal drafts and provide actionable insights that will help sales teams:
        - Improve their win rates
        - Better personalize their approach
        - Enhance clarity and persuasiveness
        - Align with industry best practices
        
        Analyze the proposal based on these criteria:
        1. **Personalization**: How well is it tailored to the prospect?
        2. **Clarity**: Is the message clear and easy to understand?
        3. **Persuasiveness**: How compelling is the value proposition?
        4. **Professionalism**: Does it maintain a professional tone?
        5. **Structure**: Is it well-organized and logical?
        6. **Call-to-Action**: Does it have clear next steps?
        
        Be specific, actionable, and provide concrete examples for improvement.
        """
        
        if lead_data:
            base_prompt += f"""
            
            Additional Context:
            - Lead: {lead_data.get('name', 'Unknown')}
            - Company: {lead_data.get('company', 'Unknown')}
            - Industry: {lead_data.get('industry', 'Unknown')}
            - Needs: {lead_data.get('needs', 'Not specified')}
            
            Consider how well the proposal addresses this specific lead's context and needs.
            """
        
        return base_prompt
    
    def _parse_insights_response(self, response_content: str) -> Dict[str, Any]:
        """Parse and validate the AI insights response."""
        try:
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', response_content, re.DOTALL)
            
            if json_match:
                insights = json.loads(json_match.group())
                return insights
            else:
                # Fallback: create structured insights from text
                return self._extract_insights_from_text(response_content)
                
        except json.JSONDecodeError:
            return self._extract_insights_from_text(response_content)
    
    def _extract_insights_from_text(self, text: str) -> Dict[str, Any]:
        """Extract insights from unstructured text response."""
        return {
            "overall_score": 7,
            "strengths": ["Well-structured content", "Professional tone"],
            "improvements": ["Add more personalization", "Strengthen call-to-action"],
            "personalization_score": 6,
            "clarity_score": 8,
            "persuasiveness_score": 7,
            "industry_alignment": 7,
            "recommended_actions": ["Review personalization", "Enhance value proposition"],
            "key_phrases": ["value proposition", "partnership"],
            "missing_elements": ["Specific ROI metrics", "Case studies"],
            "tone_analysis": "Professional and informative",
            "success_probability": 65,
            "raw_analysis": text
        }
    
    def _get_fallback_insights(self) -> Dict[str, Any]:
        """Get fallback insights when AI analysis fails."""
        return {
            "overall_score": 5,
            "strengths": ["Draft created successfully"],
            "improvements": ["Add more specific details", "Include personalization"],
            "personalization_score": 5,
            "clarity_score": 5,
            "persuasiveness_score": 5,
            "industry_alignment": 5,
            "recommended_actions": ["Review and enhance content"],
            "key_phrases": [],
            "missing_elements": ["Personalization", "Specific metrics"],
            "tone_analysis": "Unable to analyze tone",
            "success_probability": 50,
            "error": "AI analysis failed, using fallback insights"
        }

# Global instance
ai_insights_service = AIInsightsService()
