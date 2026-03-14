import os
import time
import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

class NormattivaStealthCrawler:
    """
    Crawler avanzato Headless basato su Playwright per superare le protezioni 
    e navigare il complesso DOM ASP.NET di Normattiva (Codice Civile).
    """
    def __init__(self):
        self.base_url = "https://www.normattiva.it"
        self.documents = []

    async def execute_stealth_ingestion(self):
        print("====== Avvio PicoClaw Stealth Ingestion: NORMATTIVA ======")
        print("[!] ATTENZIONE: Questo script richiede un IP Residenziale Italiano.")
        print("[!] I firewall governativi bloccano spesso gli IP Cloud/Datacenter.")
        
        async with async_playwright() as p:
            # Avvio Chromium headful per permettere all'utente di vedere l'automazione all'opera
            # (impostare headless=True per silenziarlo)
            browser = await p.chromium.launch(headless=False, slow_mo=50) # slow_mo simula lentezza umana
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={'width': 1280, 'height': 800}
            )
            page = await context.new_page()
            
            try:
                print("[*] Connessione a Normattiva.it (Attesa caricamento portale)...")
                # Impostiamo un timeout lungo
                await page.goto(self.base_url, wait_until="domcontentloaded", timeout=60000)
                
                print("[*] Navigazione completata. Ricerca 'Codice Civile'...")
                # Molti portali ASP.NET hanno i link nel menu. 
                # Proviamo a usare locator testuali molto generici se il DOM esatto non è noto.
                
                # Strategia 1: Ricerca diretta tramite form
                # Aspettiamo l'input di ricerca. Solitamente ha attributi title o placeolder.
                # Qui usiamo un approccio robusto "guess-and-check"
                search_input = page.locator("input[type='text']").first
                await search_input.wait_for(state="visible", timeout=10000)
                await search_input.fill("Codice Civile")
                
                await page.keyboard.press("Enter")
                print("[*] Ricerca Inviata. Attesa Vigenze ASP.NET...")
                await page.wait_for_timeout(5000) # Wait for results
                
                # Clicchiamo sul primo risultato che contiene "Codice Civile"
                link_risultato = page.locator("text='CODICE CIVILE'").first
                if await link_risultato.count() > 0:
                    await link_risultato.click()
                
                # Attesa caricamento frame testo (Spesso normattiva divide indice a sx e testo a dx)
                await page.wait_for_timeout(5000)
                
                print("[*] Estrazione del testo legislativo multipagina...")
                
                # Estrazione HTML
                html_content = await page.content()
                soup = BeautifulSoup(html_content, 'html.parser')
                
                # Strip degli script per pulire i token
                for element in soup(["script", "style", "nav", "footer"]):
                    element.decompose()
                    
                raw_text = soup.get_text(separator='\n', strip=True)
                
                print(f"[v] Testo Legale Puro Estratto. Lunghezza: {len(raw_text)} caratteri.")
                
                # Salvataggio di sicurezza per Chunker Semantico successivo
                with open("normattiva_codice_civile_raw.txt", "w", encoding="utf-8") as f:
                    f.write(raw_text)
                    
                print("[v] Missione Stealth Completata: Dati salvati localmente.")
                
            except Exception as e:
                print(f"[X] Il Firewall del Governo o un timeout ha bloccato l'Agente: {e}")
                print("[!] Assicurati di eseguire questo script in LOCALE con la tua connessione italiana.")
            finally:
                await browser.close()
                print("[*] Connessione Sicura Terminata.")

if __name__ == "__main__":
    crawler = NormattivaStealthCrawler()
    # Eseguiamo il loop asyncrono
    asyncio.run(crawler.execute_stealth_ingestion())
