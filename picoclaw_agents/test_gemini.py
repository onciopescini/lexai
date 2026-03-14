import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)
try:
    model = genai.GenerativeModel('gemini-1.5-pro-latest')
    res = model.generate_content("hello")
    print("PRO LATEST WORKS:", res.text)
except Exception as e:
    print("PRO LATEST ERROR:", repr(e))

try:
    model = genai.GenerativeModel('gemini-1.5-pro')
    res = model.generate_content("hello")
    print("PRO WORKS:", res.text)
except Exception as e:
    print("PRO ERROR:", repr(e))

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    res = model.generate_content("hello")
    print("FLASH WORKS:", res.text)
except Exception as e:
    print("FLASH ERROR:", repr(e))
