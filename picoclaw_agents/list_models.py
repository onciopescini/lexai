import os
import requests
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
res = requests.get(url)
models = res.json().get('models', [])
for model in models:
    if 'embed' in model['name']:
        print(model['name'])
