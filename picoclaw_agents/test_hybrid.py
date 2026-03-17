import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

res = supabase.rpc('hybrid_search_legal_docs', {
    'query_embedding': [0.1] * 768,
    'query_text': 'test',
    'filter': {},
    'match_count': 1,
    'full_text_weight': 1.0,
    'semantic_weight': 1.0
}).execute()

print(res)
