import os
import re
import time
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    raise ValueError("Missing environment variables. Please check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"

class EurLexCrawler:
    """
    Crawler per EUR-Lex (Diritto dell'Unione Europea).
    Scarica testi legislativi (Direttive, Regolamenti) basandosi sul CELEX ID.
    Esempio CELEX: 32016R0679 (GDPR).
    """
    def __init__(self):
        self.base_url = "https://eur-lex.europa.eu/legal-content/IT/TXT/HTML/"
        self.documents = []
        self.headers = {'User-Agent': 'PicoClaw/2.0 (Legal AI Ingestion Agent EU)'}
        
        # Lista di prova: [GDPR, Direttiva Copyright, AI Act (se disponibile, altrimenti altro)]
        self.target_celex_ids = [
            "32016R0679", # GDPR
            "32019L0790", # Direttiva Copyright (DSM)
            "32000L0031", # Direttiva E-commerce
        ]

    def parse_document(self, celex_id: str):
        """Scarica e parsa un documento da EUR-Lex usando il CELEX."""
        req_url = f"{self.base_url}?uri=CELEX:{celex_id}"
        print(f"[*] Fetching EUR-Lex CELEX {celex_id} da {req_url}")
        res = requests.get(req_url, headers=self.headers)
        
        if res.status_code != 200:
            print(f"[X] Errore 404/500 per {celex_id}")
            return []
            
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Rimuoviamo script e stili
        for element in soup(["script", "style"]):
            element.decompose()
            
        # Il testo su Eur-lex di solito è dentro un div specifico o nel body
        content_div = soup.find('div', id='docHtml') or soup.find('body')
        
        if not content_div:
            print(f"[!] Impossibile trovare il contenuto per {celex_id}")
            return []
            
        text_content = content_div.get_text(separator='\n', strip=True)
        
        # Titolo del documento
        title_element = soup.find('p', class_='title') or soup.find('h1')
        doc_title = title_element.get_text(strip=True) if title_element else f"Documento EU {celex_id}"
        
        # Chunker V2 (Adattato per l'UE)
        # Cerchiamo "Articolo X"
        chunks = []
        articles_raw = re.split(r'(?i)(?:Articolo)\s+(\d+[a-zA-Z-]*)\s*\n?', text_content)
        
        if len(articles_raw) > 1:
            for i in range(1, len(articles_raw), 2):
                art_num = articles_raw[i]
                art_text = articles_raw[i+1].strip() if i+1 < len(articles_raw) else ""
                
                # Taglia i testi troppo lunghi (per evitare problemi col modello di embedding se supera i tokens)
                # Un articolo europeo può essere lunghissimo. Potremmo fare un chunkulteriore, ma per ora teniamo l'articolo.
                if len(art_text) > 50:
                    chunks.append({
                        "title": f"EUR-Lex - Art. {art_num} ({doc_title[:40]}...)",
                        "content": f"EUR-Lex | Articolo {art_num}.\n{art_text[:5000]}", # Limite 5000 chars per sicurezza
                        "source_url": req_url,
                        "metadata": {
                            "source": "Unione Europea (EUR-Lex)",
                            "titolo_legge": doc_title,
                            "tipo": "Articolo_UE",
                            "numero": art_num,
                            "celex": celex_id
                        }
                    })
        else:
            print(f"[!] Nessun 'Articolo' trovato con regex standard per {celex_id}")

        return chunks

    def execute_global_ingestion(self):
        print("====== Avvio PicoClaw Ingestion: EUR-Lex (Cross-Embedding) ======")
        all_chunks = []
        
        for celex in self.target_celex_ids:
            chunks = self.parse_document(celex)
            all_chunks.extend(chunks)
            print(f"  [v] Estratti {len(chunks)} articoli da {celex}")
            time.sleep(1.0) # Courtesy delay
            
        self.documents = all_chunks
        print(f"\n[v] Scraping Europeo Completato. Estratti totali {len(self.documents)} Articoli pronti per l'Embedding.")

    def embed_and_upload(self, batch_size=20):
        if not self.documents:
            print("[!] Nessun documento da backuppare.")
            return

        print(f"[*] Inizio Upload su Supabase con Vettori Gemini 001. Totale: {len(self.documents)}")
        
        for i in range(0, len(self.documents), batch_size):
            batch = self.documents[i:i + batch_size]
            payload_db = []
            
            for doc in batch:
                try:
                    time.sleep(1.0) # Rate limit Gemini API
                    headers = {'Content-Type': 'application/json'}
                    data = {
                        "model": "models/gemini-embedding-001",
                        "content": {"parts": [{"text": doc['content']}]}
                    }
                    res = requests.post(GEMINI_API_URL, headers=headers, json=data)
                    if res.status_code == 200:
                        vector = res.json()['embedding']['values']
                        payload_db.append({
                            "title": doc["title"],
                            "content": doc["content"],
                            "source_url": doc["source_url"],
                            "metadata": doc["metadata"],
                            "embedding": vector
                        })
                    else:
                        print(f"[X] ERRORE GEMINI su {doc['title']}")
                except Exception as e:
                    print(f"[X] Eccezione: {e}")

            if payload_db:
                print(f"[*] Pusho a DB batch di {len(payload_db)} articoli UE (Progress: {i}/{len(self.documents)})...")
                # Inseriamo nella stessa tabella "legal_documents" per permettere il cross-embedding!
                supabase.table('legal_documents').insert(payload_db).execute()

        print(f"[v] Cross-Embedding terminato! Ora il RAG conosce le leggi Europee.")

if __name__ == "__main__":
    crawler = EurLexCrawler()
    # Testiamo solo lo scraping per ora senza intasare le API Gemini che stanno elaborando il Codice Civile
    crawler.execute_global_ingestion()
    print("[!] Skip upload per test.")
    # crawler.embed_and_upload()
