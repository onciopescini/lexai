import os
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
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY, PERPLEXITY_API_KEY]):
    raise ValueError("Missing environment variables. Controlla il .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class PerplexityAgent:
    def __init__(self):
        self.perplexity_url = "https://api.perplexity.ai/chat/completions"
        self.gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"
        
        # Le query cicliche che il bot potrebbe fare ogni giorno
        self.topics = [
            "Sentenze recenti Cassazione in materia condominiale",
            "Novità legislative in materia di diritto del lavoro",
            "Recenti pronunce Cassazione Penale su reati informatici",
            "Diritto di Famiglia: ultime sentenze su mantenimento e divorzio"
        ]

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

    def fetch_jurisprudence(self, topic):
        self.log_event("INFO", f"PerplexityCrawler: Avvio ricerca per '{topic}'...")
        
        prompt = (
            f"Agisci come un analista legale esperto del Diritto Italiano. "
            f"Il tuo compito è fornire una sintesi dettagliata e professionale delle ultime e più rilevanti novità giurisprudenziali o normative riguardanti il seguente argomento: '{topic}'. "
            f"Includi i riferimenti normativi o i numeri delle sentenze (es. Cassazione n. XXXX del YYYY) e spiega in modo chiaro il principio di diritto stabilito. "
            f"Scrivi in modo accademico, senza saluti formali."
        )

        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "sonar",
            "messages": [
                {"role": "system", "content": "Sei un assistente legale specializzato nel Diritto Italiano in tempo reale."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1500,
            "temperature": 0.2
        }

        response = requests.post(self.perplexity_url, headers=headers, json=data)
        
        if response.status_code == 200:
            result_text = response.json()['choices'][0]['message']['content']
            self.log_event("INFO", "PerplexityCrawler: Dati recuperati correttamente. Generazione embeddings in corso...")
            return result_text
        else:
            self.log_event("ERROR", f"Perplexity API Error: {response.text}")
            return None

    def generate_embedding(self, text):
        headers = {'Content-Type': 'application/json'}
        data = {
            "model": "models/gemini-embedding-001",
            "content": {"parts": [{"text": text}]}
        }
        response = requests.post(self.gemini_url, headers=headers, json=data)
        
        if response.status_code == 200:
            return response.json()['embedding']['values']
        else:
            self.log_event("ERROR", f"Gemini Embedding Error: {response.text}")
            return None

    def ingest_to_database(self, title, content, vector, topic):
        payload = {
            "title": title,
            "content": content,
            "source_url": "https://www.perplexity.ai",
            "metadata": {
                "source": "Perplexity Live",
                "is_jurisprudence": True,
                "topic": topic,
                "date_ingested": datetime.utcnow().isoformat()
            },
            "embedding": vector
        }
        
        try:
            supabase.table('legal_documents').insert([payload]).execute()
            self.log_event("SYNC", f"Vettore inserito con successo in Supabase: '{title}'")
        except Exception as e:
            self.log_event("ERROR", f"Errore DB durante l'inserimento: {str(e)}")

    def run_pipeline(self):
        self.log_event("INFO", "=== A W A K E : PERPLEXITY CRAWLER ===")
        # Peschiamo il primo topic come test
        topic = self.topics[0]
        
        content = self.fetch_jurisprudence(topic)
        if not content: return

        vector = self.generate_embedding(content)
        if not vector: return

        title = f"Report Giurisprudenza Live: {topic}"
        self.ingest_to_database(title, content, vector, topic)
        
        self.log_event("INFO", "=== PERPLEXITY CRAWLER SLEEPING ===")

if __name__ == "__main__":
    agent = PerplexityAgent()
    agent.run_pipeline()
