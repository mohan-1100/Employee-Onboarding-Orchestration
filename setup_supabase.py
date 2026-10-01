import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://yeoshrdnzekkbzeffnbn.supabase.co")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}"
}

tables = ["employees", "hr_compliance", "it_provisioning", "workplace_logistics", "audit_logs"]

def check_supabase():
    print("=" * 60)
    print("Checking Supabase Tables for Project: yeoshrdnzekkbzeffnbn")
    print(f"URL: {SUPABASE_URL}")
    print("=" * 60)
    
    missing = []
    ready = []
    
    for table in tables:
        res = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=count", headers=headers)
        if res.status_code == 200:
            print(f"[OK] Table '{table}' exists.")
            ready.append(table)
        else:
            print(f"[MISSING] Table '{table}' not created yet (Status {res.status_code}).")
            missing.append(table)
            
    print("=" * 60)
    if missing:
        print(f"Status: {len(missing)} of {len(tables)} tables need to be created in Supabase.")
        print("To complete the database schema:")
        print("1. Go to https://supabase.com/dashboard/project/yeoshrdnzekkbzeffnbn/sql")
        print("2. Paste the SQL script from 'supabase_schema.sql' and click Run.")
        print("3. Alternatively, provide your Supabase DB password to connect directly.")
    else:
        print("All tables exist in Supabase! Database is completely initialized.")
    print("=" * 60)

if __name__ == "__main__":
    check_supabase()
