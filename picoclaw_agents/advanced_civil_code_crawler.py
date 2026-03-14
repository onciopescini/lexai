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

class CivilCodeCrawler:
    """
    Crawler avanzato per il Codice Civile Italiano da Wikisource.
    Naviga dinamicamente nei vari Libri e Titoli per mantenere il contesto (Breadcrumbs).
    """
    def __init__(self):
        self.base_domain = "https://it.wikisource.org"
        self.index_url = f"{self.base_domain}/wiki/Codice_civile"
        self.documents = []
        self.headers = {'User-Agent': 'PicoClaw/2.0 (Legal AI Ingestion Agent)'}

    def fetch_index_links(self):
        """Trova tutti i link alle sottopagine del codice civile."""
        print(f"[*] Recupero Indice Generale da {self.index_url}...")
        res = requests.get(self.index_url, headers=self.headers)
        if res.status_code != 200:
            print("[X] Errore connessione all'indice.")
            return []
            
        soup = BeautifulSoup(res.text, 'html.parser')
        
        # Filtriamo solo i link che puntano ai capitoli del codice civile
        valid_links = []
        for a in soup.select('.mw-parser-output a'):
            href = a.get('href', '')
            if '/wiki/Codice_civile/' in href and ':' not in href: # Escudiamo pagine speciali di wiki
                valid_links.append(f"{self.base_domain}{href}")
                
        # Rimuoviamo duplicati mantenendo l'ordine
        return list(dict.fromkeys(valid_links))

    def parse_page_and_chunk(self, url: str):
        """Scarica la pagina specifica, ricava il contesto e usa il Semantic Chunker."""
        print(f"  -> Scraping: {url.split('/')[-1]}")
        res = requests.get(url, headers=self.headers)
        if res.status_code != 200:
            print(f"  [X] Errore 404/500: {url}")
            return []
            
        soup = BeautifulSoup(res.text, 'html.parser')
        content_div = soup.find('div', {'class': 'mw-parser-output'})
        if not content_div:
            return []
            
        # Generazione Breadcrumb dal titolo della pagina (es: Titolo_I_-_Delle_persone_fisiche)
        page_title = url.split('/')[-1].replace('_', ' ')
        
        # Pulizia HTML base
        for element in content_div(["script", "style", "table"]):
            element.decompose()
            
        testo_raw = content_div.get_text(separator='\n', strip=True)
        # Pulizia edit note
        testo_raw = re.sub(r'\[.*?\]', '', testo_raw)
        
        # Chunker V2
        chunks = []
        # Divisione basata sulla parola "Art." seguita da numero (es: Art. 1., Art. 2. , Art. 12-bis)
        # La regex tollera lettere come `bis`, `ter` comuni nel codice civile
        articles_raw = re.split(r'(?i)(?:Articolo|Art\.)\s+(\d+[a-zA-Z-]*)\.?', testo_raw)
        
        if len(articles_raw) > 1:
            for i in range(1, len(articles_raw), 2):
                art_num = articles_raw[i]
                art_text = articles_raw[i+1].strip() if i+1 < len(articles_raw) else ""
                
                if len(art_text) > 20: # Evita articoli abrogati composti solo da "(abrogato)"
                    chunks.append({
                        "title": f"Codice Civile - Art. {art_num} ({page_title[:30]}...)",
                        "content": f"Articolo {art_num}.\n{art_text}",
                        "source_url": url,
                        "metadata": {
                            "source": "Codice Civile Italiano",
                            "titolo_legge": "Codice Civile",
                            "sezione": page_title,
                            "tipo": "Articolo",
                            "numero": art_num
                        }
                    })
                    
        return chunks

    def execute_global_ingestion(self, limit_pages=3): # limitato provvisorio per evitare ore di esecuzione ai primi test
        print("[*] Avvio PicoClaw Ingestion: CODICE CIVILE ITALIANO")
        page_links = self.fetch_index_links()
        print(f"[v] Trovati {len(page_links)} Link di Capitoli/Libri/Titoli.")
        
        all_chunks = []
        for url in page_links[:limit_pages]:  # Testing loop su N pagine
            chunks = self.parse_page_and_chunk(url)
            all_chunks.extend(chunks)
            time.sleep(0.5) # Courtesy delay scraping
            
        self.documents = all_chunks
        print(f"\n[v] Scraping Completato. Estratti totali {len(self.documents)} Articoli pronti per l'Embedding.")

    def embed_and_upload(self, batch_size=20):
        if not self.documents:
            print("[!] Nessun documento da backuppare.")
            return

        print(f"[*] Inizio Upload su Supabase con Vettori Gemini 001. Totale elementi: {len(self.documents)}")
        
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
                print(f"[*] Pusho a DB batch di {len(payload_db)} articoli (Progress: {i}/{len(self.documents)})...")
                supabase.table('legal_documents').insert(payload_db).execute()

        print(f"[v] Lavoro terminato con successo! Il RAG ha imparato il Codice Civile.")

if __name__ == "__main__":
    crawler = CivilCodeCrawler()
    # ATTENZIONE: Limitato a 3 pagine indice per testing rapido.
    # Togliere 'limit_pages' per scaricare l'INTERO codice civile da 3000 articoli.
    crawler.execute_global_ingestion(limit_pages=9999)
    crawler.embed_and_upload()
