import os
import requests
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={GEMINI_API_KEY}"
headers = {'Content-Type': 'application/json'}
data = {
    "model": "models/gemini-embedding-001",
    "content": {"parts": [{"text": "Hello world"}]},
    "outputDimensionality": 768
}

res = requests.post(url, headers=headers, json=data)
print(f"Status: {res.status_code}")
if res.status_code == 200:
    vec = res.json()['embedding']['values']
    print(f"Length of response vector: {len(vec)}")
else:
    print(res.text)
