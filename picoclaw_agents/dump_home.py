import asyncio
from playwright.async_api import async_playwright

async def dump_home():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        print("Scaricando normattiva.it...")
        await page.goto('https://www.normattiva.it', wait_until='domcontentloaded', timeout=60000)
        html = await page.content()
        with open('normattiva_home.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("Fatto.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(dump_home())
