import os
import time
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

# Setup Supabase
# We use SERVICE_ROLE_KEY to bypass RLS for inserting raw data
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

def get_embedding(text: str):
    """Generates a 768-dimensional embedding using Google's gemini-embedding-001"""
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=text,
        task_type="retrieval_document",
        output_dimensionality=768
    )
    return result['embedding']

def scrape_wikipedia_costituzione():
    """
    Simple PoC using Wikipedia. 
    In production, this will scrape Normattiva/Gazzetta Ufficiale.
    """
    print("Scraping target URL...")
    url = "https://it.wikipedia.org/wiki/Costituzione_della_Repubblica_Italiana"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AtenaBot/1.0'}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract some paragraphs
    paragraphs = soup.find_all('p')
    chunks = []
    
    for p in paragraphs:
        text = p.get_text().strip()
        # Keep only meaningful paragraphs
        if len(text) > 50:
            chunks.append(text)
            
        if len(chunks) >= 3: # Just take 3 chunks for a quick PoC
            break
            
    print(f"Found {len(chunks)} chunks.")
    return chunks

def main():
    print("Starting Atena Legal Crawler PoC...")
    chunks = scrape_wikipedia_costituzione()
    
    for i, chunk in enumerate(chunks):
        print(f"\nProcessing chunk {i+1}/{len(chunks)}...")
        print(f"Preview: {chunk[:100]}...")
        
        # 1. Generate Embedding
        print("Generating embedding via Gemini...")
        embedding = get_embedding(chunk)
        print(f"Generated vector of dimension: {len(embedding)}")
        
        # 2. Upsert to Supabase
        doc = {
            "title": f"Costituzione Italiana - Paragrafi Storici {i+1}",
            "content": chunk,
            "source_url": "https://it.wikipedia.org/wiki/Costituzione_della_Repubblica_Italiana",
            "metadata": {
                "source": "Costituzione"
            },
            "embedding": embedding
        }
        
        print("Inserting into Supabase 'legal_documents'...")
        try:
            # Note: supabase-py v2 uses slightly different syntax. 
            # Execute returns an APIResponse object
            response = supabase.table("legal_documents").insert(doc).execute()
            print(f"Inserted successfully!")
        except Exception as e:
            print(f"Failed to insert: {e}")
            
        # Hard delay to avoid rate limits on free Gemini tier
        time.sleep(2) 

    print("\nPoC Crawler finished successfully.")

if __name__ == "__main__":
    main()
