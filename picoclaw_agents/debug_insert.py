from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

try:
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
    # Tentiamo di inserire e leggere.
    res = supabase.table('user_queries').insert([{'query': 'Che succede se mi licenziano senza giusta causa?'}]).execute()
    with open('err.txt', 'w', encoding='utf-8') as f:
        f.write(f"SUCCESS: {str(res)}")
except Exception as e:
    with open('err.txt', 'w', encoding='utf-8') as f:
        f.write(f"ERROR: {str(e)}")
