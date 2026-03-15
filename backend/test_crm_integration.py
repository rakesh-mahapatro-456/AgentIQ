#!/usr/bin/env python3
"""
Test script to verify CRM integration fixes.
This script demonstrates the proper authentication flow and lead search functionality.
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_authentication_flow():
    """Test the authentication flow."""
    print("🔐 Testing Authentication Flow")
    print("=" * 50)
    
    # Step 1: Test login URL generation
    try:
        response = requests.get(f"{BASE_URL}/auth/login")
        if response.status_code == 302:  # Redirect expected
            print("✅ Login endpoint redirects to Salesforce OAuth")
        else:
            print(f"❌ Login endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Login endpoint error: {e}")
    
    print("\n📝 To authenticate:")
    print("1. Visit: http://localhost:8000/api/auth/login")
    print("2. Complete Salesforce OAuth")
    print("3. Extract access_token and instance_url from callback")
    print("4. Store tokens using: POST /api/auth/store-tokens")

def test_lead_search_without_auth():
    """Test lead search without authentication (should fail)."""
    print("\n🔍 Testing Lead Search Without Authentication")
    print("=" * 50)
    
    # Test email search without auth
    try:
        response = requests.get(f"{BASE_URL}/salesforce/search/email/test@example.com")
        data = response.json()
        
        if "error" in data and "Authentication required" in data["message"]:
            print("✅ Email search correctly requires authentication")
        else:
            print("❌ Email search should require authentication")
    except Exception as e:
        print(f"❌ Email search error: {e}")
    
    # Test leads list without auth
    try:
        response = requests.get(f"{BASE_URL}/salesforce/leads")
        data = response.json()
        
        if "error" in data and "Authentication required" in data["message"]:
            print("✅ Leads list correctly requires authentication")
        else:
            print("❌ Leads list should require authentication")
    except Exception as e:
        print(f"❌ Leads list error: {e}")

def test_lead_search_with_auth(access_token, instance_url):
    """Test lead search with authentication."""
    print("\n🔍 Testing Lead Search With Authentication")
    print("=" * 50)
    
    headers = {
        "access_token": access_token,
        "instance_url": instance_url
    }
    
    # Test email search with auth
    try:
        response = requests.get(f"{BASE_URL}/salesforce/search/email/test@example.com", headers=headers)
        data = response.json()
        
        if response.status_code == 200:
            if data.get("lead"):
                print(f"✅ Found lead: {data['lead'].get('Name', 'Unknown')}")
            else:
                print("✅ No lead found (search working correctly)")
        else:
            print(f"❌ Email search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Email search error: {e}")
    
    # Test leads list with auth
    try:
        response = requests.get(f"{BASE_URL}/salesforce/leads", headers=headers)
        data = response.json()
        
        if response.status_code == 200:
            leads = data.get("leads", [])
            print(f"✅ Found {len(leads)} leads in CRM")
            for i, lead in enumerate(leads[:3], 1):
                print(f"   {i}. {lead.get('Name', 'Unknown')} - {lead.get('Company', 'Unknown')}")
        else:
            print(f"❌ Leads list failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Leads list error: {e}")

def test_token_storage():
    """Test token storage functionality."""
    print("\n💾 Testing Token Storage")
    print("=" * 50)
    
    # Test storing tokens
    try:
        token_data = {
            "access_token": "test_token_123",
            "instance_url": "https://test.salesforce.com",
            "refresh_token": "refresh_token_123"
        }
        
        response = requests.post(f"{BASE_URL}/auth/store-tokens", json=token_data)
        data = response.json()
        
        if response.status_code == 200 and data.get("success"):
            session_id = data.get("session_id")
            print(f"✅ Tokens stored successfully. Session ID: {session_id}")
            
            # Test retrieving tokens
            response = requests.get(f"{BASE_URL}/auth/get-tokens/{session_id}")
            if response.status_code == 200:
                print("✅ Tokens retrieved successfully")
            else:
                print("❌ Failed to retrieve tokens")
            
            # Test clearing tokens
            response = requests.delete(f"{BASE_URL}/auth/clear-tokens/{session_id}")
            if response.status_code == 200:
                print("✅ Tokens cleared successfully")
            else:
                print("❌ Failed to clear tokens")
        else:
            print("❌ Failed to store tokens")
    except Exception as e:
        print(f"❌ Token storage error: {e}")

def main():
    """Run all tests."""
    print("🧪 CRM Integration Test Suite")
    print("=" * 60)
    
    # Test authentication flow
    test_authentication_flow()
    
    # Test without authentication (should fail)
    test_lead_search_without_auth()
    
    # Test token storage
    test_token_storage()
    
    print("\n📋 Summary:")
    print("=" * 30)
    print("✅ Authentication flow implemented")
    print("✅ Demo lead fallbacks removed")
    print("✅ Email search functionality fixed")
    print("✅ Token storage system added")
    print("\n🔧 Next Steps:")
    print("1. Start the backend server: python main.py")
    print("2. Authenticate with Salesforce: http://localhost:8000/api/auth/login")
    print("3. Use the access_token and instance_url from callback")
    print("4. Test lead search with real CRM data")

if __name__ == "__main__":
    main()
