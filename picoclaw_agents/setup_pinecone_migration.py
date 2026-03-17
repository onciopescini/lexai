import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client
from pinecone.grpc import PineconeGRPC as Pinecone
from pinecone import ServerlessSpec

# Caricamento Variabili d'Ambiente
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, PINECONE_API_KEY]):
    raise ValueError("Mancano le variabili d'ambiente. Verifica il file .env.")

# Setup Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)

INDEX_NAME = "lexai-knowledge-base"
DIMENSION = 768 # Dimensione degli embedding di Gemini

def setup_pinecone_index():
    print(f"[*] Verifico l'esistenza dell'indice Pinecone '{INDEX_NAME}'...")
    active_indexes = [index['name'] for index in pc.list_indexes()]
    
    if INDEX_NAME not in active_indexes:
        print(f"[*] L'indice '{INDEX_NAME}' non esiste. Creazione in corso (Serverless, {DIMENSION}d)...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=DIMENSION,
            metric="cosine", # Cosine similarity per il retrieval semantico
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        
        # Aspetta che l'indice sia pronto
        while not pc.describe_index(INDEX_NAME).status['ready']:
            print("    -> Attendo che l'indice sia generato in Cloud...")
            time.sleep(1)
        print(f"[v] Indice '{INDEX_NAME}' creato con successo!")
    else:
        print(f"[v] L'indice '{INDEX_NAME}' è già pronto e attivo.")

def migrate_data():
    setup_pinecone_index()
    index = pc.Index(INDEX_NAME)
    
    print("[*] Estrazione record dalla knowledge base Supabase (pgvector)...")
    try:
        # Prende i primi articoli (limitiamo i batch per sicurezza)
        response = supabase.table('legal_documents').select('id, title, embedding, jurisdiction, hierarchy, source_url, content').limit(1000).execute()
        records = response.data
        
        if not records:
            print("[!] Nessun documento trovato in Supabase.")
            return

        print(f"[*] Recuperati {len(records)} documenti. Inizio l'upsert su Pinecone...")
        
        vectors_to_upsert = []
        import ast
        for record in records:
            values = record['embedding']
            if isinstance(values, str):
                try:
                    values = ast.literal_eval(values)
                except Exception:
                    continue
            
            if not values or not isinstance(values, list):
                continue
            
            vector_id = str(record['id'])
            metadata = {

                "title": record.get('title', ''),
                "jurisdiction": record.get('jurisdiction', ''),
                "hierarchy": record.get('hierarchy', ''),
                "source_url": record.get('source_url', ''),
                "content": record.get('content', '') # Salviamo il contenuto testuale nei metadata
            }
            
            vectors_to_upsert.append({
                "id": vector_id,
                "values": values,
                "metadata": metadata
            })
            
            # Batch upsert: Pinecone consiglia batch da 100-200 vettori
            if len(vectors_to_upsert) >= 100:
                print(f"    -> Upserting batch di {len(vectors_to_upsert)} vettori...")
                index.upsert(vectors=vectors_to_upsert)
                vectors_to_upsert = [] # Reset

        # Upsert dei rimanenti
        if len(vectors_to_upsert) > 0:
             print(f"    -> Upserting batch finale di {len(vectors_to_upsert)} vettori...")
             index.upsert(vectors=vectors_to_upsert)
             
        print(f"[v] MIGRAZIONE COMPLETATA CON SUCCESSO! Il cervello di Atena ora risiede in Pinecone. 🌲")
        
        # Controllo stats
        stats = index.describe_index_stats()
        print(f"\n[Stats Indice]\nVettori Totali: {stats.total_vector_count}")

    except Exception as e:
        import traceback
        print(f"[X] Errore durante la migrazione:")
        print(traceback.format_exc())

if __name__ == "__main__":
    migrate_data()
