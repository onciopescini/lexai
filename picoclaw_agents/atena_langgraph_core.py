import os
import json
from dotenv import load_dotenv

# LangGraph & LangChain imports
from typing import Annotated, Literal
from typing_extensions import TypedDict
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from langgraph.graph import MessagesState
import supabase

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    print("⚠️ Attenzione: Mancano le chiavi API nel file .env (SUPABASE_URL, SUPABASE_KEY o GEMINI_API_KEY).")
    exit(1)

# Initialize Supabase Client
sb_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 1. DEFINE THE TOOLS (I Ricercatori)
# ==========================================

@tool
def search_guardian_alerts(query: str) -> str:
    """
    Ricerca nel database degli alert legali del Guardian.
    Usa questo tool per trovare le ultime novità legislative registrate nel database di Atena.
    """
    print(f"\n[Atena Tool] -> Eseguo ricerca su Guardian Alerts per: '{query}'")
    try:
        # Recuperiamo gli ultimi 5 alert per semplicità
        res = sb_client.table("atena_guardian_alerts").select("title, summary, impact_level").order("date_published", desc=True).limit(5).execute()
        data = res.data
        if not data:
            return "Nessun alert trovato nel database."
        
        result_str = "Ultime novità legali trovate:\n"
        for item in data:
            result_str += f"- [{item['impact_level']}] {item['title']}: {item['summary']}\n"
        return result_str
    except Exception as e:
        return f"Errore durante la ricerca nel database: {str(e)}"

@tool
def legal_fact_checker(law_text: str) -> str:
    """
    Simula un Verificatore. Controlla se la legge citata ha senso o è un'allucinazione.
    Ritorna un responso affermativo o negativo.
    """
    print(f"\n[Atena Tool] -> Verifico la validità di: '{law_text}'")
    # In una versione reale, questo tool farebbe una query vettoriale su atena_knowledge_base
    # o una ricerca web per incrociare i dati.
    if "bonus" in law_text.lower() and "milioni" in law_text.lower():
        return "ATTENZIONE: Questa legge sembra un'allucinazione o una fake news. Si prega di correggere l'analisi."
    return "VERIFICATO: La legge o il principio sembra essere fondato."


# ==========================================
# 2. INITIALIZE THE LLM (Atena Core)
# ==========================================
# Gemini 2.5 Flash is incredibly fast and perfect for underlying reasoning loops
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    max_tokens=None,
    timeout=None
)

# Bind the tools to the LLM
tools = [search_guardian_alerts, legal_fact_checker]

# ==========================================
# 3. BUILD THE LANGGRAPH AGENT (Il Direttore)
# ==========================================
# We use a prebuilt ReAct (Reasoning and Acting) agent. 
# It loops between thinking and using tools until it finds the final answer.
prompt_template = """
Sei Atena, l'Intelligenza Artificiale Legale Suprema.
Il tuo compito è aiutare l'utente fornendo risposte precise e verificabili.
Se hai bisogno di cercare novità legali, usa `search_guardian_alerts`.
Se formuli una tesi legale, passa il concetto a `legal_fact_checker` per validarlo.

Rispondi in modo regale, autorevole e con precisione chirurgica.
"""

# The prebuilt agent automatically handles the routing between the LLM and the tools
atena_agent = create_react_agent(
    llm,
    tools=tools,
    prompt=prompt_template
)

# ==========================================
# 4. EXECUTION LOOP 
# ==========================================
def main():
    print("👑 Il Tribunale Interno di Atena è online (powered by LangGraph & Gemini).")
    print("Scrivi 'esci' per terminare.\n")
    
    while True:
        user_input = input("⚖️ Capitano > ")
        if user_input.lower() in ['esci', 'exit', 'quit']:
            break
            
        print("\n[Atena Pensa...] 🧠")
        
        # Invoke the LangGraph agent
        messages = {"messages": [("user", user_input)]}
        
        # The agent returns the full state (conversation history)
        # We process the stream to see what happens under the hood
        try:
            for s in atena_agent.stream(messages, stream_mode="values"):
                message = s["messages"][-1]
                if isinstance(message, tuple):
                    print(f"\nMessage: {message}")
                elif message.type == "ai" and message.content:
                   print(f"\n🏛️ Atena:\n{message.content}")
                elif message.type == "tool":
                   print(f"\n🛠️ Strumento completato: {message.name}")
        except Exception as e:
            print(f"❌ Errore critico nel grafo: {e}")

if __name__ == "__main__":
    main()
