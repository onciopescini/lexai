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
    Implementa un Chunker gerarchico ricorsivo per non sforare i limiti semantici di Embedding.
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
        
        # Chunker V2 - Split ad articoli base
        chunks = []
        # Divisione basata sulla parola "Art." seguita da numero (es: Art. 1., Art. 2. , Art. 12-bis)
        # La regex tollera lettere come `bis`, `ter` comuni nel codice civile
        articles_raw = re.split(r'(?i)(?:Articolo|Art\.)\s+(\d+[a-zA-Z-]*)\.?', testo_raw)
        
        if len(articles_raw) > 1:
            for i in range(1, len(articles_raw), 2):
                art_num = articles_raw[i]
                art_text = articles_raw[i+1].strip() if i+1 < len(articles_raw) else ""
                
                if len(art_text) > 20: # Evita articoli abrogati composti solo da "(abrogato)"
                    base_metadata = {
                        "source": "Codice Civile Italiano",
                        "titolo_legge": "Codice Civile",
                        "sezione": page_title,
                        "tipo": "Articolo",
                        "numero": art_num
                    }
                    
                    full_content = f"Articolo {art_num}.\n{art_text}"
                    
                    # Se il testo è troppo lungo, lo spezziamo in chunk semantici
                    if len(full_content) > 800:
                        split_texts = self._recursive_text_split(art_text, chunk_size=800, chunk_overlap=100)
                        for idx, split_part in enumerate(split_texts):
                            chunks.append({
                                "title": f"Codice Civile - Art. {art_num} ({page_title[:30]}...) [Parte {idx+1}]",
                                "content": f"Articolo {art_num}. [Continua]\n{split_part.strip()}",
                                "source_url": url,
                                "metadata": base_metadata
                            })
                    else:
                        chunks.append({
                            "title": f"Codice Civile - Art. {art_num} ({page_title[:30]}...)",
                            "content": full_content,
                            "source_url": url,
                            "metadata": base_metadata
                        })
                    
        return chunks

    def _recursive_text_split(self, text, chunk_size=800, chunk_overlap=100) -> list:
        """
        Splitta il testo ricorsivamente in base a separatori via via più fini,
        cercando di rispettare il limite di chunk_size con un chunk_overlap.
        """
        separators = ["\n\n", "\n", ". ", ", ", " "]
        
        # Helper interno ricorsivo
        def split_text(txt, sep_index):
            if len(txt) <= chunk_size or sep_index >= len(separators):
                return [txt] if txt.strip() else []
                
            separator = separators[sep_index]
            splits = txt.split(separator)
            
            final_chunks = []
            current_chunk = ""
            
            for part in splits:
                if not part.strip():
                    continue
                    
                # Se è la prima aggiunta al chunk
                if not current_chunk:
                    current_chunk = part
                # Se aggiungendo questa parte stiamo sotto il limite
                elif len(current_chunk + separator + part) <= chunk_size:
                    current_chunk += separator + part
                # Se superiamo il limite e il current_chunk non è vuoto
                else:
                    final_chunks.append(current_chunk.strip())
                    
                    # Inizia un nuovo chunk considerando l'overlap
                    # Prendiamo gli ultimi 'chunk_overlap' caratteri del pezzo precedente
                    # ma cerchiamo di non troncare parole a metà se possibile (rozzo ma veloce)
                    overlap_start = max(0, len(current_chunk) - chunk_overlap)
                    prev_overlap = current_chunk[overlap_start:]
                    current_chunk = prev_overlap + separator + part if prev_overlap else part
            
            if current_chunk:
                final_chunks.append(current_chunk.strip())
                
            # Controllo di sicurezza: se qualche chunk è ancora troppo lungo, ri-split al livello successivo
            validated_chunks = []
            for c in final_chunks:
                if len(c) > chunk_size and sep_index + 1 < len(separators):
                    validated_chunks.extend(split_text(c, sep_index + 1))
                else:
                    validated_chunks.append(c)
                    
            return validated_chunks

        return split_text(text, 0)


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

    def upload_historical_articles(self, batch_size=50):
        if not self.documents:
            print("[!] Nessun documento da backuppare per storico.")
            return

        print(f"[*] Inizio Upload su Supabase (legal_historical_articles). Totale: {len(self.documents)}")
        
        for i in range(0, len(self.documents), batch_size):
            batch = self.documents[i:i + batch_size]
            payload_db = []
            
            for doc in batch:
                is_demo = "2086" in str(doc["metadata"].get("numero"))
                
                payload_db.append({
                    "codice": doc["metadata"]["titolo_legge"],
                    "libro": "Libro V - Del Lavoro" if is_demo else None, 
                    "titolo": doc["metadata"]["sezione"].replace('_', ' '),
                    "capo": None,
                    "articolo_num": doc["metadata"]["numero"],
                    "articolo_titolo": None,
                    "testo": doc["content"].replace(f"Articolo {doc['metadata'].get('numero')}.\n", "").strip(),
                    "versione_nome": "Aggiornato (D.Lgs. 14/2019)" if is_demo else "Testo Vigente",
                    "data_entrata_in_vigore": "2019-03-16" if is_demo else "1942-04-19",
                    "data_abrogazione": None,
                    "is_vigente": True
                })
                
                if is_demo:
                    # Demo version for diff viewing
                    payload_db.append({
                        "codice": doc["metadata"]["titolo_legge"],
                        "libro": "Libro V - Del Lavoro", 
                        "titolo": doc["metadata"]["sezione"].replace('_', ' '),
                        "capo": None,
                        "articolo_num": doc["metadata"]["numero"],
                        "articolo_titolo": None,
                        "testo": "L'imprenditore è il capo dell'impresa e da lui dipendono gerarchicamente i suoi collaboratori.", 
                        "versione_nome": "Testo Originale (Codice Civile 1942)",
                        "data_entrata_in_vigore": "1942-04-19",
                        "data_abrogazione": "2019-03-15",
                        "is_vigente": False
                    })

            if payload_db:
                print(f"[*] Pusho a DB batch storico di {len(payload_db)} articoli...")
                try:
                    supabase.table('legal_historical_articles').insert(payload_db).execute()
                except Exception as e:
                    print(f"[X] Eccezione Storico: {e}")

        print(f"[v] Upload storico completato!")

if __name__ == "__main__":
    crawler = CivilCodeCrawler()
    # ATTENZIONE: Limitato a 3 pagine indice per testing rapido.
    # Togliere 'limit_pages' per scaricare l'INTERO codice civile da 3000 articoli.
    crawler.execute_global_ingestion(limit_pages=9999) # Ripristinato il limite per scaricare l'intero codice
    crawler.embed_and_upload() # Upload RAG 768d ricostruito
    crawler.upload_historical_articles()
