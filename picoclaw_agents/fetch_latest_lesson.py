import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

response = supabase.table('civic_lessons').select('*').order('created_at', desc=True).limit(1).execute()

for row in response.data:
    print(f"[{row['created_at']}] [{row['trend_topic']}] {row['lesson_title']}")
    print(f"PROMPT: {row['image_prompt']}")
    print(f"TESTO:\n{row['content_script']}")
    print("="*40)
