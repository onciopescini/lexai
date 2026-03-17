import os
import requests
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, PERPLEXITY_API_KEY, GEMINI_API_KEY]):
    raise ValueError("Missing environment variables. Check .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

class GuardianHarvester:
    """
    Atena Guardian (Campagna 1):
    Cerca le ultime novità legislative via Perplexity Sonar.
    Sintetizza i risultati con Gemini Flash e li inserisce in Supabase.
    """
    
    def fetch_legal_news(self):
        print("[*] Interrogando Perplexity Sonar per le ultime leggi italiane...")
        
        url = "https://api.perplexity.ai/chat/completions"
        payload = {
            "model": "sonar",
            "messages": [
                {
                    "role": "system",
                    "content": "Sei un analista legale. Cerca esclusivamente novità legislative italiane degli ultimi 7 giorni (leggi, decreti, circolari, sentenze Cassazione rilevanti). Elencale in modo fattuale."
                },
                {
                    "role": "user",
                    "content": "Quali sono le novità legislative, decreti legge, bonus o sentenze importanti uscite in Italia nell'ultima settimana? Fornisci fonti se possibile."
                }
            ],
            "temperature": 0.2
        }
        headers = {
            "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            news_text = response.json()["choices"][0]["message"]["content"]
            citations = response.json().get("citations", [])
            print(f"[v] Trovate novità da Perplexity ({len(citations)} fonti citate)")
            return news_text, citations
        except Exception as e:
            print(f"[X] Errore Perplexity: {e}")
            return None, []

    def synthesize_alerts(self, raw_news, citations):
        print("[*] Gemini Flash in azione per distillare gli alert in formato JSON...")

        prompt = f"""
Sei Atena, l'IA Legale Suprema.
Ecco un riassunto delle ultime novità legali in Italia (tratto dal web):

NEWS:
{raw_news}

FONTi CITATE:
{citations}

Il tuo compito è analizzare queste novità e dividerle in singoli "Alert".
Restituisci ESCLUSIVAMENTE un JSON array valido. 
Ogni oggetto JSON deve avere il seguente formato esatto (non aggiungere Markdown o backtick attorno all'output, voglio solo l'array JSON puro):
[
  {{
    "title": "Titolo breve e accattivante della novità (max 60 char)",
    "summary": "Riassunto pratico: cosa cambia? (2-3 frasi)",
    "impact_level": "High", "Medium", o "Low",
    "target_audience": "A chi si rivolge? Es. 'Aziende E-commerce', 'Lavoratori', 'Tutti i cittadini'",
    "source_url": "La URL della fonte (scegli una delle FONTi CITATE in alto se pertinente, altrimenti stringa vuota)"
  }}
]
"""
        
        payload = {
            "contents": [{"parts":[{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1}
        }
        
        try:
            res = requests.post(GEMINI_API_URL, headers={'Content-Type': 'application/json'}, json=payload)
            res.raise_for_status()
            
            # Extract JSON from Gemini
            response_text = res.json()['candidates'][0]['content']['parts'][0]['text']
            
            # Clean possible markdown formatting
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            if response_text.startswith("```"):
                response_text = response_text[3:]
                
            response_text = response_text.strip()
            
            alerts = json.loads(response_text)
            print(f"[v] Gemini ha estratto {len(alerts)} Alert strutturati.")
            return alerts
            
        except Exception as e:
            print(f"[X] Errore Sintesi Gemini: {e}")
            if 'res' in locals():
               print(f"Response: {res.text}")
            return []

    def upload_to_supabase(self, alerts):
        if not alerts:
            print("[!] Nessun alert da inserire in Supabase.")
            return
            
        print(f"[*] Inserimento {len(alerts)} Alert nel Database (atena_guardian_alerts)...")
        # Ensure correct date format
        today = datetime.now().strftime('%Y-%m-%d')
        
        for a in alerts:
            a['date_published'] = today
            # clean missing fields just in case
            if 'source_url' not in a or not a['source_url']:
                a['source_url'] = "https://gazzettaufficiale.it"
                
        try:
            supabase.table('atena_guardian_alerts').insert(alerts).execute()
            print("[v] Guardian aggiornato con successo!")
        except Exception as e:
            print(f"[X] Errore Inserimento Database: {e}")

    def run(self):
        raw_news, citations = self.fetch_legal_news()
        if raw_news:
            alerts = self.synthesize_alerts(raw_news, citations)
            self.upload_to_supabase(alerts)

if __name__ == "__main__":
    guardian = GuardianHarvester()
    guardian.run()
