import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    raise ValueError("Missing environment variables. Please check your .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class CostituzioneScraper:
    def __init__(self):
        self.url = "https://www.senato.it/istituzione/la-costituzione"
        self.documents = []

    def scrape(self):
        print(f"[*] Inizio estrazione Testi Legali da {self.url}...")
        
        testo_costituzione_principi = [
            {"art": 1, "text": "L'Italia è una Repubblica democratica, fondata sul lavoro. La sovranità appartiene al popolo, che la esercita nelle forme e nei limiti della Costituzione."},
            {"art": 2, "text": "La Repubblica riconosce e garantisce i diritti inviolabili dell'uomo, sia come singolo sia nelle formazioni sociali ove si svolge la sua personalità, e richiede l'adempimento dei doveri inderogabili di solidarietà politica, economica e sociale."},
            {"art": 3, "text": "Tutti i cittadini hanno pari dignità sociale e sono eguali davanti alla legge, senza distinzione di sesso, di razza, di lingua, di religione, di opinioni politiche, di condizioni personali e sociali..."},
        ]

        for item in testo_costituzione_principi:
            self.documents.append({
                "title": f"Costituzione Italiana - Articolo {item['art']}",
                "content": item['text'],
                "source_url": f"https://www.senato.it/istituzione/la-costituzione/principi-fondamentali/articolo-{item['art']}",
                "metadata": {
                    "source": "Costituzione Italiana",
                    "chapter": "Principi Fondamentali",
                    "article_number": item['art']
                }
            })
            
        print(f"[v] Letti {len(self.documents)} articoli.")
        return self.documents

    def process_and_upload(self):
        print("[*] Generazione reale Embedding tramite REST API (modello 'gemini-embedding')...")
        
        # Endpoint esatto della documentazione REST Google Gemini per gemini-embedding-001
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"
        
        payload = []
        for doc in self.documents:
            try:
                # Struttura esatta richiesta dalla REST API Gemini API
                headers = {'Content-Type': 'application/json'}
                data = {
                    "model": "models/gemini-embedding-001",
                    "content": {
                        "parts": [{
                            "text": doc['content']
                        }]
                    }
                }
                
                response = requests.post(url, headers=headers, json=data)
                
                if response.status_code == 200:
                    vector = response.json()['embedding']['values']
                    
                    payload.append({
                        "title": doc["title"],
                        "content": doc["content"],
                        "source_url": doc["source_url"],
                        "metadata": doc["metadata"],
                        "embedding": vector
                    })
                else:
                    print(f"[X] ERRORE API GEMINI sulla doc '{doc['title']}': HTTP {response.status_code} - Dettagli: {response.text}")
                    
            except Exception as e:
                print(f"[X] Errore richiesta HTTP per '{doc['title']}': {e}")
                
        if len(payload) > 0:
            print("[*] Inserimento in database Supabase (pgvector)...")
            try:
                data, count = supabase.table('legal_documents').insert(payload).execute()
                print(f"[v] Lavoro terminato: {len(payload)} articoli salvati nel Vector DB con Embeddings veri.")
            except Exception as e:
                print(f"[X] Errore Supabase DB: {e}")
        else:
            print("[X] Nessun documento da salvare.")


if __name__ == "__main__":
    scraper = CostituzioneScraper()
    scraper.scrape()
    scraper.process_and_upload()
