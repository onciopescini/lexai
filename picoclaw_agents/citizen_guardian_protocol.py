import os
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('models/gemini-2.5-pro')

def trigger_citizen_protection_alert(legal_news_text: str):
    print(f"====== [PicoClaw Guardian] CITIZEN PROTECTION PROTOCOL ======")
    print(f"[*] Analisi Emendamento/Legge Recente: '{legal_news_text[:50]}...'")
    
    try:
        # Analisi se rappresenta una trappola o urgenza
        analysis_prompt = f"""
        Analizza la seguente novità legislativa o notizia giuridica:
        "{legal_news_text}"
        
        Rappresenta un potenziale rischio, una "trappola nascosta", o un'urgenza critica per i cittadini comuni / consumatori? 
        Se SI, rispondi con un breve script di allerta (max 150 parole) che spieghi in modo chiarissimo e allarmistico (ma oggettivo) 
        come difendersi o cosa fare. 
        Se NO, rispondi solo "SAFE".
        
        IMPORTANTE: Se rispondi con lo script, la prima riga deve ESSERE ESATTAMENTE: 
        "TITOLO: ⚠️ ALERT: [Il Tuo Titolo Breve]"
        """
        
        print("[*] Interrogazione Gemini 2.5 Pro per Risk Assessment...")
        res = model.generate_content(analysis_prompt)
        testo = res.text.strip()
        
        if "SAFE" in testo.upper() and len(testo) < 20:
            print("[v] Nessuna minaccia per i cittadini rilevata in questa norma.")
            return

        print("[!] MINACCIA RILEVATA. Generazione Alert Civico in corso...")
        
        # Parsiamo il titolo e il contenuto
        title = "⚠️ ALERT: Rischio Normativo Sconosciuto"
        content = testo
        
        lines = testo.split('\n')
        if len(lines) > 0 and lines[0].upper().startswith("TITOLO:"):
             title = lines[0][7:].strip()
             content = "\n".join(lines[1:]).strip()
             
        # Generiamo il prompt immagine
        image_prompt_req = f"""
        Prendi questo testo di allerta massima: "{content}"
        Scrivi un prompt in INGLESE (max 40 parole), stile "3D render, highly detailed, dark red lighting, cyber threat, glowing danger signs, professional", 
        per generare un'immagine di copertina per questo alert legale. Non includere testo nell'immagine.
        """
        print("[*] Generazione Image Prompt Red-Code...")
        img_res = model.generate_content(image_prompt_req)
        image_prompt = img_res.text.strip()

        # Salviamo nel DB
        lesson_data = {
            "trend_topic": "🚨 CONSUMER PROTECTION ALERT",
            "lesson_title": title,
            "content_script": content,
            "image_prompt": image_prompt
        }
        db_res = supabase.table('civic_lessons').insert(lesson_data).execute()
        
        print(f"[v] ALERT DIRAMATO CON SUCCESSO SULLA RETE LEXAI. ID: {db_res.data[0]['id']}")

    except Exception as e:
        print(f"[X] Errore critico nel protocollo di protezione: {e}")

if __name__ == "__main__":
    # Mocking a treacherous new law that PicoClaw supposedly found on Gazzetta Ufficiale
    mock_law_update = "Decreto Legge n.45/2026: I consumatori hanno solo 3 giorni di tempo dalla ricezione della bolletta del gas per contestare importi anomali. Superati i 3 giorni, scatta l'obbligo di pagamento immediato con penale del 20% e prelievo forzoso sul conto corrente."
    
    trigger_citizen_protection_alert(mock_law_update)
