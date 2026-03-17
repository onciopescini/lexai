import os
import psycopg
from dotenv import load_dotenv

load_dotenv()
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")

try:
    print(f"Testing connection to: {SUPABASE_DB_URL}")
    with psycopg.connect(SUPABASE_DB_URL, connect_timeout=5) as conn:
        print("✅ Connection Default String Successful!")
except Exception as e:
    print(f"❌ Connection Default String Failed: {e}")
