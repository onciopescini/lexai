import os
import time
import requests
import json
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Setup Supabase
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Setup Gemini
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_KEY:
    raise ValueError("Missing GEMINI_API_KEY in .env")
    
genai.configure(api_key=GEMINI_KEY)

# Setup Perplexity
PERPLEXITY_KEY = os.getenv("PERPLEXITY_API_KEY")
if not PERPLEXITY_KEY:
    raise ValueError("Missing PERPLEXITY_API_KEY in .env")

def get_perplexity_content(query: str):
    """
    Fetches content from Perplexity API using the sonar model
    with strict instructions to extract verbatim from institutional sources.
    """
    url = "https://api.perplexity.ai/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_KEY}",
        "Content-Type": "application/json"
    }
    
    system_prompt = (
        "Sei un assistente giuridico per l'AI 'Atena'. Il tuo compito è recuperare "
        "testi legali ESATTI e INTEGRALI (verbatim) da fonti istituzionali italiane "
        "(come normattiva.it, gazzettaufficiale.it). NON riassumere. NON parafrasare. "
        "Restituisci solo il testo di legge richiesto formattato in Markdown."
    )

    payload = {
        "model": "sonar",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        "temperature": 0.0,
        "max_tokens": 2000,
        "return_citations": True
    }
    
    print(f"Calling Perplexity API with query: '{query}'")
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"Perplexity API error: {response.status_code} - {response.text}")
        
    data = response.json()
    message_content = data["choices"][0]["message"]["content"]
    citations = data.get("citations", [])
    
    return message_content, citations

def get_embedding(text: str):
    """Generates a 768-dimensional embedding using Google's gemini-embedding-001"""
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_document",
        output_dimensionality=768
    )
    return result['embedding']

def main():
    print("Starting Atena Perplexity Ingester PoC...")
    
    # Target specific law for PoC
    query = "Ricerca in normattiva.it il testo integrale e verbatim dell'Articolo 1 della Costituzione Italiana."
    
    try:
        # 1. Fetch from Perplexity
        content, citations = get_perplexity_content(query)
        print("\n--- Perplexity Response ---")
        print(f"Content length: {len(content)} characters")
        print(f"First 150 chars: {content[:150]}...")
        print(f"Citations found: {len(citations)}")
        for i, cite in enumerate(citations):
            print(f" - [{i+1}] {cite}")
        print("---------------------------\n")
        
        # 2. Generate Embedding
        print("Generating embedding via Gemini...")
        embedding = get_embedding(content)
        print(f"Generated vector of dimension: {len(embedding)}")
        
        # 3. Upsert to Supabase
        # We store the citation structure in metadata
        doc = {
            "title": "Costituzione Italiana - Articolo 1 (via Perplexity)",
            "content": content,
            "source_url": citations[0] if citations else "https://www.normattiva.it",
            "metadata": {
                "source": "Costituzione",
                "jurisdiction": "Nazionale",
                "perplexity_citations": citations,
                "ingestion_method": "perplexity_api_poc"
            },
            "embedding": embedding
        }
        
        print("Inserting into Supabase 'legal_documents'...")
        response = supabase.table("legal_documents").insert(doc).execute()
        print("Inserted successfully!")
        
    except Exception as e:
        print(f"Error during ingestion: {e}")

if __name__ == "__main__":
    main()
