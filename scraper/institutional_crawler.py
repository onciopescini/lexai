import os
import time
from bs4 import BeautifulSoup
from curl_cffi import requests as c_requests
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# CONFIGURATION AND PROXY SETUP
# ==========================================
# Use a residential proxy for high-security portals (e.g. ScraperAPI, BrightData)
PROXY_URL = os.getenv("SCRAPER_PROXY_URL")  # e.g., "http://user:pass@pr.oxylabs.io:8000"
PROXIES = {"http": PROXY_URL, "https": PROXY_URL} if PROXY_URL else None

# Impersonate a common browser to bypass TLS fingerprinting (Cloudflare/Akamai)
IMPERSONATE_PROFILE = "chrome110"

def fetch_normattiva_atto(urn: str) -> str:
    """
    Fetches a legal act directly from Normattiva using its formal URN.
    Example URN: "decreto.legge:2020-05-19;34" (Decreto Rilancio)
    """
    url = f"https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:{urn}"
    print(f"[*] Fetching: {url}")
    
    try:
        response = c_requests.get(
            url,
            impersonate=IMPERSONATE_PROFILE,
            proxies=PROXIES,
            timeout=30,
            headers={
                "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7"
            }
        )
        
        if response.status_code == 200:
            print("[✓] Request successful! Cloudflare/Bot-Protection bypassed.")
            return response.text
        else:
            print(f"[!] HTTP Error {response.status_code}")
            return None
    except Exception as e:
        print(f"[X] Connection Error: {e}")
        return None

def fetch_gazzetta_ufficiale(date_str: str, edition: str = "SG"):
    """
    Fetches the index of the Gazzetta Ufficiale for a given date.
    Example date: "2024-03-01". Edition: Serie Generale (SG).
    Guiding bypassing through cookies/sessions can be added here.
    """
    # Simply an example URL architecture for GU
    url = f"https://www.gazzettaufficiale.it/gazzetta/serie_generale/caricaDettaglio?dataPubblicazioneGazzetta={date_str}"
    print(f"[*] Fetching Gazzetta Ufficiale: {url}")
    
    try:
        response = c_requests.get(
            url,
            impersonate=IMPERSONATE_PROFILE,
            proxies=PROXIES,
            timeout=30
        )
        if response.status_code == 200:
            print("[✓] Gazzetta Ufficiale access granted.")
            return response.text
        else:
            print(f"[!] HTTP Error {response.status_code}")
            return None
    except Exception as e:
        print(f"[X] Connection Error: {e}")
        return None

def parse_normattiva_html(html_content: str):
    """
    Parses the raw HTML returned from Normattiva.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 1. Trova il titolo dell'atto (spesso in div con classe 'titolo')
    title_div = soup.find('div', class_='titolo')
    title = title_div.get_text(strip=True) if title_div else "Titolo Sconosciuto"
    print(f"\n[Doc] Atto: {title}")
    
    # 2. Estrai gli articoli. Normattiva usa spesso <div> con id="artX"
    # Per una PoC generica, estraiamo i blocchi di testo rilevanti.
    paragraphs = soup.find_all('div', class_='articolato')
    
    if not paragraphs:
        # Fallback to general paragraphs if specific structure isn't matched
        paragraphs = soup.find_all('p')
        
    chunks = []
    for p in paragraphs:
        text = p.get_text(separator=' ', strip=True)
        if len(text) > 100:  # Filtra elementi di navigazione troppo brevi
            chunks.append(text)
            
    print(f"[Doc] Estratti {len(chunks)} frammenti informativi.")
    return chunks

def main():
    print("=== Atena: Institutional Scraper (Advanced Bypass Engine) ===")
    if PROXIES:
        print(f"[*] Using Proxy Server: {PROXIES['http'][:15]}***")
    else:
        print("[!] Warning: No proxy configured. Using local IP. Set SCRAPER_PROXY_URL for production.")
        
    # Test 1: Normattiva (Costituzione Italiana URN)
    urn_costituzione = "costituzione:1947-12-27"
    html_norm = fetch_normattiva_atto(urn_costituzione)
    
    if html_norm:
        chunks = parse_normattiva_html(html_norm)
        if chunks:
            print(f"Esempio testo (primi 150 char): {chunks[0][:150]}...\n")
            
    # Test 2: Gazzetta Ufficiale index
    fetch_gazzetta_ufficiale(date_str="2024-03-01")

if __name__ == "__main__":
    main()
