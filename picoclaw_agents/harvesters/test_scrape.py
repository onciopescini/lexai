import requests
from bs4 import BeautifulSoup

url_cpc = "https://it.wikisource.org/wiki/Codice_di_procedura_civile"
headers = {'User-Agent': 'Mozilla/5.0'}
res_cpc = requests.get(url_cpc, headers=headers)
soup_cpc = BeautifulSoup(res_cpc.text, 'html.parser')
links_cpc = []
for a in soup_cpc.find_all('a', href=True):
    if 'Codice_di_procedura_civile/' in a['href']:
        if a['href'] not in links_cpc:
            links_cpc.append(a['href'])
print(f"Codice Procedura Civile -> Found {len(links_cpc)}. First 10: {links_cpc[:10]}")

url_cpp = "https://it.wikisource.org/wiki/Codice_di_procedura_penale"
res_cpp = requests.get(url_cpp, headers=headers)
soup_cpp = BeautifulSoup(res_cpp.text, 'html.parser')
links_cpp = []
for a in soup_cpp.find_all('a', href=True):
    if 'Codice_di_procedura_penale/' in a['href']:
        if a['href'] not in links_cpp:
            links_cpp.append(a['href'])
print(f"Codice Procedura Penale -> Found {len(links_cpp)}. First 10: {links_cpp[:10]}")
