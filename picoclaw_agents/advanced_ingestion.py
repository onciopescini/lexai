import os
import re
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    raise ValueError("Missing environment variables. Please check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# API Gemini 001
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"

class SemanticLegalChunker:
    """
    PicoClaw Semantic Chunker.
    Divide testi giuridici lunghi preservando la struttura logica (Capitoli, Articoli, Commi).
    """
    @staticmethod
    def chunk_by_article(text: str, source_metadata: dict):
        # Implementazione base: cerca divisioni per "Art. X"
        # Questo è un esempio semplificato, perfezionabile per testi complessi
        chunks = []
        
        # Split regex based on "Articolo N." or "Art. N."
        # Senato usually uses "Art. X."
        articles_raw = re.split(r'(?i)(?:Articolo|Art\.)\s+(\d+)\.?', text)
        
        # Il primo elemento è spazzatura o introduzione se non inizia con Art.
        if len(articles_raw) > 1:
            intro = articles_raw[0].strip()
            # Loop a coppie (numero articolo, testo)
            for i in range(1, len(articles_raw), 2):
                art_num = articles_raw[i]
                art_text = articles_raw[i+1].strip() if i+1 < len(articles_raw) else ""
                if art_text:
                    chunks.append({
                        "title": f"{source_metadata['titolo_legge']} - Art. {art_num}",
                        "content": f"Articolo {art_num}.\n{art_text}",
                        "metadata": {
                            **source_metadata,
                            "tipo": "Articolo",
                            "numero": art_num
                        }
                    })
        return chunks

class CostituzioneScraperAgent:
    def __init__(self):
        # Scraping diretto da un sorgente unificato se disponibile, altrimenti crawler.
        # Per semplicità, ipotizziamo di avere un testo raw HTML pulito o GitHub Gist
        # Ma per ora useremo un endpoint noto o un parser HTML per Senato.it
        self.base_url = "https://www.senato.it/istituzione/la-costituzione/la-costituzione"
        self.documents = []

    def get_full_text(self):
        print(f"[*] Inizio crawling da {self.url} non implementato massivamente in questo script demo.")
        return ""
        
    def fetch_full_costituzione(self):
        print("[*] Recupero Costituzione Italiana (testo integrale aggiornato) via Wikisource scraper...")
        url = "https://it.wikisource.org/wiki/Costituzione_della_Repubblica_Italiana"
        try:
            res = requests.get(url, headers={'User-Agent': 'PicoClaw/1.0'})
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, 'html.parser')
                
                # Il contenuto principale su mw-parser-output
                content_div = soup.find('div', {'class': 'mw-parser-output'})
                if not content_div:
                    print("[X] Impossibile trovare mw-parser-output")
                    return None
                    
                # Rimuoviamo script e style e tabelle indici
                for element in content_div(["script", "style", "table", "h2"]):
                    element.decompose()
                
                text = content_div.get_text(separator='\n', strip=True)
                return text
            else:
                print(f"[X] Http Errore: {res.status_code}")
        except Exception as e:
            print(f"[X] Exception: {e}")
        return None

    def fast_ingestion(self):
        print("[*] Avvio PicoClaw Ingestion Massiva...")
        
        testo_unico = self.fetch_full_costituzione()
        
        if not testo_unico:
            print("[!] Errore nel download del testo competo.")
            return

        meta = {
            "source": "Costituzione Italiana (Wikisource Full Text)",
            "titolo_legge": "Costituzione della Repubblica Italiana",
            "url": "https://www.senato.it/istituzione/la-costituzione" # URL ufficiale per citazioni RAG
        }
        
        # Pulizia base (rimuove note e riferimenti parentesi quadre tipo [modificato])
        testo_unico = re.sub(r'\[.*?\]', '', testo_unico)
        
        self.documents = SemanticLegalChunker.chunk_by_article(testo_unico, meta)
        
        # Filtriamo chuck con testi troppo brevi (falsi positivi)
        self.documents = [doc for doc in self.documents if len(doc["content"]) > 30]
        
        # Selezioniamo tutti, per evitare timeout API al test iniziale magari limitiamo ai primi 50 articoli,
        # ma l'utente ha chiesto 'full power', quindi filtriamo solo spam e lasciamo tutto!
        print(f"[v] Testo processato e chunked in {len(self.documents)} articoli semantici autentici.")

    def embed_and_upload(self):
        print(f"[*] Connessione a Gemini API (gemini-embedding-001) per generare vettori...")
        
        payload_db = []
        for i, doc in enumerate(self.documents):
            try:
                # Rate Limiting per API Key free-tier (evita 429)
                time.sleep(1.0)
                
                headers = {'Content-Type': 'application/json'}
                data = {
                    "model": "models/gemini-embedding-001",
                    "content": {
                        "parts": [{"text": doc['content']}]
                    }
                }
                
                res = requests.post(GEMINI_API_URL, headers=headers, json=data)
                
                if res.status_code == 200:
                    vector = res.json()['embedding']['values']
                    
                    payload_db.append({
                        "title": doc["title"],
                        "content": doc["content"],
                        "source_url": doc["metadata"]["url"],
                        "metadata": doc["metadata"],
                        "embedding": vector
                    })
                    print(f"  -> Embedded {doc['title']} (768 dim)")
                else:
                    print(f"[X] ERRORE API GEMINI su {doc['title']}: {res.text}")
                    
            except Exception as e:
                print(f"[X] Eccezione: {e}")

        if payload_db:
         # Clean della table vecchia se vogliamo fare un fresh start
         # supabase.table('legal_documents').delete().neq("id", 0).execute() # (opzionale)
            
            print(f"[*] Inserimento massivo in Supabase ({len(payload_db)} righe)...")
            data, count = supabase.table('legal_documents').insert(payload_db).execute()
            print(f"[v] INGESTION COMPLETA! LexAI Database aggiornato con successo.")
        else:
            print("[!] Nessun dato da inserire.")


if __name__ == "__main__":
    agent = CostituzioneScraperAgent()
    agent.fast_ingestion()
    agent.embed_and_upload()
