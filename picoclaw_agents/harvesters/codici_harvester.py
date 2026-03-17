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

class GenericCodiceHarvester:
    """
    Crawler Universale per Codici Italiani da Wikisource.
    """
    def __init__(self, code_name: str, wiki_path: str, date_enacted: str):
        self.base_url = "https://it.wikisource.org"
        self.code_name = code_name
        self.wiki_path = wiki_path
        self.index_url = f"{self.base_url}/wiki/{self.wiki_path}"
        self.date_enacted = date_enacted
        self.documents = []
        self.headers = {'User-Agent': 'AtenaHarvester/1.0 (Legal AI Ingestion Agent)'}

    def fetch_links(self):
        print(f"[*] [{self.code_name}] Recupero indice strutturale da {self.index_url}...")
        res = requests.get(self.index_url, headers=self.headers)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        links = []
        for a in soup.find_all('a', href=True):
            if f"/wiki/{self.wiki_path}/" in a['href'] and ('/Libro_' in a['href'] or '/Parte_' in a['href'] or '/Titolo_' in a['href']):
                if a['href'] not in links:
                    links.append(a['href'])
                    
        print(f"[v] [{self.code_name}] Trovate {len(links)} sotto-sezioni da esplorare.")
        return links

    def scrape_and_chunk(self):
        links = self.fetch_links()
        
        for idx, link in enumerate(links):
            full_url = self.base_url + link
            print(f"[{idx+1}/{len(links)}] Scraping {full_url}...")
            
            # Avoid re-scraping the root if it got caught
            if link == f"/wiki/{self.wiki_path}": continue

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
                            "source": self.code_name,
                            "titolo_legge": f"{self.code_name} Italiano",
                            "tipo": "Articolo",
                            "numero": art_num,
                            "sezione": link.split('/')[-1].replace('_',' ')
                        }
                        
                        full_content = f"Articolo {art_num}.\n{art_text}"
                        
                        self.documents.append({
                            "title": f"{self.code_name} - Art. {art_num}",
                            "content": full_content,
                            "source_url": f"{full_url}#Art._{art_num}",
                            "metadata": metadata,
                            "jurisdiction": "IT",
                            "hierarchy": "Code",
                            "law_status": "In Force",
                            "date_enacted": self.date_enacted,
                            "article_number": str(art_num)
                        })
            
            time.sleep(1) # Rispettiamo Wikipedia
            
        print(f"[v] Scraping termianto. Estratti totali: {len(self.documents)} articoli per {self.code_name}.")

    def embed_and_upload(self, batch_size=20):
        if not self.documents:
            print(f"[!] Nessun documento trovato per {self.code_name}.")
            return

        print(f"[*] Inizio Embed Gemini e Upload ({self.code_name}). Totale: {len(self.documents)}")
        
        for i in range(0, len(self.documents), batch_size):
            batch = self.documents[i:i + batch_size]
            payload_db = []
            
            for doc in batch:
                try:
                    time.sleep(0.5)
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
                        print(f"[X] ERROR API GEMINI su Art. {doc['article_number']}: {res.status_code}")
                except Exception as e:
                    print(f"[X] Network Exception: {e}")

            if payload_db:
                print(f"[*] Push DB batch (Progress: {min(i+batch_size, len(self.documents))}/{len(self.documents)})...")
                try:
                    supabase.table('legal_documents').insert(payload_db).execute()
                except Exception as e:
                    print(f"[X] DB Error")
                    with open("db_err_codes.txt", "a") as f:
                        f.write(str(e) + "\n")
                        
        print(f"[v] INGESTIONE {self.code_name.upper()} COMPLETATA CON SUCCESSO! 👑")

if __name__ == "__main__":
    targets = [
        {"name": "Codice Penale", "path": "Codice_penale", "date": "1930-10-19"},
        {"name": "Codice di Procedura Civile", "path": "Codice_di_procedura_civile", "date": "1940-10-28"},
        {"name": "Codice di Procedura Penale", "path": "Codice_di_procedura_penale", "date": "1988-09-22"}
    ]
    
    for t in targets:
        harvester = GenericCodiceHarvester(t['name'], t['path'], t['date'])
        harvester.scrape_and_chunk()
        harvester.embed_and_upload()  # Da eseguire una volta pronti
        print("\n" + "="*50 + "\n")
