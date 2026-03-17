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

class CostituzioneHarvester:
    """
    Crawler per la Costituzione della Repubblica Italiana da Wikisource.
    Estrae i 139 articoli e li inserisce in Supabase con la nuova struttura metadata.
    """
    def __init__(self):
        self.url = "https://it.wikisource.org/wiki/Costituzione_della_Repubblica_Italiana"
        self.documents = []
        self.headers = {'User-Agent': 'AtenaHarvester/1.0 (Legal AI Ingestion Agent)'}

    def scrape_and_chunk(self):
        print(f"[*] Inizio estrazione Costituzione Italiana da {self.url}...")
        res = requests.get(self.url, headers=self.headers)
        if res.status_code != 200:
            print("[X] Errore connessione alla pagina della Costituzione.")
            return

        soup = BeautifulSoup(res.text, 'html.parser')
        content_div = soup.find('div', {'class': 'mw-parser-output'})
        if not content_div:
            print("[X] Contenuto non trovato.")
            return

        # Pulizia base
        for element in content_div(["script", "style", "table", "div.toc"]):
            element.decompose()

        testo_raw = content_div.get_text(separator='\n', strip=True)
        # Rimuove le note tra parentesi quadre
        testo_raw = re.sub(r'\[.*?\]', '', testo_raw)

        # Dividiamo in base alla stringa "Art. X." o "Articolo X."
        articles_raw = re.split(r'(?i)(?:Articolo|Art\.)\s+(\d+[a-zA-Z-]*)\.?', testo_raw)
        
        chunks = []
        if len(articles_raw) > 1:
            for i in range(1, len(articles_raw), 2):
                art_num = articles_raw[i]
                art_text = articles_raw[i+1].strip() if i+1 < len(articles_raw) else ""
                
                # Taglia eventuali parti post-costituzione (es. Disposizioni transitorie)
                if "Disposizioni transitorie e finali" in art_text and int(art_num) > 139:
                   art_text = art_text.split("Disposizioni transitorie e finali")[0].strip()

                if len(art_text) > 20: 
                    # Struttura Dati Aggiornata per MEGA-CAMPAGNA 0
                    metadata = {
                        "source": "Costituzione Italiana",
                        "titolo_legge": "Costituzione della Repubblica Italiana",
                        "tipo": "Articolo",
                        "numero": art_num
                    }
                    
                    full_content = f"Articolo {art_num}.\n{art_text}"
                    
                    chunks.append({
                        "title": f"Costituzione Italiana - Art. {art_num}",
                        "content": full_content,
                        "source_url": f"{self.url}#Art._{art_num}",
                        "metadata": metadata,
                        "jurisdiction": "IT",
                        "hierarchy": "Constitution",
                        "law_status": "In Force",
                        "date_enacted": "1948-01-01",
                        "article_number": str(art_num)
                    })

        self.documents = chunks
        print(f"[v] Letti {len(self.documents)} articoli della Costituzione.")

    def embed_and_upload(self, batch_size=20):
        if not self.documents:
            print("[!] Nessun documento da inserire.")
            return

        print(f"[*] Inizio Generazione Embedding Gemini e Upload su Supabase (legal_documents). Totale: {len(self.documents)}")
        
        for i in range(0, len(self.documents), batch_size):
            batch = self.documents[i:i + batch_size]
            payload_db = []
            
            for doc in batch:
                try:
                    time.sleep(0.5) # Rate limit Gemini API
                    headers = {'Content-Type': 'application/json'}
                    data = {
                        "model": "models/gemini-embedding-001",
                        "content": {"parts": [{"text": doc['content']}]},
                        "outputDimensionality": 768
                    }
                    res = requests.post(GEMINI_API_URL, headers=headers, json=data)
                    
                    if res.status_code == 200:
                        vector = res.json()['embedding']['values']
                        payload_db.append({
                            "title": doc["title"],
                            "content": doc["content"],
                            "source_url": doc["source_url"],
                            "metadata": doc["metadata"],
                            "embedding": vector,
                            "jurisdiction": doc["jurisdiction"],
                            "hierarchy": doc["hierarchy"],
                            "law_status": doc["law_status"],
                            "date_enacted": doc["date_enacted"],
                            "article_number": doc["article_number"]
                        })
                    else:
                        print(f"[X] ERRORE API GEMINI sull'Art. {doc['article_number']}: {res.status_code}")
                except Exception as e:
                    print(f"[X] Eccezione di rete: {e}")

            if payload_db:
                print(f"[*] Push DB batch {len(payload_db)} articoli (Progress: {min(i+batch_size, len(self.documents))}/{len(self.documents)})...")
                try:
                    supabase.table('legal_documents').insert(payload_db).execute()
                except Exception as e:
                    print(f"[X] DB Error - Dettagli scritti su db_err.txt")
                    with open("db_err.txt", "w") as f:
                        f.write(str(e))
                        
        print(f"[v] INGESTIONE COSTITUZIONE COMPLETATA CON SUCCESSO! 👑")

if __name__ == "__main__":
    harvester = CostituzioneHarvester()
    harvester.scrape_and_chunk()
    harvester.embed_and_upload()
