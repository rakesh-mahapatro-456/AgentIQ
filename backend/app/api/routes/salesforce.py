from fastapi import APIRouter, Header, HTTPException, Query
from fastapi.requests import Request
from app.services.salesforce import sf_service
from typing import Optional
import os

router = APIRouter()

@router.get("/user")
async def get_user_info(
    access_token: Optional[str] = Query(None),
    instance_url: Optional[str] = Query(None)
):
    """Fetches current user information from Salesforce."""
    print(f"Received request with token: {access_token[:20] if access_token else 'None'}...")
    print(f"Instance URL: {instance_url}")
    
    # Also try headers as fallback
    if not access_token:
        access_token = os.getenv("SF_ACCESS_TOKEN")
    if not instance_url:
        instance_url = os.getenv("SF_INSTANCE_URL")
    
    if not access_token or not instance_url:
        print("Missing token or instance URL")
        return {
            "user": {
                "Id": "DEMO_USER_ID",
                "Name": "Demo User",
                "Email": "demo@agentiq.com",
                "Username": "demo@agentiq.com",
                "debug": "Missing credentials"
            }
        }
    
    try:
        print(f"Attempting to connect to Salesforce at {instance_url}")
        sf = sf_service.get_client(access_token, instance_url)
        print("Salesforce client created successfully")
        
        # Test connection with a simple query first
        test_result = sf.query("SELECT COUNT() FROM User")
        print(f"Test query result: {test_result}")
        
        # Try to get current user - use a more specific query
        user_result = sf.query("SELECT Id, Name, Email, Username FROM User WHERE IsActive = true ORDER BY LastLoginDate DESC LIMIT 1")
        
        if user_result['totalSize'] > 0:
            user_data = user_result['records'][0]
            print(f"Found user: {user_data.get('Name')}")
            return {"user": user_data}
        else:
            print("No active users found")
            return {
                "user": {
                    "Id": "DEMO_USER_ID",
                    "Name": "Demo User",
                    "Email": "demo@agentiq.com",
                    "Username": "demo@agentiq.com",
                    "debug": "No active users found"
                }
            }
    except Exception as e:
        print(f"Salesforce connection error: {e}")
        return {
            "user": {
                "Id": "DEMO_USER_ID",
                "Name": "Demo User",
                "Email": "demo@agentiq.com",
                "Username": "demo@agentiq.com",
                "debug": f"Connection error: {str(e)}"
            }
        }

@router.get("/test-access")
async def test_access(
    request: Request
):
    """Test what objects the current token can access."""
    # Get tokens from headers (not Header parameters)
    token = request.headers.get("access_token")
    url = request.headers.get("instance_url")
    
    # Fallback to environment if not in headers
    token = token or os.getenv("SF_ACCESS_TOKEN")
    url = url or os.getenv("SF_INSTANCE_URL")
    
    if not token or not url:
        return {"error": "No tokens provided"}
    
    try:
        sf = sf_service.get_client(token, url)
        
        # Test access to different objects
        results = {}
        
        # Test Leads
        try:
            lead_count = sf.query("SELECT COUNT() FROM Lead")['totalSize']
            results['leads'] = {'count': lead_count, 'access': 'OK'}
        except Exception as e:
            results['leads'] = {'count': 0, 'access': f'ERROR: {str(e)}'}
        
        # Test Contacts
        try:
            contact_count = sf.query("SELECT COUNT() FROM Contact")['totalSize']
            results['contacts'] = {'count': contact_count, 'access': 'OK'}
        except Exception as e:
            results['contacts'] = {'count': 0, 'access': f'ERROR: {str(e)}'}
        
        # Test Accounts
        try:
            account_count = sf.query("SELECT COUNT() FROM Account")['totalSize']
            results['accounts'] = {'count': account_count, 'access': 'OK'}
        except Exception as e:
            results['accounts'] = {'count': 0, 'access': f'ERROR: {str(e)}'}
        
        return {"access_test": results}
        
    except Exception as e:
        return {"error": f"Access test failed: {str(e)}"}

@router.get("/debug")
async def debug_salesforce(
    access_token: Optional[str] = Header(None),
    instance_url: Optional[str] = Header(None)
):
    """Debug endpoint to check what's in Salesforce."""
    token = access_token or os.getenv("SF_ACCESS_TOKEN")
    url = instance_url or os.getenv("SF_INSTANCE_URL")
    
    try:
        result = sf_service.debug_salesforce_objects(token, url)
        return {"message": "Debug completed - check backend logs", "success": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Debug failed: {str(e)}")

@router.get("/search/email/{email}")
async def search_lead_by_email(
    email: str,
    access_token: Optional[str] = Header(None),
    instance_url: Optional[str] = Header(None)
):
    """Search for a lead by email address - requires authentication."""
    # Fallback to .env if headers aren't sent during testing
    token = access_token or os.getenv("SF_ACCESS_TOKEN")
    url = instance_url or os.getenv("SF_INSTANCE_URL")
    
    try:
        # Require authentication - no demo fallbacks
        if not token or not url:
            return {
                "error": "Authentication required",
                "message": "Please authenticate with Salesforce first using /api/auth/login",
                "lead": None
            }
        
        # Search for lead by email
        lead = sf_service.fetch_lead_by_email(token, url, email)
        if lead:
            return {"lead": lead}
        else:
            return {
                "lead": None,
                "message": f"No lead or contact found with email: {email}"
            }
        
    except Exception as e:
        print(f"Email search failed: {e}")
        return {
            "error": "Failed to search for lead by email",
            "message": str(e),
            "lead": None
        }

@router.get("/leads")
async def list_leads(
    access_token: Optional[str] = Header(None),
    instance_url: Optional[str] = Header(None)
):
    """Fetches recent leads from Salesforce - requires authentication."""
    # Fallback to .env if headers aren't sent during testing
    token = access_token or os.getenv("SF_ACCESS_TOKEN")
    url = instance_url or os.getenv("SF_INSTANCE_URL")
    
    try:
        # Require authentication - no demo fallbacks
        if not token or not url:
            return {
                "error": "Authentication required",
                "message": "Please authenticate with Salesforce first using /api/auth/login",
                "leads": []
            }
        
        # Try to fetch from Salesforce
        leads = sf_service.fetch_all_leads(token, url)
        if leads:
            return {"leads": leads}
        else:
            return {
                "leads": [],
                "message": "No leads found in your Salesforce CRM"
            }
        
    except Exception as e:
        print(f"Salesforce fetch failed: {e}")
        return {
            "error": "Failed to fetch leads from Salesforce",
            "message": str(e),
            "leads": []
        }