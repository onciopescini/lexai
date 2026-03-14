import os
import base64
import requests
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Configurazione Ambiente
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    raise ValueError("Missing environment variables. Controlla il .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class MultimodalIngestor:
    def __init__(self):
        self.gemini_generate_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        self.gemini_embed_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"

    def log_event(self, level, message):
        """Invia un evento realtime alla dashboard di supervisione"""
        try:
            supabase.table('picoclaw_live_events').insert([{
                "level": level,
                "message": message,
                "created_at": datetime.utcnow().isoformat()
            }]).execute()
        except:
            pass
        print(f"[{level}] {message}")

    def analyze_multimedia(self, file_path, mime_type):
        self.log_event("INFO", f"Multimodal RAG: Analisi semantica in corso del file '{file_path}' ({mime_type})...")
        
        try:
            with open(file_path, "rb") as f:
                base64_data = base64.b64encode(f.read()).decode("utf-8")
        except Exception as e:
            self.log_event("ERROR", f"Impossibile leggere il file locale: {e}")
            return None

        prompt = (
            "Sei un assistente legale esperto. Analizza questo documento multimediale (audio, video, o immagine "
            "come una visura, una multa, o un diagramma). Estrai una descrizione estremamente dettagliata in italiano, "
            "trascrivendo le parti rilevanti, indicando i soggetti coinvolti e i riferimenti normativi visibili o udibili. "
            "Se è un documento visivo, descrivi la struttura. Il tuo output testuale servirà come 'Base di Conoscenza' "
            "per una ricerca vettoriale successiva."
        )

        headers = {'Content-Type': 'application/json'}
        data = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64_data
                        }
                    }
                ]
            }]
        }

        response = requests.post(self.gemini_generate_url, headers=headers, json=data)
        
        if response.status_code == 200:
            resp_json = response.json()
            try:
                result_text = resp_json['candidates'][0]['content']['parts'][0]['text']
                self.log_event("SUCCESS", "Analisi completata! Trascrizione/Descrizione ottenuta.")
                return result_text
            except Exception as e:
                self.log_event("ERROR", f"Errore parsing risposta Gemini: {e}")
                self.log_event("DEBUG", f"Raw Response: {json.dumps(resp_json, indent=2)}")
                return None
        else:
            self.log_event("ERROR", f"Gemini 2.5 Flash Error: {response.text}")
            return None

    def generate_embedding(self, text):
        headers = {'Content-Type': 'application/json'}
        data = {
            "model": "models/gemini-embedding-001",
            "content": {"parts": [{"text": text}]}
        }
        response = requests.post(self.gemini_embed_url, headers=headers, json=data)
        
        if response.status_code == 200:
            return response.json()['embedding']['values']
        else:
            self.log_event("ERROR", f"Gemini Embedding Error: {response.text}")
            return None

    def ingest_to_database(self, title, textual_description, vector, original_file_name, mime_type):
        payload = {
            "title": title,
            "content": f"[MEDIA: {original_file_name}]\n{textual_description}",
            "source_url": original_file_name, # In un DB vero qui andrebbe l'URL del Bucket S3/Supabase Storage
            "metadata": {
                "source": "Multimodal Upload",
                "file_type": mime_type,
                "original_filename": original_file_name,
                "date_ingested": datetime.utcnow().isoformat()
            },
            "embedding": vector
        }
        
        try:
            supabase.table('legal_documents').insert([payload]).execute()
            self.log_event("SYNC", f"File '{original_file_name}' inserito come vettore semantico!")
        except Exception as e:
            self.log_event("ERROR", f"Errore DB durante l'inserimento: {str(e)}")

    def process_file(self, file_path, title, mime_type):
        self.log_event("INFO", f"=== AWAKE : MULTIMODAL INGESTOR [{title}] ===")
        
        # 1. Analisi file
        description = self.analyze_multimedia(file_path, mime_type)
        if not description: return

        # 2. Vettorizzazione testo estratto
        vector = self.generate_embedding(description)
        if not vector: return

        # 3. Salvataggio Supabase pgvector
        original_name = os.path.basename(file_path)
        self.ingest_to_database(title, description, vector, original_name, mime_type)
        self.log_event("INFO", "=== MULTIMODAL INGESTOR SLEEPING ===")

# Se eseguito direttamente, creiamo un test case
if __name__ == "__main__":
    agent = MultimodalIngestor()
    
    # 1. Scarichiamo l'Immagine finta per testare la Vision
    test_img = "test_visura_finta.jpg"
    if os.path.exists(test_img):
        os.remove(test_img)
    
    # Un'immagine placeholder pubblica di un documento
    url_img = "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000"
    print(f"Download placeholder test image from {url_img} ...")
    r = requests.get(url_img, headers={"User-Agent": "Mozilla/5.0"})
    with open(test_img, "wb") as f:
        f.write(r.content)

    print("\\n[Test] Ingestione Foto Documento Legale (Immagine)")
    agent.process_file(test_img, "Documento Legale Generico", "image/jpeg")
