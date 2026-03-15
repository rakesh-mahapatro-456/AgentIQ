import pandas as pd
import io
import asyncio
from app.core.agent.graph import agent_app

async def process_csv_batch(file_content: bytes):
    try:
        # Read the CSV from memory
        df = pd.read_csv(io.BytesIO(file_content))
        
        # Check for email column (case insensitive)
        email_col = None
        for col in df.columns:
            if col.lower() == 'email':
                email_col = col
                break
        
        if not email_col:
            return [{"error": "CSV must have an 'email' column"}]

        results = []
        
        # Loop through each lead in the CSV
        for index, row in df.iterrows():
            email = row.get(email_col, 'unknown')
            name = row.get('Name', row.get('name', 'Unknown'))
            company = row.get('Company', row.get('company', 'Unknown'))
            
            # Create a comprehensive lead record
            lead_record = {
                "email": email,
                "name": name,
                "company": company,
                "industry": row.get('Industry', row.get('industry', 'Unknown')),
                "phone": row.get('Phone', row.get('phone', '')),
                "website": row.get('Website', row.get('website', '')),
                "employees": row.get('Employees', row.get('employees', '')),
                "revenue": row.get('Revenue', row.get('revenue', '')),
                "location": row.get('Location', row.get('location', '')),
                "status": row.get('Status', row.get('status', 'Lead')),
                "notes": row.get('Notes', row.get('notes', ''))
            }
            
            try:
                # Try to run the agent for this specific lead
                initial_state = {
                    "lead_email": email,
                    "sf_context": {"access_token": None, "instance_url": None},
                    "logs": []
                }
                
                # Run the agent for this specific lead
                # We use .ainvoke for batch (no streaming needed for background processing)
                final_state = await agent_app.ainvoke(initial_state)
                
                lead_record.update({
                    "status": "completed",
                    "proposal_snippet": final_state.get("final_proposal", "")[:100] + "...",
                    "ai_insights": final_state.get("ai_insights", {})
                })
                
            except Exception as agent_error:
                print(f"Agent error for {email}: {agent_error}")
                # Fallback if agent fails
                lead_record.update({
                    "status": "error",
                    "error": "Agent processing failed"
                })
            
            results.append(lead_record)
                
        return results
        
    except Exception as e:
        print(f"Batch processing error: {e}")
        # Return a simple error result instead of crashing
        return [{"error": f"Batch processing failed: {str(e)}"}]