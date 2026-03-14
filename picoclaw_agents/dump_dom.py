import asyncio
from playwright.async_api import async_playwright

async def dump_normattiva():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        print("[*] Going to normattiva.it...")
        await page.goto("https://www.normattiva.it", wait_until="domcontentloaded")
        
        print("[*] Waiting for search form...")
        await page.wait_for_selector("input[title='Estremi Atto']")
        
        print("[*] Filling search form with 'Codice Civile'...")
        await page.fill("input[title='Estremi Atto']", "Codice Civile")
        
        print("[*] Clicking search...")
        # L'id del bottone di ricerca potrebbe variare, cerchiamo un input type submit o simile vicino
        # Ispenzionando a spanne, c'è un pulsante "Ricerca"
        await page.click("text='Ricerca'")
        
        print("[*] Waiting for results...")
        await page.wait_for_timeout(3000)
        
        html = await page.content()
        with open("normattiva_dump.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        print("[v] Saved HTML dump to normattiva_dump.html")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(dump_normattiva())
