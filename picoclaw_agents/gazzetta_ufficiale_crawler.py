"""
PicoClaw Agent: Gazzetta Ufficiale Italiana — RSS Feed Crawler
Scarica le ultime leggi e decreti pubblicati dalla Gazzetta Ufficiale
tramite i feed RSS pubblici disponibili presso gazzettaufficiale.it
"""
import os
import re
import time
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    raise ValueError("Missing environment variables. Check .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"


class GazzettaCrawler:
    """
    Crawler per la Gazzetta Ufficiale Italiana.
    Usa feed RSS e pagine web pubbliche per scaricare leggi recenti.
    """
    def __init__(self):
        self.documents = []
        self.headers = {'User-Agent': 'PicoClaw/3.0 (Atena Legal AI - Gazzetta Agent)'}
        
        # Feed RSS della Gazzetta Ufficiale (Serie Generale)
        self.rss_feeds = [
            "https://www.gazzettaufficiale.it/rss/SG",  # Serie Generale
        ]
        
        # Fonti alternative: pagine indice delle leggi più cercate su Normattiva
        # (versione pubblica senza necessità IP italiano)
        self.normattiva_laws = [
            # (URL Normattiva / descrizione, titolo)
            ("https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2003-06-30;196", "Codice Privacy (D.Lgs. 196/2003)"),
            ("https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2005-09-07;209", "Codice delle Comunicazioni Elettroniche"),
            ("https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2006-09-12;206", "Codice del Consumo (D.Lgs. 206/2006)"),
            ("https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2010-02-02;104", "Codice del Processo Amministrativo"),
            ("https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2016-04-18;50", "Codice dei Contratti Pubblici (D.Lgs. 50/2016)"),
        ]

    def fetch_rss_items(self):
        """Scarica gli item dal feed RSS della Gazzetta Ufficiale."""
        all_items = []
        for feed_url in self.rss_feeds:
            print(f"[GU] Fetching RSS: {feed_url}")
            try:
                res = requests.get(feed_url, headers=self.headers, timeout=30)
                if res.status_code != 200:
                    print(f"[GU][X] Feed RSS errore {res.status_code}")
                    continue
                    
                soup = BeautifulSoup(res.text, 'xml')
                items = soup.find_all('item')
                
                for item in items:
                    title = item.find('title')
                    link = item.find('link')
                    description = item.find('description')
                    pub_date = item.find('pubDate')
                    
                    if title and description:
                        all_items.append({
                            "title": title.get_text(strip=True),
                            "link": link.get_text(strip=True) if link else "",
                            "description": description.get_text(strip=True),
                            "pub_date": pub_date.get_text(strip=True) if pub_date else ""
                        })
                        
                print(f"[GU] Trovati {len(items)} item nel feed RSS.")
            except Exception as e:
                print(f"[GU][X] Errore RSS: {e}")
        
        return all_items

    def fetch_normattiva_law(self, url: str, title: str):
        """Prova a scaricare una legge da Normattiva (URL pubblico N2Ls)."""
        print(f"[GU] Fetching Normattiva: {title}...")
        try:
            res = requests.get(url, headers=self.headers, timeout=30, allow_redirects=True)
            if res.status_code != 200:
                print(f"[GU][!] Normattiva {res.status_code} per {title}")
                return []
            
            soup = BeautifulSoup(res.text, 'html.parser')
            
            # Normattiva ha varie strutture DOM. Proviamo i selettori più comuni.
            content = soup.find('div', id='testoAtto') or soup.find('div', class_='bodyTesto') or soup.find('body')
            if not content:
                return []
            
            text = content.get_text(separator='\n', strip=True)
            if len(text) < 100:
                return []
            
            # Chunk per articoli
            chunks = []
            articles = re.split(r'(?i)(?:Art\.|Articolo)\s+(\d+[a-zA-Z-]*)\b\.?', text)
            
            if len(articles) > 1:
                for i in range(1, len(articles), 2):
                    art_num = articles[i]
                    art_text = articles[i + 1].strip() if i + 1 < len(articles) else ""
                    if len(art_text) > 30:
                        chunks.append({
                            "title": f"{title} - Art. {art_num}",
                            "content": f"{title} | Articolo {art_num}.\n{art_text[:5000]}",
                            "source_url": url,
                            "metadata": {
                                "source": "Gazzetta Ufficiale / Normattiva",
                                "titolo_legge": title,
                                "tipo": "Articolo",
                                "numero": art_num
                            }
                        })
            else:
                # Chunk l'intero testo in blocchi di 3000 chars
                for j in range(0, len(text), 3000):
                    block = text[j:j + 3000]
                    if len(block) > 100:
                        chunks.append({
                            "title": f"{title} - Parte {j // 3000 + 1}",
                            "content": block,
                            "source_url": url,
                            "metadata": {
                                "source": "Gazzetta Ufficiale / Normattiva",
                                "titolo_legge": title,
                                "tipo": "Sezione"
                            }
                        })
            
            return chunks
        except Exception as e:
            print(f"[GU][X] Errore Normattiva: {e}")
            return []

    def execute_ingestion(self):
        print("[GU] === Avvio PicoClaw: GAZZETTA UFFICIALE & NORMATTIVA ===")
        all_chunks = []
        
        # 1. RSS Feed
        rss_items = self.fetch_rss_items()
        for item in rss_items:
            desc = item['description']
            if len(desc) > 50:
                all_chunks.append({
                    "title": f"GU: {item['title'][:60]}",
                    "content": f"{item['title']}\n\n{desc}",
                    "source_url": item.get('link', 'https://www.gazzettaufficiale.it'),
                    "metadata": {
                        "source": "Gazzetta Ufficiale",
                        "tipo": "Pubblicazione",
                        "data": item.get('pub_date', '')
                    }
                })
        
        # 2. Leggi specifiche da Normattiva
        for url, title in self.normattiva_laws:
            chunks = self.fetch_normattiva_law(url, title)
            all_chunks.extend(chunks)
            time.sleep(1.0)
        
        self.documents = all_chunks
        print(f"\n[GU] Totale documenti estratti: {len(self.documents)}")

    def embed_and_upload(self, batch_size=20):
        if not self.documents:
            print("[GU] Nessun documento da caricare.")
            return

        print(f"[GU] Upload su Supabase. Totale: {len(self.documents)}")
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
                        print(f"[GU][X] Gemini error: {res.status_code}")
                except Exception as e:
                    print(f"[GU][X] Eccezione: {e}")

            if payload_db:
                print(f"[GU] Push batch {len(payload_db)} docs (Progress: {i + len(batch)}/{len(self.documents)})...")
                supabase.table('legal_documents').insert(payload_db).execute()
                uploaded += len(payload_db)

        print(f"[GU] ✅ Completato! {uploaded} documenti caricati.")
        return uploaded


def run():
    """Entry point per l'orchestratore."""
    crawler = GazzettaCrawler()
    crawler.execute_ingestion()
    crawler.embed_and_upload()
    return len(crawler.documents)


if __name__ == "__main__":
    run()
