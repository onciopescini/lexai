import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# We need the direct connection string to the DB, usually looks like postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
# In Supabase projects it's the DATABASE_URL. If the user doesn't have it in .env, this will fail.
# A safe fallback is just printing instructions, but we can try building it from SUPABASE_KEY if we had the password, which we don't.
# Wait, let's just ask the user to run the SQL in Supabase dashboard since it's the safest way to execute DDL.

print("=====================================================================")
print("ATTENZIONE: Esecuzione DDL (CREATE TABLE) da script non consigliata.")
print("Per favore, apri Supabase > SQL Editor e incolla il contenuto di:")
print("setup_agent_memory_table.sql")
print("=====================================================================")
