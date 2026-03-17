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

class CodiceCivileHarvester:
    """
    Crawler per il Codice Civile da Wikisource.
    Scorre tutti i Titoli e i Libri, estrae gli articoli e li inserisce in Supabase.
    """
    def __init__(self):
        self.base_url = "https://it.wikisource.org"
        self.index_url = f"{self.base_url}/wiki/Codice_civile"
        self.documents = []
        self.headers = {'User-Agent': 'AtenaHarvester/1.0 (Legal AI Ingestion Agent)'}

    def fetch_links(self):
        print(f"[*] Recupero indice dei Titoli/Libri da {self.index_url}...")
        res = requests.get(self.index_url, headers=self.headers)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        links = []
        # Find all direct links to Titoli or Libri
        for a in soup.find_all('a', href=True):
            if '/wiki/Codice_civile/Libro_' in a['href']:
                if a['href'] not in links:
                    links.append(a['href'])
                    
        print(f"[v] Trovate {len(links)} sotto-sezioni del Codice Civile.")
        return links

    def scrape_and_chunk(self):
        links = self.fetch_links()
        
        for idx, link in enumerate(links):
            full_url = self.base_url + link
            print(f"[{idx+1}/{len(links)}] Scraping {full_url}...")
            
            res = requests.get(full_url, headers=self.headers)
            if res.status_code != 200:
                print(f"[X] Errore connessione a {full_url}")
                continue

            soup = BeautifulSoup(res.text, 'html.parser')
            content_div = soup.find('div', {'class': 'mw-parser-output'})
            if not content_div:
                continue

            # Pulizia
            for element in content_div(["script", "style", "table", "div.toc"]):
                element.decompose()

            testo_raw = content_div.get_text(separator=' ', strip=True)
            testo_raw = re.sub(r'\[.*?\]', '', testo_raw)

            # Dividiamo in base alla stringa "Art. X." o "Articolo X."
            articles_raw = re.split(r'(?i)(?:Articolo|Art\.)\s+(\d+[a-zA-Z-]*)\.?', testo_raw)
            
            if len(articles_raw) > 1:
                for i in range(1, len(articles_raw), 2):
                    art_num = articles_raw[i]
                    art_text = articles_raw[i+1].strip() if i+1 < len(articles_raw) else ""
                    
                    if len(art_text) > 20: 
                        metadata = {
                            "source": "Codice Civile",
                            "titolo_legge": "Codice Civile Italiano",
                            "tipo": "Articolo",
                            "numero": art_num,
                            "sezione": link.split('/')[-1].replace('_',' ')
                        }
                        
                        full_content = f"Articolo {art_num}.\n{art_text}"
                        
                        self.documents.append({
                            "title": f"Codice Civile - Art. {art_num}",
                            "content": full_content,
                            "source_url": f"{full_url}#Art._{art_num}",
                            "metadata": metadata,
                            "jurisdiction": "IT",
                            "hierarchy": "Civil Code",
                            "law_status": "In Force",
                            "date_enacted": "1942-03-16",
                            "article_number": str(art_num)
                        })
            
            time.sleep(1) # Be nice to Wikipedia
            
        print(f"[v] Scraping termianto. Estratti totali: {len(self.documents)} articoli del Codice Civile.")

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
                    print(f"[X] DB Error -> salvato in db_err.txt")
                    with open("db_err.txt", "a") as f:
                        f.write(str(e) + "\n\n")
                        
        print(f"[v] INGESTIONE CODICE CIVILE COMPLETATA CON SUCCESSO! 👑")

if __name__ == "__main__":
    harvester = CodiceCivileHarvester()
    harvester.scrape_and_chunk()
    harvester.embed_and_upload()
