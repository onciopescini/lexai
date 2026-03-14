"""
🐝 Atena Swarm Launcher — Esecuzione Parallela di Tutti i Crawler
Lancia tutti gli agenti di ingestion in parallelo usando multiprocessing.
"""
import os
import sys
import time
import multiprocessing
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# === Definizione degli Agenti ===

def run_civil_code():
    """Agente: Codice Civile da Wikisource."""
    try:
        from advanced_civil_code_crawler import CivilCodeCrawler
        print("[SWARM][CC] 🏛️ Avvio Codice Civile Crawler...")
        crawler = CivilCodeCrawler()
        crawler.execute_global_ingestion(limit_pages=9999)
        crawler.embed_and_upload()
        print(f"[SWARM][CC] ✅ Completato: {len(crawler.documents)} articoli")
        return ("Codice Civile", len(crawler.documents))
    except Exception as e:
        print(f"[SWARM][CC] ❌ Errore: {e}")
        return ("Codice Civile", 0)


def run_penal_code():
    """Agente: Codice Penale da Wikisource."""
    try:
        from codice_penale_crawler import run
        print("[SWARM][CP] ⚖️ Avvio Codice Penale Crawler...")
        count = run()
        print(f"[SWARM][CP] ✅ Completato: {count} articoli")
        return ("Codice Penale", count)
    except Exception as e:
        print(f"[SWARM][CP] ❌ Errore: {e}")
        return ("Codice Penale", 0)


def run_eurlex():
    """Agente: EUR-Lex (20+ normative UE)."""
    try:
        from advanced_eurlex_crawler import run
        print("[SWARM][EU] 🇪🇺 Avvio EUR-Lex Crawler (20+ regulations)...")
        count = run()
        print(f"[SWARM][EU] ✅ Completato: {count} articoli")
        return ("EUR-Lex", count)
    except Exception as e:
        print(f"[SWARM][EU] ❌ Errore: {e}")
        return ("EUR-Lex", 0)


def run_gazzetta():
    """Agente: Gazzetta Ufficiale + Normattiva."""
    try:
        from gazzetta_ufficiale_crawler import run
        print("[SWARM][GU] 📰 Avvio Gazzetta Ufficiale Crawler...")
        count = run()
        print(f"[SWARM][GU] ✅ Completato: {count} documenti")
        return ("Gazzetta Ufficiale", count)
    except Exception as e:
        print(f"[SWARM][GU] ❌ Errore: {e}")
        return ("Gazzetta Ufficiale", 0)


def run_costituzione():
    """Agente: Costituzione Italiana (se non ancora ingested)."""
    try:
        from ingest_costituzione import scrape_and_ingest
        print("[SWARM][CO] 🏛️ Avvio Costituzione Crawler...")
        scrape_and_ingest()
        print("[SWARM][CO] ✅ Completato")
        return ("Costituzione", 139)
    except Exception as e:
        print(f"[SWARM][CO] ❌ Errore: {e}")
        return ("Costituzione", 0)


# === Main Swarm Launcher ===

def main():
    start_time = time.time()
    
    print("=" * 70)
    print("  🐝 ATENA SWARM LAUNCHER — Multi-Agent Parallel Ingestion")
    print("=" * 70)
    print(f"  Timestamp: {datetime.now().isoformat()}")
    print(f"  CPU Cores: {multiprocessing.cpu_count()}")
    print()
    
    agents = [
        ("Codice Civile", run_civil_code),
        ("Codice Penale", run_penal_code),
        ("EUR-Lex", run_eurlex),
        ("Gazzetta Ufficiale", run_gazzetta),
    ]
    
    print(f"  Launching {len(agents)} agents in parallel...\n")
    
    # Nota: usiamo processi separati perché ogni crawler fa I/O-bound work
    # (network requests + Gemini API calls). I processi evitano il GIL.
    # Limito a 2 processi paralleli per non sovraccaricare l'API Gemini.
    with multiprocessing.Pool(processes=2) as pool:
        results = []
        for name, func in agents:
            result = pool.apply_async(func)
            results.append((name, result))
        
        pool.close()
        pool.join()
    
    # Report finale
    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print("  📊 SWARM REPORT")
    print("=" * 70)
    print(f"  Tempo totale: {elapsed:.0f}s ({elapsed/60:.1f} minuti)")
    print()
    
    total_docs = 0
    for name, result in results:
        try:
            agent_name, count = result.get(timeout=1)
            total_docs += count
            status = "✅" if count > 0 else "⚠️"
            print(f"  {status} {agent_name}: {count} documenti")
        except Exception:
            print(f"  ❌ {name}: errore nel recupero risultati")
    
    print(f"\n  TOTALE NUOVI DOCUMENTI: {total_docs}")
    print("=" * 70)


if __name__ == "__main__":
    main()
