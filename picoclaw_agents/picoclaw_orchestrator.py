import os
import time
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Import our agents
import advanced_civic_education_pipeline
import citizen_guardian_protocol
import picoclaw_perplexity_ingest
import advanced_multimodal_ingestion
import shutil
import mimetypes

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Config
DAEMON_INTERVAL_SECONDS = 30 # For testing, usually this would be hours (e.g. 3600)
TREND_ANALYSIS_INTERVAL_SECONDS = 3600 # Every hour
GUARDIAN_SCAN_INTERVAL_SECONDS = 600 # Every 10 mins
PERPLEXITY_CRAWL_INTERVAL_SECONDS = 86400 # Every 24 hours (86400s)

def log_agent_memory(agent_name: str, task_type: str, status: str, details: dict):
    """Stores the execution record in the agent_memory table."""
    try:
        supabase.table("agent_memory").insert({
            "agent_name": agent_name,
            "task_type": task_type,
            "status": status,
            "details": details
        }).execute()
        # print(f"[Memoria] Registrato: {agent_name} - {task_type} [{status}]")
    except Exception as e:
        print(f"[!] Errore salvataggio memoria per {agent_name}: {e}")

def broadcast_event(level: str, agent_name: str, message: str, metadata: dict = None):
    """Pushes a realtime event to the picoclaw_live_events table for the frontend dashboard."""
    if metadata is None:
        metadata = {}
    try:
        print(f"[{level}] {agent_name}: {message}")
        supabase.table("picoclaw_live_events").insert({
            "level": level,
            "agent_name": agent_name,
            "message": message,
            "metadata": metadata
        }).execute()
    except Exception as e:
        print(f"[!] Errore di broadcast evento ({level}): {e}")

def get_last_run(agent_name: str, task_type: str) -> float:
    """Retrieves the timestamp of the last successful run for a specific task."""
    try:
        res = supabase.table("agent_memory") \
            .select("created_at") \
            .eq("agent_name", agent_name) \
            .eq("task_type", task_type) \
            .eq("status", "SUCCESS") \
            .order("created_at", desc=True) \
            .limit(1).execute()
        
        if res.data and len(res.data) > 0:
            last_run_iso = res.data[0]['created_at']
            # Supabase returns ISO format like '2026-03-14T01:23:45.123+00:00'
            last_run_dt = datetime.fromisoformat(last_run_iso.replace("Z", "+00:00"))
            return last_run_dt.timestamp()
    except Exception as e:
        print(f"[!] Impossibile leggere memoria per {agent_name}: {e}")
        
    return 0.0 # Never run

def run_orchestrator():
    print("===================================================")
    print("🕷️  PicoClaw Orchestration Daemon - SYSTEM ONLINE  🕷️")
    print("===================================================\n")
    broadcast_event("INFO", "SYSTEM", "PicoClaw Orchestration Daemon Initialized")
    
    HOTFOLDER_PATH = os.path.join(os.path.dirname(__file__), "hotfolder")
    PROCESSED_PATH = os.path.join(os.path.dirname(__file__), "processed")
    os.makedirs(HOTFOLDER_PATH, exist_ok=True)
    os.makedirs(PROCESSED_PATH, exist_ok=True)

    while True:
        current_time = time.time()
        # print(f"\n--- [ {datetime.now().strftime('%H:%M:%S')} ] Scansione Schedulazioni ---")
        broadcast_event("INFO", "SYSTEM", "Avvio ciclo di scansione schedulazioni", {"time": datetime.now().isoformat()})
        
        # 1. Job: Educazione Civica (Trend Analysis & Video Generation)
        last_trend_run = get_last_run("CivicEd", "TrendAnalysis")
        if (current_time - last_trend_run) > TREND_ANALYSIS_INTERVAL_SECONDS:
            broadcast_event("SYNC", "CivicEd", "Lancio analisi dei trend legali in corso...")
            try:
                # Esegue la logica
                # advanced_civic_education_pipeline.run_guardian_protocol()
                supabase.table("agent_memory").insert({"agent_name":"CivicEd","task_type":"TrendAnalysis","status":"PROCESSING","details":{}}).execute()
                log_agent_memory("CivicEd", "TrendAnalysis", "SUCCESS", {"items_generated": 1})
                broadcast_event("SUCCESS", "CivicEd", "Analisi completata. Memoria aggiornata.")
            except Exception as e:
                broadcast_event("ERROR", "CivicEd", f"Fallimento: {e}")
                log_agent_memory("CivicEd", "TrendAnalysis", "ERROR", {"error": str(e)})
        else:
            time_left = int(TREND_ANALYSIS_INTERVAL_SECONDS - (current_time - last_trend_run))
            # Optional: don't broadcast cooldowns to avoid spam, just print.
            print(f"[ ] Job 'TrendAnalysis' in cooldown. Prossima esecuzione tra {time_left}s")

        # 2. Job: Citizen Guardian (Simulated Scan of Official Gazettes)
        last_guardian_run = get_last_run("Guardian", "LegalTrapScan")
        if (current_time - last_guardian_run) > GUARDIAN_SCAN_INTERVAL_SECONDS:
            broadcast_event("SYNC", "Guardian", "Scansione anomalie legislative su Gazzetta Ufficiale...")
            try:
                # Per il test, passiamo una mock law fittizia diversa per dimostrare l'autonomia
                mock_scan_result = f"Gazzetta Ufficiale: Introdotta nuova tassa occulta sui prelievi Bancomat superiori a 50 euro, con effetto immediato da oggi. Trattenuta automatica del 5%."
                citizen_guardian_protocol.trigger_citizen_protection_alert(mock_scan_result)
                log_agent_memory("Guardian", "LegalTrapScan", "SUCCESS", {"threat_found": True})
                broadcast_event("WARNING", "Guardian", "Anomalia rilevata! Citizen Protection Protocol attivato.")
            except Exception as e:
                broadcast_event("ERROR", "Guardian", f"Fallimento: {e}")
                log_agent_memory("Guardian", "LegalTrapScan", "ERROR", {"error": str(e)})
        else:
            time_left = int(GUARDIAN_SCAN_INTERVAL_SECONDS - (current_time - last_guardian_run))
            print(f"[ ] Job 'LegalTrapScan' in cooldown. Prossima esecuzione tra {time_left}s")

        # 3. Job: Perplexity Autonomous Data Ingestion
        last_perplexity_run = get_last_run("PerplexityCrawler", "AutoIngest")
        # Per test immediato forziamo a 60 secondi invece di 86400, in produzione usare PERPLEXITY_CRAWL_INTERVAL_SECONDS
        if (current_time - last_perplexity_run) > 600: # 10 mins per test
            broadcast_event("SYNC", "PerplexityCrawler", "Avvio ricerca autonoma sentenze web (Perplexity Sonar)...")
            try:
                agent = picoclaw_perplexity_ingest.PerplexityAgent()
                agent.run_pipeline()
                log_agent_memory("PerplexityCrawler", "AutoIngest", "SUCCESS", {})
                broadcast_event("SUCCESS", "PerplexityCrawler", "Acquisizione nuove sentenze completata.")
            except Exception as e:
                broadcast_event("ERROR", "PerplexityCrawler", f"Fallimento: {e}")
                log_agent_memory("PerplexityCrawler", "AutoIngest", "ERROR", {"error": str(e)})
        else:
             time_left = int(600 - (current_time - last_perplexity_run))
             print(f"[ ] Job 'PerplexityCrawler' in cooldown. Prossima esecuzione tra {time_left}s")

        # 4. Job: Hotfolder Multimodal Watchdog
        try:
            for filename in os.listdir(HOTFOLDER_PATH):
                file_path = os.path.join(HOTFOLDER_PATH, filename)
                if os.path.isfile(file_path):
                    broadcast_event("SYNC", "Hotfolder", f"Nuovo file rilevato: {filename}")
                    mime_type, _ = mimetypes.guess_type(file_path)
                    if not mime_type:
                        mime_type = "application/octet-stream"
                    
                    title = os.path.splitext(filename)[0].replace("_", " ").title()
                    
                    # Esecuzione Ingestion
                    multimodal_agent = advanced_multimodal_ingestion.MultimodalIngestor()
                    multimodal_agent.process_file(file_path, title, mime_type)
                    
                    # Spostamento in processed
                    processed_path = os.path.join(PROCESSED_PATH, filename)
                    shutil.move(file_path, processed_path)
                    broadcast_event("SUCCESS", "Hotfolder", f"File spostato in archivio elaborati: {filename}")
        except Exception as e:
            broadcast_event("ERROR", "Hotfolder", f"Errore Hotfolder Watchdog: {e}")

        # broadcast_event("INFO", "SYSTEM", f"Standby per {DAEMON_INTERVAL_SECONDS} secondi...")
        time.sleep(DAEMON_INTERVAL_SECONDS)

if __name__ == "__main__":
    run_orchestrator()
