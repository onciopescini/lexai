import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# To execute raw SQL, we use rpc. Supabase Python client does not have execute_sql by default.
# But wait... we can just use psycopg2 using the direct connection string!

import psycopg2

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Build it from Supabase URL (e.g. https://xyz.supabase.co) -> db.xyz.supabase.co
    # Since we might not have it, let's just ask the user or print an error.
    # Actually, we can just connect if we have postgresql string.
    print("Manca DATABASE_URL nel .env per fare DDL. Tenterò di ricavarlo.")
    project_id = SUPABASE_URL.split("//")[1].split(".")[0]
    db_pwd = "YOUR_DB_PASSWORD"
    print(f"Vai su supabase e lancia: ALTER TABLE legal_documents ALTER COLUMN embedding TYPE vector(3072);")

