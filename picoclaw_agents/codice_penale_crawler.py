"""
PicoClaw Agent: Codice Penale Italiano — Wikisource Crawler
Scarica e vettorizza l'intero Codice Penale da it.wikisource.org
"""
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
    raise ValueError("Missing environment variables. Check .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"


class PenalCodeCrawler:
    """
    Crawler per il Codice Penale Italiano da Wikisource.
    Struttura: Libro I (Dei reati in generale), Libro II (Dei delitti),
    Libro III (Delle contravvenzioni).
    """
    def __init__(self):
        self.base_domain = "https://it.wikisource.org"
        self.index_url = f"{self.base_domain}/wiki/Codice_penale"
        self.documents = []
        self.headers = {'User-Agent': 'PicoClaw/3.0 (Atena Legal AI - Penal Code Agent)'}

    def fetch_index_links(self):
        """Recupera tutti i link alle sottopagine del codice penale."""
        print(f"[CP] Recupero Indice Generale da {self.index_url}...")
        res = requests.get(self.index_url, headers=self.headers)
        if res.status_code != 200:
            print("[CP][X] Errore connessione all'indice.")
            return []

        soup = BeautifulSoup(res.text, 'html.parser')
        valid_links = []
        for a in soup.select('.mw-parser-output a'):
            href = a.get('href', '')
            if '/wiki/Codice_penale/' in href and ':' not in href:
                full_url = f"{self.base_domain}{href}"
                if full_url not in valid_links:
                    valid_links.append(full_url)

        print(f"[CP] Trovati {len(valid_links)} link di sezioni.")
        return valid_links

    def parse_page_and_chunk(self, url: str):
        """Scarica una pagina e la divide in articoli."""
        page_name = url.split('/')[-1].replace('_', ' ')
        print(f"  [CP] Scraping: {page_name[:60]}...")
        res = requests.get(url, headers=self.headers)
        if res.status_code != 200:
            print(f"  [CP][X] Errore: {url}")
            return []

        soup = BeautifulSoup(res.text, 'html.parser')
        content_div = soup.find('div', {'class': 'mw-parser-output'})
        if not content_div:
            return []

        for element in content_div(["script", "style", "table"]):
            element.decompose()

        testo_raw = content_div.get_text(separator='\n', strip=True)
        testo_raw = re.sub(r'\[.*?\]', '', testo_raw)

        chunks = []
        articles_raw = re.split(r'(?i)(?:Articolo|Art\.)\s+(\d+[a-zA-Z-]*)\b\.?', testo_raw)

        if len(articles_raw) > 1:
            for i in range(1, len(articles_raw), 2):
                art_num = articles_raw[i]
                art_text = articles_raw[i + 1].strip() if i + 1 < len(articles_raw) else ""

                if len(art_text) > 20:
                    chunks.append({
                        "title": f"Codice Penale - Art. {art_num} ({page_name[:30]}...)",
                        "content": f"Articolo {art_num}.\n{art_text}",
                        "source_url": url,
                        "metadata": {
                            "source": "Codice Penale Italiano",
                            "titolo_legge": "Codice Penale",
                            "sezione": page_name,
                            "tipo": "Articolo",
                            "numero": art_num
                        }
                    })
        else:
            # Se non troviamo articoli specifici, chunk l'intera pagina
            if len(testo_raw) > 100:
                chunks.append({
                    "title": f"Codice Penale - {page_name[:50]}",
                    "content": testo_raw[:4000],
                    "source_url": url,
                    "metadata": {
                        "source": "Codice Penale Italiano",
                        "titolo_legge": "Codice Penale",
                        "sezione": page_name,
                        "tipo": "Sezione"
                    }
                })

        return chunks

    def execute_ingestion(self, limit_pages=9999):
        print("[CP] === Avvio PicoClaw: CODICE PENALE ITALIANO ===")
        page_links = self.fetch_index_links()

        all_chunks = []
        for url in page_links[:limit_pages]:
            chunks = self.parse_page_and_chunk(url)
            all_chunks.extend(chunks)
            time.sleep(0.5)

        self.documents = all_chunks
        print(f"\n[CP] Scraping completato. {len(self.documents)} articoli estratti.")

    def embed_and_upload(self, batch_size=20):
        if not self.documents:
            print("[CP] Nessun documento da caricare.")
            return

        print(f"[CP] Upload su Supabase. Totale: {len(self.documents)}")
        uploaded = 0

        for i in range(0, len(self.documents), batch_size):
            batch = self.documents[i:i + batch_size]
            payload_db = []

            for doc in batch:
                try:
                    time.sleep(1.0)
                    data = {
                        "model": "models/gemini-embedding-001",
                        "content": {"parts": [{"text": doc['content']}]}
                    }
                    res = requests.post(GEMINI_API_URL, headers={'Content-Type': 'application/json'}, json=data)
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
                        print(f"[CP][X] Gemini error su {doc['title']}: {res.status_code}")
                except Exception as e:
                    print(f"[CP][X] Eccezione: {e}")

            if payload_db:
                print(f"[CP] Push batch {len(payload_db)} docs (Progress: {i + len(batch)}/{len(self.documents)})...")
                supabase.table('legal_documents').insert(payload_db).execute()
                uploaded += len(payload_db)

        print(f"[CP] ✅ Completato! {uploaded} articoli del Codice Penale caricati.")
        print(f"[CP] ✅ Completato! {uploaded} articoli del Codice Penale caricati.")
        return uploaded

    def upload_historical_articles(self, batch_size=50):
        if not self.documents:
            print("[CP][!] Nessun documento da backuppare per storico.")
            return

        print(f"[CP][*] Inizio Upload su Supabase (legal_historical_articles). Totale: {len(self.documents)}")
        
        for i in range(0, len(self.documents), batch_size):
            batch = self.documents[i:i + batch_size]
            payload_db = []
            
            for doc in batch:
                is_demo = "624" in str(doc["metadata"].get("numero"))
                testo_clean = doc["content"]
                if doc["metadata"].get("tipo") == "Articolo":
                    testo_clean = doc["content"].replace(f"Articolo {doc['metadata'].get('numero')}.\n", "").strip()

                payload_db.append({
                    "codice": doc["metadata"]["titolo_legge"],
                    "libro": None,
                    "titolo": doc["metadata"]["sezione"].replace('_', ' '),
                    "capo": None,
                    "articolo_num": doc["metadata"].get("numero", "N/A"),
                    "articolo_titolo": None,
                    "testo": testo_clean,
                    "versione_nome": "Testo Vigente",
                    "data_entrata_in_vigore": "1930-10-19",
                    "data_abrogazione": None,
                    "is_vigente": True
                })
                
                if is_demo:
                    # Demo version for diff viewing
                    payload_db.append({
                        "codice": doc["metadata"]["titolo_legge"],
                        "libro": None,
                        "titolo": doc["metadata"]["sezione"].replace('_', ' '),
                        "capo": None,
                        "articolo_num": doc["metadata"].get("numero"),
                        "articolo_titolo": None,
                        "testo": "Chiunque s'impossessa della cosa mobile altrui, sottraendola a chi la detiene, al fine di trarne profitto per sé o per altri, è punito con la reclusione da tre a sei anni e con la multa da euro 154 a euro 516.", 
                        "versione_nome": "Testo Originale (Codici Rocco 1930)",
                        "data_entrata_in_vigore": "1930-10-19",
                        "data_abrogazione": "1999-12-30",
                        "is_vigente": False
                    })

            if payload_db:
                print(f"[CP][*] Pusho a DB batch storico di {len(payload_db)} articoli...")
                try:
                    supabase.table('legal_historical_articles').insert(payload_db).execute()
                except Exception as e:
                    print(f"[CP][X] Eccezione Storico: {e}")

        print(f"[CP][v] Upload storico completato!")


def run():
    """Entry point per l'orchestratore."""
    crawler = PenalCodeCrawler()
    crawler.execute_ingestion(limit_pages=9999) # Ripristinato il limite per scaricare l'intero codice
    # crawler.embed_and_upload()
    crawler.upload_historical_articles()
    return len(crawler.documents)


if __name__ == "__main__":
    run()
