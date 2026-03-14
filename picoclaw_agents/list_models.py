import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

models = []
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        models.append(m.name)

with open('models.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(models))
