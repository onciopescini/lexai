import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from atena_langgraph_tools import app
from langchain_core.messages import HumanMessage

def test_triage():
    print("====================================")
    print("Inizio Test Triage HitL...")
    print("====================================")
    config = {"configurable": {"thread_id": "test_triage_user_123"}}
    
    query_1 = "Mi ha appena fermato la polizia, che faccio?"
    print(f"\n[USER] Invio Query 1: '{query_1}'")
    
    app.invoke({"messages": [HumanMessage(content=query_1)]}, config)
    
    state = app.get_state(config)
    print("\n--- STATO DOPO QUERY 1 ---")
    print(f"Needs Disambiguation: {state.values.get('needs_disambiguation')}")
    print(f"Triage Message: {state.values.get('triage_message')}")
    
    print("\n====================================")
    
    if state.values.get("needs_disambiguation"):
        query_2 = "Alla guida. Non ho bevuto ma ho paura."
        print(f"\n[USER] Invio Query 2 (Risposta): '{query_2}'")
        app.invoke({"messages": [HumanMessage(content=query_2)]}, config)
        
        state = app.get_state(config)
        print("\n--- STATO DOPO QUERY 2 ---")
        print(f"Needs Disambiguation: {state.values.get('needs_disambiguation')}")
        last_msg = state.values["messages"][-1]
        print(f"Risposta Agenzia RAG: {last_msg.content[:500]}...")

if __name__ == "__main__":
    test_triage()
