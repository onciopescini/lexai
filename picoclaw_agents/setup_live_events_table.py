import os
import psycopg2
from dotenv import load_dotenv

# Try both standard and Next.js env formats
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'webapp', '.env.local'))

# Supabase Postgres connection string
db_url = os.getenv('SUPABASE_DB_URL')
if not db_url:
    print("Error: SUPABASE_DB_URL not found in environment")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    with open('setup_live_events_table.sql', 'r') as f:
        sql = f.read()
        cur.execute(sql)
    
    conn.commit()
    cur.close()
    conn.close()
    print("Success: Live events table created and REALTIME enabled.")
except Exception as e:
    print(f"Error executing SQL: {e}")
