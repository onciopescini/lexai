"""
🛡️ Picoclaw FlareSolverr Client (Anti-Bot Defense System)

Questo modulo fornisce un'interfaccia client per un'istanza locale di FlareSolverr.
FlareSolverr è un server proxy (basato su Selenium eundetected-chromedriver)
che permette ai crawler di bypassare le protezioni anti-bot commerciali come
Cloudflare e DDoS-GUARD.

Uso:
1. Assicurarsi di aver avviato un server FlareSolverr locale.
   (Es. via Docker: `docker run -d --name=flaresolverr -p 8191:8191 -e LOG_LEVEL=info ghcr.io/flaresolverr/flaresolverr:latest`)
2. Importare e utilizzare la funzione `get_protected_page` invece di `requests.get`.

Attenzione: FlareSolverr è resource-intensive e lento (avvia un browser headless per richiesta).
Utilizzare solo per endpoint protetti verificati (es. 403 Forbidden o Captcha loops).
"""

import requests
import json
import time

FLARESOLVERR_URL = "http://localhost:8191/v1"
DEFAULT_TIMEOUT_MS = 60000

def ping_solver() -> bool:
    """Verifica se il server FlareSolverr è raggiungibile e funzionante sul sistema locale."""
    try:
        # Una req vuota su POST /v1 restituisce error ma confermiamo che risponde.
        resp = requests.post(FLARESOLVERR_URL, json={}, timeout=5)
        return resp.status_code in [200, 400, 500] 
    except requests.exceptions.RequestException:
         return False

def get_protected_page(target_url: str, timeout_ms: int = DEFAULT_TIMEOUT_MS) -> str:
    """
    Invia una richiesta GET HTTP tramite FlareSolverr per bypassare blocchi.
    
    Args:
        target_url (str): L'URL della pagina da recuperare.
        timeout_ms (int): Tempo massimo (in ms) per la risoluzione Cloudflare (default: 60s).
        
    Returns:
        str: Il contenuto HTML/Text decodificato della pagina.
             Restituisce None se FlareSolverr fallisce o va in timeout.
    """
    print(f"[🛡️ FlareSolverr] Inoltro richiesta proxy bypass per: {target_url} ...")
    start_t = time.time()
    
    data = {
        "cmd": "request.get",
        "url": target_url,
        "maxTimeout": timeout_ms
    }
    
    try:
        response = requests.post(FLARESOLVERR_URL, json=data, timeout=(timeout_ms / 1000) + 10)
        json_resp = response.json()
        
        status = json_resp.get("status")
        if status == "ok":
            elapsed = time.time() - start_t
            print(f"[🛡️ FlareSolverr] Bypass completato con SUCCESSO in {elapsed:.1f}s.")
            return json_resp['solution']['response']
        else:
            print(f"[🛡️ FlareSolverr] ❌ Fallimento Bypass: {json_resp.get('message', 'Errore Sconosciuto')}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"[🛡️ FlareSolverr] ❌ Errore di Connessione al Proxy: {e}")
        # Hint per l'utente se non l'ha avviato
        print("💡 Assicurati che FlareSolverr sia in esecuzione sulla porta 8191 (es. tramite Docker).")
        return None

if __name__ == "__main__":
    # Test script rapido se chiamato direttamente
    print("Verifica disponibilità FlareSolverr...")
    if ping_solver():
        print("✅ Server FlareSolverr RILEVATO.")
        test_url = "https://nowsecure.nl" # Un noto sito di test Cloudflare
        print(f"\nProvo a bypassare: {test_url}")
        html = get_protected_page(test_url)
        if html:
            print(f"Successo! Ricevuti {len(html)} caratteri HTML.")
            if "Cloudflare" not in html[:500]:
                 print("Il blocco Cloudflare sembra evaso o non presente.")
    else:
        print("❌ Server FlareSolverr NON trovato su localhost:8191.")
