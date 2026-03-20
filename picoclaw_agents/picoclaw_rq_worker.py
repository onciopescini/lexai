import os
from redis import Redis
from rq import Worker, Queue, Connection
from dotenv import load_dotenv

# Load all agents to ensure tasks can be deserialized properly by RQ
import advanced_civic_education_pipeline
import citizen_guardian_protocol
import picoclaw_perplexity_ingest
import advanced_multimodal_ingestion

load_dotenv()

listen = ['atena_tasks']

if __name__ == '__main__':
    redis_url = os.getenv("REDIS_URL") or os.getenv("UPSTASH_REDIS_URL")
    
    if not redis_url:
        print("[System] REDIS_URL o UPSTASH_REDIS_URL non trovato in .env")
        print("[System] Il worker RQ necessita di un server Redis per funzionare.")
        print("[System] Se non usi Redis, puoi avviare picoclaw_orchestrator.py in modalità sincrona standalone.")
        exit(1)
        
    print("===================================================")
    print("🕷️  PicoClaw RQ Worker - SYSTEM ONLINE  🕷️")
    print("===================================================\n")
    print(f"[*] In ascolto sulle code: {', '.join(listen)}")
    print(f"[*] Connesso a Redis...")
    
    try:
        redis_conn = Redis.from_url(redis_url)
        with Connection(redis_conn):
            worker = Worker(map(Queue, listen))
            worker.work()
    except Exception as e:
        print(f"[!] Errore critico avvio Worker: {e}")
