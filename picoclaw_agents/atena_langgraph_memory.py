import os
import sys
from dotenv import load_dotenv

# LangGraph & LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.tools import tool
import supabase

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL") # Required for the Checkpointer
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    print("⚠️ Mancano SUPABASE_URL, SUPABASE_KEY o GEMINI_API_KEY.")
    sys.exit(1)

if not SUPABASE_DB_URL:
    print("⚠️ Manca SUPABASE_DB_URL nel file .env!")
    print("Per la memoria a lungo termine di LangGraph, ho bisogno della stringa di connessione PostgreSQL.")
    print("Formato: postgresql://[user]:[password]@[host]:[port]/[db]")
    sys.exit(1)

# Initialize Supabase Client for normal operations
sb_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 1. TOOLS
# ==========================================
@tool
def search_guardian_alerts(query: str) -> str:
    """Cerca nel database degli alert legali del Guardian. Usa questo tool per le ultime novità."""
    print(f"\n[Atena Tool] -> Cerco in Guardian: '{query}'")
    try:
        res = sb_client.table("atena_guardian_alerts").select("title, summary, impact_level").order("date_published", desc=True).limit(5).execute()
        data = res.data
        if not data: return "Nessun alert trovato."
        return "Novità legali:\n" + "\n".join([f"- [{i['impact_level']}] {i['title']}: {i['summary']}" for i in data])
    except Exception as e:
        return f"Errore DB: {str(e)}"

# ==========================================
# 2. LLM e GRAFO
# ==========================================
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    max_tokens=None,
    timeout=None
)

tools = [search_guardian_alerts]
prompt_template = """
Sei Atena, l'Intelligenza Artificiale Legale Suprema.
Usa i tool a tua disposizione quando necessario. Ricorda le informazioni passate dell'utente perché hai una memoria persistente.
Rispondi sempre con precisione e stile regale.
"""

from langgraph.checkpoint.memory import MemorySaver

def main():
    print("🔄 Inizializzazione della Memoria Locale (MemorySaver)...")
    
    # Inizializziamo il Memory Checkpointer locale per test
    checkpointer = MemorySaver()
    
    # Compiliamo il React Agent passandogli il checkpointer
    atena_agent = create_react_agent(
        llm,
        tools=tools,
        prompt=prompt_template,
        checkpointer=checkpointer
    )
    
    print("👑 Il Tribunale (con Memoria Volatile) è ONLINE.")
    print("Usa 'esci' per uscire. I tuoi ricordi dureranno per questa sessione!\n")
    
    # L'ID del Thread Thread è cruciale. Se usi lo stesso ID, Atena ricorderà il passato.
    # Immagina che 'thread_id' sia l'ID dell'utente (es. Alfonso)
    config = {"configurable": {"thread_id": "capitano_alfonso_1"}}

    while True:
        user_input = input("⚖️ Capitano > ")
        if user_input.lower() in ['esci', 'exit', 'quit']:
            break
            
        messages = {"messages": [("user", user_input)]}
        
        try:
            # Eseguiamo il grafo passando il config con il thread_id
            for s in atena_agent.stream(messages, config, stream_mode="values"):
                message = s["messages"][-1]
                if message.type == "ai" and message.content:
                   print(f"\n🏛️ Atena:\n{message.content}")
                elif message.type == "tool":
                   print(f"\n🛠️ Strumento completato: {message.name}")
        except Exception as e:
            print(f"❌ Errore critico nel grafo: {e}")

if __name__ == "__main__":
    main()
