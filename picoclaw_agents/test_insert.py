from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

try:
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
    res = supabase.table('user_queries').insert([{'query': 'Che succede se mi licenziano senza giusta causa?'}]).execute()
    print("SUCCESS:", res)
except Exception as e:
    print("ERROR:", str(e))
