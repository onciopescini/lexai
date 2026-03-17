import os
import re
import json
import random
import time
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client

load_dotenv()

# --- Configurazione Supabase ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Configurazione Gemini ---
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

MODEL_NAME = "gemini-2.5-flash"

CATEGORIES = [
    "Diritto del Lavoro", "Affitti e Locazioni", "Tutela del Consumatore", 
    "Diritto di Famiglia", "Reati Digitali", "Privacy e GDPR",
    "Multe e Fisco", "E-commerce"
]

def generate_daily_law():
    """Generates a viral social media post about a random legal topic."""
    
    topic = random.choice(CATEGORIES)
    print(f"[{datetime.now().time()}] Generando La Legge del Giorno per: {topic}")
    
    system_instruction = """
    Sei "Atena", un'IA giuridica italiana spietatamente sintetica e carismatica.
    Il tuo compito è creare un post social (Instagram/LinkedIn/Twitter) educativo e virale, chiamato "La Legge del Giorno".
    Devi scegliere una singola legge, un diritto poco conosciuto o un caso frequente pertinente alla categoria fornita.
    
    Formatta il post esattamente così:
    1. Un "HOOK" fortissimo (max 1 riga, accattivante, empatico).
    2. IL PROBLEMA (1 riga che descrive la situazione tipica).
    3. LA REGOLA (Spiegazione semplice a bullet point, con emoji ✅ e ❌).
    4. IL RIFERIMENTO LEGALE (L'articolo di legge esatto, formattato in corsivo giurisprudenziale).
    5. CALL TO ACTION (Breve invito a controllare il proprio caso su lexai.it chiedendo ad Atena).
    
    Usa un tono assertivo, chiaro, divulgativo ma istituzionalmente corretto. Niente disclaimer banali sull'essere un'IA.
    """
    
    prompt = f"Scrivi 'La Legge del Giorno' riguardo al tema: {topic}. Assicurati che sia sorprendente e di immediata utilità pratica."
    
    try:
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            system_instruction=system_instruction
        )
        
        response = model.generate_content(prompt)
        content = response.text
        
        print("\n--- CONTENUTO GENERATO ---")
        print(content)
        print("--------------------------\n")
        
        save_to_database(topic, content)
        
    except Exception as e:
        print(f"Errore durante la generazione: {e}")

def save_to_database(category, content):
    """Saves the generated content to a Supabase table for further processing/publishing."""
    try:
        data = {
            "level": "SUCCESS",
            "agent_name": "Atena Social Bot",
            "message": f"Generato post per social: {category}\n\n{content}",
            "metadata": {
                "type": "social_post",
                "category": category,
                "content": content
            }
        }
        
        response = supabase.table("picoclaw_live_events").insert(data).execute()
        print(f"Contenuto salvato nel database (ID: {response.data[0]['id']}) pronto per l'automazione dei social.")
        
    except Exception as e:
        print(f"Errore durante il salvataggio nel database: {e}")

if __name__ == "__main__":
    print("Avvio Atena Social Bot - Generazione 'La Legge del Giorno'")
    generate_daily_law()
    print("Esecuzione terminata.")
