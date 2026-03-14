import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class CivicEducationPipeline:
    """
    Fase 7: Piattaforma di Educazione Civica Autonoma.
    Questo Agent Supervisor monitora le query legali in tempo reale e 
    genera automaticamente micro-lezioni video (Script + Avatar)
    quando individua trend o emergenze legislative.
    """
    def __init__(self):
        self.trend_threshold = 100 # Minimo di query simili per triggerare un video
        self.active_alerts = []

    def analyze_global_search_trends(self):
        print("====== [Guardian Agent] Analisi Trend Civici ======")
        print("[*] Connessione a Supabase Analytics Log...")
        try:
            # 1. Recupera le query dalla tabella user_queries (ultime 100)
            response = supabase.table('user_queries').select('query').order('created_at', desc=True).limit(100).execute()
            queries = [row['query'] for row in response.data]
            
            if not queries:
                 print("[-] Nessuna query recente trovata.")
                 return []
            
            print(f"[+] Recuperate {len(queries)} query recenti.")
            
            # 2. Usa Gemini Pro per trovare trend. (In un sistema reale, faremmo clustering algoritmico)
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('models/gemini-2.5-pro')
            
            prompt = f"""Analizza le seguenti query di ricerca legali fatte dai cittadini. 
            Identifica 1 singolo macro-tema o "trend" di importanza pubblica o sociale che emerge da queste domande.
            Restituisci SOLO il titolo del trend. Se le query sono troppo variegate e non c'è un trend evidente, restituisci "Nessun Trend Rilevante".
            Query:
            {queries}
            """
            
            ai_response = model.generate_content(prompt)
            trend = ai_response.text.strip()
            
            if "Nessun Trend" not in trend:
                 print(f"[v] Trend Rilevato dall'AI Giuridica: '{trend}'.")
                 return [trend]
            else:
                 print("[-] Nessun trend dominante rilevato al momento.")
                 return []
                 
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[!] Errore durante l'analisi dei trend: {e}")
            return []

    def generate_video_lesson(self, topic: str):
        print(f"[*] Avvio Generative Video Pipeline per il filone: '{topic}'")
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('models/gemini-2.5-pro')
            
            # 1. Script Generation
            script_prompt = f"""
            Crea una micro-lezione di educazione civica (max 150-200 parole) sul tema legale: "{topic}".
            Lo stile deve essere divulgativo, chiaro, imparziale, adatto ai cittadini per spiegare i loro diritti (stile reel Instagram/TikTok).
            Inizia la prima riga ESATTAMENTE con: "TITOLO: " seguito da un titolo accattivante e chiaro.
            Dalla seconda riga in poi scrivi lo script della lezione.
            Usa paragrafi brevi e bullet point se necessario.
            """
            
            print("[*] Generazione script legale con Gemini 2.5 Pro...")
            script_res = model.generate_content(script_prompt)
            full_text = script_res.text.strip()
            
            title = "Micro-Lezione Legale"
            content = full_text
            
            lines = full_text.split('\n')
            if len(lines) > 0 and lines[0].upper().startswith("TITOLO:"):
                title = lines[0][7:].strip()
                content = "\n".join(lines[1:]).strip()
            
            # 2. Image Prompt Generation
            image_prompt_req = f"""
            Prendi questo testo: "{content}"
            Scrivi un prompt in INGLESE (max 40 parole), stile "3D render, highly detailed, neon lights, clear, professional", 
            per generare un'immagine di copertina per questo reels legale. Non includere testo nell'immagine.
            """
            print("[*] Generazione Image Prompt...")
            image_res = model.generate_content(image_prompt_req)
            image_prompt = image_res.text.strip()
            
            # 3. Store in Supabase
            print("[*] Salvataggio della lezione nel database 'civic_lessons'...")
            lesson_data = {
                "trend_topic": topic,
                "lesson_title": title,
                "content_script": content,
                "image_prompt": image_prompt
            }
            res = supabase.table('civic_lessons').insert(lesson_data).execute()
            
            if len(res.data) > 0:
                print(f"[v] Lezione '{title}' salvata con successo. ID: {res.data[0]['id']}")
            else:
                print("[-] Salvataggio fallito o nessun dato ritornato.")
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[!] Errore durante la generazione della lezione video: {e}")

    def run_guardian_protocol(self):
        """Metodo principale da agganciare a un cronjob (es. ogni mezzanotte)."""
        trends = self.analyze_global_search_trends()
        for trend in trends:
            self.generate_video_lesson(trend)
            time.sleep(2)
        print("[v] Guardian Protocol completato. Cittadini protetti e informati.")

if __name__ == "__main__":
    pipeline = CivicEducationPipeline()
    pipeline.run_guardian_protocol()
