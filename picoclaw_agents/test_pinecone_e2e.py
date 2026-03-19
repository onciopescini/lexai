import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()

api_key = os.environ.get("PINECONE_API_KEY")

if not api_key:
    print("[ERROR] PINECONE_API_KEY non trovata nelle variabili d'ambiente.")
    exit(1)

try:
    print("Inizializzazione client Pinecone...")
    pc = Pinecone(api_key=api_key)
    
    print("\nElenco degli Indici esistenti nell'account Pinecone:")
    indexes = pc.list_indexes()
    index_names = [idx.name for idx in indexes]
    print(index_names)
    
    target_index = "lexai-knowledge-base"
    
    if target_index in index_names:
        print(f"\n[OK] L'indice '{target_index}' esiste!")
        
        index = pc.Index(target_index)
        stats = index.describe_index_stats()
        print(f"\nStatistiche Indice ({target_index}):")
        print(stats)
        
        if stats.total_vector_count > 0:
            print(f"\n[OK] Perfetto, l'indice contiene {stats.total_vector_count} vettori. Il Retrieval funzionerà.")
        else:
            print("\n[WARNING] ATTENZIONE: L'indice esiste ma contiene 0 vettori. Bisogna prima iniettarci i documenti legali (Es. Costituzione, Codici).")
    else:
        print(f"\n[ERROR] ERRORE: L'indice '{target_index}' NON ESISTE. Deve essere creato su Pinecone (Dimensioni Vettori di Gemini: 768).")

except Exception as e:
    print(f"[ERROR] Errore durante la connessione a Pinecone: {str(e)}")
