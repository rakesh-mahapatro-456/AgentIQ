import os
import base64
import hashlib
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.requests import Request
import httpx
from pydantic import BaseModel

router = APIRouter()

# Store PKCE verifiers temporarily (in production, use Redis or database)
pkce_store = {}

# Token storage (in production, use secure database)
token_store = {}

class TokenRequest(BaseModel):
    access_token: str
    instance_url: str
    refresh_token: Optional[str] = None

def generate_code_verifier():
    """Generate a code verifier for PKCE"""
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')

def generate_code_challenge(code_verifier):
    """Generate code challenge from code verifier"""
    sha256_hash = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(sha256_hash).decode('utf-8').rstrip('=')

@router.post("/store-tokens")
async def store_tokens(token_request: TokenRequest):
    """Store OAuth tokens for session use (in production, use secure storage)."""
    try:
        session_id = secrets.token_urlsafe(16)
        token_store[session_id] = {
            "access_token": token_request.access_token,
            "instance_url": token_request.instance_url,
            "refresh_token": token_request.refresh_token,
            "created_at": secrets.token_hex(8)
        }
        return {
            "success": True,
            "session_id": session_id,
            "message": "Tokens stored successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store tokens: {str(e)}")

@router.get("/get-tokens/{session_id}")
async def get_tokens(session_id: str):
    """Retrieve stored tokens for a session."""
    tokens = token_store.get(session_id)
    if not tokens:
        raise HTTPException(status_code=404, detail="Tokens not found for session")
    return tokens

@router.delete("/clear-tokens/{session_id}")
async def clear_tokens(session_id: str):
    """Clear stored tokens for a session."""
    if session_id in token_store:
        del token_store[session_id]
        return {"success": True, "message": "Tokens cleared"}
    return {"success": True, "message": "No tokens to clear"}

@router.get("/login")
def login_salesforce(request: Request):
    """Redirects user to Salesforce OAuth page with PKCE."""
    client_id = os.getenv("SF_CLIENT_ID")
    redirect_uri = os.getenv("SF_REDIRECT_URI")
    
    # Generate PKCE values
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    
    # Store the code verifier for later use (using session ID)
    session_id = secrets.token_urlsafe(16)
    pkce_store[session_id] = code_verifier
    
    # Build Salesforce OAuth URL with PKCE
    sf_url = (
        f"https://login.salesforce.com/services/oauth2/authorize"
        f"?response_type=code"
        f"&client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
        f"&state={session_id}"
    )
    
    response = RedirectResponse(sf_url)
    # Set session ID in cookie for later retrieval
    response.set_cookie("pkce_session", session_id, httponly=True, secure=False)
    return response

@router.get("/callback")
async def auth_callback(
    code: str = Query(...),
    state: str = Query(...),
    request: Request = None
):
    """Receives code and exchanges it for access_token using PKCE."""
    try:
        # Retrieve code verifier from storage
        session_id = state
        if session_id not in pkce_store:
            # Fallback to cookie if state not found
            session_id = request.cookies.get("pkce_session")
        
        code_verifier = pkce_store.get(session_id)
        if not code_verifier:
            return {"error": "invalid_request", "error_description": "Code verifier not found"}
        
        # Clean up stored verifier
        if session_id in pkce_store:
            del pkce_store[session_id]
        
        # Exchange code for access token
        client_id = os.getenv("SF_CLIENT_ID")
        client_secret = os.getenv("SF_CLIENT_SECRET")
        redirect_uri = os.getenv("SF_REDIRECT_URI")
        
        token_data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "code_verifier": code_verifier
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://login.salesforce.com/services/oauth2/token",
                data=token_data
            )
            
            if response.status_code != 200:
                error_data = response.json()
                return {
                    "error": "token_exchange_failed",
                    "error_description": error_data.get("error_description", "Token exchange failed")
                }
            
            token_response = response.json()
            
            # Redirect to frontend callback page with tokens
            frontend_callback_url = (
                f"http://localhost:3000/callback"
                f"?status=authenticated"
                f"&access_token={token_response.get('access_token', '')}"
                f"&instance_url={token_response.get('instance_url', '')}"
                f"&refresh_token={token_response.get('refresh_token', '')}"
            )
            
            return RedirectResponse(frontend_callback_url)
            
    except Exception as e:
        return {
            "error": "auth_error",
            "error_description": str(e)
        }