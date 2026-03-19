import asyncio
from atena_langgraph_tools import app

def main():
    print("====================================================")
    print("ATENA E2E TEST: LangGraph Workspace Tools Invocation")
    print("====================================================\n")
    
    config = {"configurable": {"thread_id": "test_workspace_e2e_thread"}}
    
    # We send a specific prompt that should trigger BOTH the RAG and the Workspace Tool
    user_input = "Cercami un riassunto dell'articolo 3 della Costituzione Italiana dedicato all'uguaglianza, e poi usa esplicitamente il tool per salvarlo in un documento Google Docs chiamato 'Test_Costituzione_Art3'."
    
    print(f"User Prompt: '{user_input}'\n")
    print("--- Inizio Flusso Graph ---")
    
    try:
        for event in app.stream({"messages": [("user", user_input)]}, config, stream_mode="updates"):
            for node_name, node_state in event.items():
                if node_name == "triage":
                     print(f"[*] Nodo Triage elaborato.")
                     if node_state.get("needs_disambiguation"):
                         print(f"[!] ATTENZIONE: Il Triage ha richiesto disambiguazione!: {node_state.get('triage_message')}")
                         return
                
                elif node_name == "agent":
                     msg = node_state["messages"][-1]
                     if hasattr(msg, "tool_calls") and msg.tool_calls:
                         for tool_call in msg.tool_calls:
                             print(f"[*] L'Agente ha invocato il Tool: {tool_call['name']}")
                             print(f"    Argomenti: {tool_call['args']}")
                     else:
                         print(f"[*] Risposta finale Agente: {msg.content}")
                         
                elif node_name == "tools":
                     msg = node_state["messages"][-1]
                     print(f"[*] Risultato del Tool: {msg.content}")
                     
                elif node_name == "fact_checker":
                     print("[*] Fact Checker in esecuzione...")
                                 
        print("\nTest Completato.")

    except Exception as e:
        print(f"Errore critico nel grafo: {e}")

if __name__ == "__main__":
    main()
