import os
from simple_salesforce import Salesforce
from dotenv import load_dotenv

load_dotenv()

class SalesforceService:
    def get_client(self, access_token: str, instance_url: str):
        """Create Salesforce client with OAuth token"""
        return Salesforce(
            instance_url=instance_url,
            session_id=access_token
        )
    
    def test_connection(self, access_token: str, instance_url: str):
        """Test Salesforce connection"""
        try:
            sf = self.get_client(access_token, instance_url)
            # Try a simple query to test connection
            result = sf.query("SELECT Id FROM User LIMIT 1")
            return result['totalSize'] > 0
        except Exception as e:
            print(f"Salesforce connection test failed: {e}")
            return False

    def fetch_lead_by_email(self, access_token: str, instance_url: str, email: str):
        """Get lead details using OAuth session - prioritize real CRM data."""
        try:
            # If no credentials provided, return None (no demo fallbacks)
            if not access_token or not instance_url:
                print("❌ No Salesforce credentials provided for email lookup")
                return None
            
            sf = self.get_client(access_token, instance_url)
            query = f"SELECT Id, Name, Company, Industry, Description, Title, Email, Phone, Status, AnnualRevenue, Website, City, State, Country, NumberOfEmployees, LeadSource FROM Lead WHERE Email = '{email}'"
            result = sf.query(query)
            
            if result['totalSize'] > 0:
                print(f"✅ Found lead in Salesforce for email: {email}")
                return result['records'][0]
            
            # If no lead found, check contacts
            contact_query = f"SELECT Id, Name, Title, Email, Phone, Account.Name, Account.Industry, Account.Description, Account.Website, Account.AnnualRevenue, Account.BillingCity, Account.BillingState, Account.BillingCountry, Account.NumberOfEmployees FROM Contact WHERE Email = '{email}'"
            contact_result = sf.query(contact_query)
            
            if contact_result['totalSize'] > 0:
                contact = contact_result['records'][0]
                # Convert contact to lead-like format
                lead_data = {
                    'Id': contact['Id'],
                    'Name': contact['Name'],
                    'Company': contact.get('Account', {}).get('Name', 'Unknown Account'),
                    'Title': contact.get('Title', ''),
                    'Email': contact.get('Email', ''),
                    'Phone': contact.get('Phone', ''),
                    'Industry': contact.get('Account', {}).get('Industry', 'Unknown'),
                    'Status': 'Contact - Active',
                    'Description': contact.get('Account', {}).get('Description', ''),
                    'Website': contact.get('Account', {}).get('Website', ''),
                    'AnnualRevenue': contact.get('Account', {}).get('AnnualRevenue', 0),
                    'City': contact.get('Account', {}).get('BillingCity', ''),
                    'State': contact.get('Account', {}).get('BillingState', ''),
                    'Country': contact.get('Account', {}).get('BillingCountry', ''),
                    'NumberOfEmployees': contact.get('Account', {}).get('NumberOfEmployees', 0),
                    'LeadSource': 'Contact Conversion'
                }
                print(f"✅ Found contact in Salesforce for email: {email}")
                return lead_data
            
            print(f"❌ No lead or contact found for email: {email}")
            return None
            
        except Exception as e:
            print(f"❌ Error fetching lead by email: {e}")
            return None

    def fetch_all_leads(self, access_token: str, instance_url: str, limit: int = 50):
        """Fetch all leads from Salesforce for batch processing."""
        try:
            sf = self.get_client(access_token, instance_url)
            
            # Query leads with comprehensive fields
            lead_query = f"""
            SELECT Id, Name, Company, Title, Email, Phone, Industry, Status, 
                   LastActivityDate, AnnualRevenue, Description, Website, 
                   LeadSource, City, State, Country, NumberOfEmployees
            FROM Lead 
            ORDER BY CreatedDate DESC 
            LIMIT {limit}
            """
            
            lead_result = sf.query(lead_query)
            
            if lead_result['totalSize'] > 0:
                return lead_result['records']
            
            # If no leads, check for contacts
            contact_query = f"""
            SELECT Id, Name, Title, Email, Phone, Account.Name, Account.Industry,
                   Account.Website, Account.AnnualRevenue, Account.Description,
                   Account.BillingCity, Account.BillingState, Account.BillingCountry,
                   Account.NumberOfEmployees
            FROM Contact 
            ORDER BY CreatedDate DESC 
            LIMIT {limit}
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
                        'Status': 'Contact - Active',
                        'Description': contact.get('Account', {}).get('Description', ''),
                        'Website': contact.get('Account', {}).get('Website', ''),
                        'AnnualRevenue': contact.get('Account', {}).get('AnnualRevenue', 0),
                        'City': contact.get('Account', {}).get('BillingCity', ''),
                        'State': contact.get('Account', {}).get('BillingState', ''),
                        'Country': contact.get('Account', {}).get('BillingCountry', ''),
                        'NumberOfEmployees': contact.get('Account', {}).get('NumberOfEmployees', 0),
                        'LeadSource': 'Contact Conversion'
                    })
                return contacts
            
            return []
            
        except Exception as e:
            print(f"Error fetching all Salesforce leads: {e}")
            return []

    def debug_salesforce_objects(self, access_token: str, instance_url: str):
        """Debug method to check what objects and data exist in Salesforce"""
        try:
            sf = self.get_client(access_token, instance_url)
            
            print("=== SALESFORCE DEBUG ===")
            
            # Check Leads
            try:
                lead_count = sf.query("SELECT COUNT() FROM Lead")['totalSize']
                print(f"Leads count: {lead_count}")
                if lead_count > 0:
                    sample_leads = sf.query("SELECT Id, Name, Company, Email FROM Lead LIMIT 3")
                    print(f"Sample leads: {sample_leads['records']}")
            except Exception as e:
                print(f"Error querying Leads: {e}")
            
            # Check Contacts
            try:
                contact_count = sf.query("SELECT COUNT() FROM Contact")['totalSize']
                print(f"Contacts count: {contact_count}")
                if contact_count > 0:
                    sample_contacts = sf.query("SELECT Id, Name, Email, Account.Name FROM Contact LIMIT 3")
                    print(f"Sample contacts: {sample_contacts['records']}")
            except Exception as e:
                print(f"Error querying Contacts: {e}")
            
            # Check Accounts
            try:
                account_count = sf.query("SELECT COUNT() FROM Account")['totalSize']
                print(f"Accounts count: {account_count}")
                if account_count > 0:
                    sample_accounts = sf.query("SELECT Id, Name FROM Account LIMIT 3")
                    print(f"Sample accounts: {sample_accounts['records']}")
            except Exception as e:
                print(f"Error querying Accounts: {e}")
            
            # Check Opportunities
            try:
                opp_count = sf.query("SELECT COUNT() FROM Opportunity")['totalSize']
                print(f"Opportunities count: {opp_count}")
                if opp_count > 0:
                    sample_opps = sf.query("SELECT Id, Name, Account.Name FROM Opportunity LIMIT 3")
                    print(f"Sample opportunities: {sample_opps['records']}")
            except Exception as e:
                print(f"Error querying Opportunities: {e}")
                
            print("=== END DEBUG ===")
            return True
            
        except Exception as e:
            print(f"Debug error: {e}")
            return False

sf_service = SalesforceService()