import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("Error: Missing SUPABASE_URL or SUPABASE_KEY in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_database():
    print("=== LEXAI Database Status Report ===\n")

    # 1. Check legal_documents (Embeddings)
    try:
        # Use count attribute
        res = supabase.table('legal_documents').select('*', count='exact').limit(1).execute()
        count_docs = res.count
        print(f"[1] Table 'legal_documents' (RAG Embeddings):")
        print(f"    Total items: {count_docs}")
        
        # Get a sample
        if count_docs > 0:
            sample = supabase.table('legal_documents').select('title, metadata').limit(3).execute()
            print("    Sample Entries:")
            for item in sample.data:
                print(f"      - {item['title']} (Metadata keys: {list(item['metadata'].keys())})")
        print()
    except Exception as e:
        print(f"Error reading 'legal_documents': {e}\n")

    # 2. Check legal_historical_articles (Library Versions)
    try:
        res = supabase.table('legal_historical_articles').select('*', count='exact').limit(1).execute()
        count_hist = res.count
        print(f"[2] Table 'legal_historical_articles' (Library Timeline):")
        print(f"    Total items: {count_hist}")
        
        # Get a sample
        if count_hist > 0:
            sample = supabase.table('legal_historical_articles').select('codice, articolo_num, versione_nome, is_vigente, testo').limit(3).execute()
            print("    Sample Entries:")
            for item in sample.data:
                print(f"      - {item['codice']} Art. {item['articolo_num']} | Version: {item['versione_nome']} | Vigente: {item['is_vigente']}")
                print(f"        Snippet: {item['testo'][:80]}...")
        print()
    except Exception as e:
        print(f"Error reading 'legal_historical_articles': {e}\n")

if __name__ == "__main__":
    check_database()
