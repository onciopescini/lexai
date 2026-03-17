import os
from supabase import create_client, Client

url = "https://uozrarerwahidqkmubui.supabase.co"
# Qui serve la SERVICE_ROLE_KEY per operare su storage admin, ma proviamo con la key attuale
key = "sb_publishable_w0TILhjx4VbF6RCA7SsYEw__k7Q8W60" 

supabase: Client = create_client(url, key)

try:
    # 1. Crea il bucket
    supabase.storage.create_bucket("atena-documents", {"public": True})
    print("Bucket created.")
except Exception as e:
    print("Bucket might already exist or permission denied:", e)

try:
    # 2. Test upload directly
    with open("test.txt", "w") as f:
        f.write("test")
    with open("test.txt", "rb") as f:
        res = supabase.storage.from_("atena-documents").upload("test.txt", f)
        print("Upload result:", res)
except Exception as e:
    print("Upload failed:", e)
