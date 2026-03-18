import os
import requests
import json
from bs4 import BeautifulSoup

# ==========================================
# CONFIGURATION
# ==========================================
FLARESOLVERR_URL = "http://localhost:8191/v1"

# You can still use an upstream proxy if you want FlareSolverr to route through it. 
# SCRAPER_PROXY_URL format: "http://user:pass@ip:port"
PROXY_URL = os.getenv("SCRAPER_PROXY_URL")  

def flaresolverr_request(cmd: str, **kwargs):
    """
    Helper function to interact with FlareSolverr API.
    cmd can be: 'sessions.create', 'sessions.destroy', 'request.get', etc.
    """
    headers = {"Content-Type": "application/json"}
    data = {"cmd": cmd}
    data.update(kwargs)
    
    try:
        response = requests.post(FLARESOLVERR_URL, headers=headers, json=data, timeout=120)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"[X] Error talking to FlareSolverr ({cmd}): {e}")
        return None

def fetch_normattiva_atto_flaresolverr(urn: str):
    """
    Fetches a legal act from Normattiva using FlareSolverr to bypass JS challenges.
    Uses sessions to optimize multiple requests.
    """
    url = f"https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:{urn}"
    print(f"[*] Starting FlareSolverr flow for: {url}")
    
    # 1. Create a session
    print("    -> Creating browser session...")
    session_data = {"session": "normattiva_session_1"}
    
    # In case we have a residential proxy, we pass it to the session creation
    if PROXY_URL:
        # FlareSolverr needs the proxy in a specific format dict
        # Assuming PROXY_URL is like http://user:pass@ip:port
        # Note: the user/pwd parsing might be needed if PROXY_URL is complex
        session_data["proxy"] = {"url": PROXY_URL}
        
    session_res = flaresolverr_request("sessions.create", **session_data)
    
    if not session_res or session_res.get('status') != 'ok':
        print("[X] Failed to create session.")
        return None
        
    session_id = session_res.get('session')
    print(f"    -> Session created: {session_id}")
    
    # 2. Make the GET request
    print("    -> Solving Cloudflare challenge & fetching HTML...")
    req_res = flaresolverr_request(
        "request.get", 
        url=url, 
        session=session_id,
        maxTimeout=60000
    )
    
    html_content = None
    if req_res and req_res.get('status') == 'ok':
        print("    -> [✓] Challenge bypassed. HTML retrieved!")
        html_content = req_res.get('solution', {}).get('response', '')
    else:
        print("    -> [X] Failed to fetch page.")
        
    # 3. Destroy the session to free up RAM
    print("    -> Destroying browser session...")
    flaresolverr_request("sessions.destroy", session=session_id)
    
    return html_content

def parse_normattiva_html(html_content: str):
    """
    Parses the raw HTML returned from Normattiva.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 1. Trova il titolo dell'atto
    title_div = soup.find('div', class_='titolo')
    title = title_div.get_text(strip=True) if title_div else "Titolo Sconosciuto"
    print(f"\n[Doc] Atto: {title}")
    
    # 2. Estrai gli articoli
    paragraphs = soup.find_all('div', class_='articolato')
    if not paragraphs:
        paragraphs = soup.find_all('p')
        
    chunks = []
    for p in paragraphs:
        text = p.get_text(separator=' ', strip=True)
        if len(text) > 100:
            chunks.append(text)
            
    print(f"[Doc] Estratti {len(chunks)} frammenti informativi.")
    return chunks

def main():
    print("=== Atena: Institutional Scraper (FlareSolverr Engine) ===")
    
    urn_costituzione = "costituzione:1947-12-27"
    html_norm = fetch_normattiva_atto_flaresolverr(urn_costituzione)
    
    if html_norm:
        chunks = parse_normattiva_html(html_norm)
        if chunks:
            print(f"Esempio testo (primi 150 char): {chunks[0][:150]}...\n")

if __name__ == "__main__":
    main()
