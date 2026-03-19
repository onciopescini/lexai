import os
import sys
import json
import requests
import tempfile
import uuid
from fpdf import FPDF
import markdown
import resend
from typing import Annotated, Literal, TypedDict
from dotenv import load_dotenv

# LangChain & LangGraph
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
import supabase

try:
    from workspace_integrations import create_google_doc, create_google_drive_folder
except ImportError:
    print("⚠️ workspace_integrations non trovato o dipendenze mancanti. Ignorare se non si usa Google Workspace.")
    create_google_doc = None
    create_google_drive_folder = None

load_dotenv()

def get_clean_env(key: str, default: str = "") -> str:
    val = os.getenv(key, default)
    if val and val.startswith('"') and val.endswith('"'):
        val = val[1:-1]
    return val

SUPABASE_URL = get_clean_env("SUPABASE_URL")
SUPABASE_KEY = get_clean_env("SUPABASE_KEY")
GEMINI_API_KEY = get_clean_env("GEMINI_API_KEY")
PERPLEXITY_API_KEY = get_clean_env("PERPLEXITY_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY, PERPLEXITY_API_KEY]):
    print("⚠️ Manca qualche API KEY nel file .env (Gemini, Supabase o Perplexity).")
    sys.exit(1)

sb_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# ==========================================
# 1. GRAPH STATE
# ==========================================
class AgentState(TypedDict):
    """Stato del grafo cognitivo."""
    messages: Annotated[list, add_messages]
    needs_disambiguation: bool
    triage_message: str

# ==========================================
# 2. DEFINIZIONE DEI TOOLS API
# ==========================================

from pinecone import Pinecone

@tool
def search_atena_knowledge_base(query: str, limit: int = 5) -> str:
    """Cerca nel database storico della giurisprudenza Italiana ed Europea (Costituzione, Codici, Leggi storiche). Usa QUESTO tool per leggi fondamentali, storiche o articoli di Codice."""
    print(f"\n[Tool: search_atena_knowledge_base] -> Genero Embeddings e interrogo il DB Pinecone per: '{query}'")
    try:
        # Generiamo l'embedding della query via LangChain
        embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
        vector = embeddings.embed_query(query)
        
        # Inizializziamo Pinecone
        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
        index = pc.Index("lexai-knowledge-base")
        
        # Interroghiamo Pinecone
        response = index.query(
            vector=vector,
            top_k=limit,
            include_metadata=True
        )

        matches = response.get('matches', [])
        if not matches:
            return "Nessun documento storico trovato in atena_knowledge_base (Pinecone) per questa query."
        
        output = "Documenti storici e fondamentali trovati:\n"
        for match in matches:
            metadata = match.get('metadata', {})
            output += f"- [{metadata.get('hierarchy', 'Legge')} {metadata.get('jurisdiction', '')}] {metadata.get('title', 'Senza Titolo')}\n  Estratto: {metadata.get('content', '')[:300]}...\n\n"
        return output
    except Exception as e:
        return f"Errore DB Vector Search Pinecone: {str(e)}"

@tool
def search_live_internet(query: str) -> str:
    """Cerca su Internet le ultimissime novità, news live, o decreti emessi oggi stesso. Usa QUESTO tool se ti si chiedono notizie recenti o cose che non trovi nella knowledge_base."""
    print(f"\n[Tool: search_live_internet] -> Interrogo Perplexity Sonar per: '{query}'")
    url = "https://api.perplexity.ai/chat/completions"
    payload = {
        "model": "sonar",
        "messages": [
            {
                "role": "system",
                "content": "Sei un analista legale iper-preciso. Ti viene richiesta una verifica sulle ultimissime leggi o notizie."
            },
            {
                "role": "user",
                "content": query
            }
        ]
    }
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        res = requests.post(url, json=payload, headers=headers)
        res.raise_for_status()
        text = res.json()["choices"][0]["message"]["content"]
        return f"Risultati Live da Internet (Perplexity):\n{text}"
    except Exception as e:
        return f"Errore Perplexity API: {str(e)}"

@tool
def generate_legal_document(document_text: str, title: str = "Documento Legale Atena") -> str:
    """Genera un file PDF pulito a partire da un testo (anche Markdown) e lo salva nel cloud restituendo il link pubblico. Usa QUESTO tool QUANDO L'UTENTE CHIEDE ESPLICITAMENTE di 'redigere un documento', 'generare un PDF', 'scrivere un contratto', 'preparare un atto'. Passa al tool il testo completo del documento che hai appena elaborato."""
    print(f"\n[Tool: generate_legal_document] -> Conversione in PDF e Upload in corso: '{title}'")
    try:
        # Converte il markdown in puro testo per FPDF, gestiremo HTML base
        html_content = markdown.markdown(document_text)

        class PDF(FPDF):
            def header(self):
                self.set_font("helvetica", "B", 14)
                self.cell(0, 10, title, align="C", new_x="LMARGIN", new_y="NEXT")
                self.ln(5)

            def footer(self):
                self.set_y(-15)
                self.set_font("helvetica", "I", 8)
                self.cell(0, 10, f"Pagina {self.page_no()}/{{nb}} - Generato da Atena AI", align="C")

        pdf = PDF()
        pdf.add_page()
        pdf.set_font("helvetica", size=11)
        pdf.write_html(html_content)
        
        file_name = f"draft_{uuid.uuid4().hex[:8]}.pdf"
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            pdf.output(tmp.name)
            
            # Upload to Supabase Storage (Assicurarsi che il bucket 'atena-documents' esista e sia pubblico)
            with open(tmp.name, "rb") as f:
                sb_client.storage.from_("atena-documents").upload(
                    file=f.read(),
                    path=file_name,
                    file_options={"content-type": "application/pdf"}
                )
        
        # Pulizia file locale
        if os.path.exists(tmp.name):
            os.remove(tmp.name)
            
        public_url = sb_client.storage.from_("atena-documents").get_public_url(file_name)
        return f"Il documento PDF è stato redatto e salvato nel cloud. Ecco il link pubblico per il download: {public_url}\nInforma l'utente di questo esito positivo."
    except Exception as e:
        print(f"Errore PDF Generator: {str(e)}")
        return f"Errore critico durante la generazione del PDF o dell'upload su Supabase: {str(e)}. (E' possibile che il bucket 'atena-documents' non esista)."

@tool
def send_communication_tool(recipient_email: str, subject: str, message_body: str, schedule_time: str = None) -> str:
    """Invia una comunicazione formale (Email/PEC) a un destinatario. Usa QUESTO tool QUANDO l'utente ti chiede esplicitamente di 'inviare un'email', 'notificare la controparte', o 'mandare una PEC'. Passa l'email del destinatario, l'oggetto e il corpo del messaggio."""
    print(f"\n[Tool: send_communication_tool] -> Preparazione invio email a: '{recipient_email}'")
    
    try:
        resend.api_key = os.environ.get("RESEND_API_KEY")
        
        # Production: using verified atena-lex.it domain
        params = {
            "from": "Atena Legal AI <noreply@atena-lex.it>",
            "to": [recipient_email],
            "subject": subject,
            "html": f"<p>{message_body.replace(chr(10), '<br>')}</p>",
        }
        
        email = resend.Emails.send(params)
        print("Resend Response:", email)
        
        scheduling_info = f"programmata per l'invio alle {schedule_time}" if schedule_time else "inviata istantaneamente"
        return f"La comunicazione con oggetto '{subject}' è stata {scheduling_info} all'indirizzo {recipient_email} con successo tramite Resend. Informa l'utente della conferma di invio."
        
    except Exception as e:
        print(f"Errore Invio Email Resend: {str(e)}")
        return f"Attenzione: C'è stato un problema durante l'invio dell'email tramite Resend: {str(e)}"

@tool
def create_google_workspace_doc(title: str, document_text: str) -> str:
    """Crea un documento Google Docs reale nel Google Drive. Usa QUESTO tool QUANDO l'utente ti chiede esplicitamente di 'creare un Google Doc', 'salvare su Drive', o 'generare un documento Google'. Passa il titolo e il testo completo."""
    if create_google_doc is None:
        return "Errore: Modulo Workspace non caricato. Verifica le credenziali e le dipendenze."
        
    print(f"\n[Tool: create_google_workspace_doc] -> Creazione Google Doc in corso: '{title}'")
    try:
        url = create_google_doc(title, document_text)
        return f"Il Google Doc è stato creato con successo. Link: {url}\nFornisci questo link all'utente."
    except Exception as e:
        return f"Errore critico durante la creazione del Google Doc: {str(e)}"

@tool
def create_google_workspace_folder(folder_name: str) -> str:
    """Crea una cartella nel Google Drive dell'utente per catalogare i documenti raggruppandoli (es. per cittadino, caso o argomento). Usa QUESTO tool QUANDO l'utente chiede esplicitamente di 'creare una cartella su Drive' o 'organizzare i file in una cartella'."""
    if create_google_drive_folder is None:
        return "Errore: Modulo Workspace non caricato. Verifica le credenziali e le dipendenze."
        
    print(f"\n[Tool: create_google_workspace_folder] -> Creazione Cartella Google Drive in corso: '{folder_name}'")
    try:
        url = create_google_drive_folder(folder_name)
        return f"La cartella Google Drive è stata creata con successo. Link: {url}\nFornisci questo link all'utente."
    except Exception as e:
        return f"Errore critico durante la creazione della Cartella: {str(e)}"

tools = [search_atena_knowledge_base, search_live_internet, generate_legal_document, send_communication_tool, create_google_workspace_doc, create_google_workspace_folder]
tool_node = ToolNode(tools)

# ==========================================
# 3. LLM INITIALIZATION
# ==========================================
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    max_tokens=None,
    timeout=None,
    google_api_key=GEMINI_API_KEY
).bind_tools(tools)

# ==========================================
# 4. NODI COGNITIVI
# ==========================================
def triage_node(state: AgentState):
    """Nodo Triage iniziale. Determina se serve Human-in-the-Loop."""
    print("\n[Triage Agent] Valutazione Pragmatica dell'Emergenza Legale...")
    messages = state["messages"]
    
    # Costruiamo il contesto delle ultime interazioni per capire se la domanda è diventata chiara
    history_str = "\n".join([f"{'User' if isinstance(m, HumanMessage) else 'Atena'}: {m.content}" for m in messages[-3:]])
    
    triage_prompt = f"""
    Sei il Triage di Emergenza dell'Intelligenza Legale Atena.
    Analizza la storia recente della conversazione. Il tuo SOLO scopo è capire se l'ultima richiesta dell'utente è un'emergenza legale VAGA (mancano dati fondamentali) o una richiesta CHIARA.
    
    ESEMPI VAGHI (Mancano dati per l'RAG):
    - "Mi ha fermato la polizia, cosa faccio?" (Manca parametro fondamentale: Eri a piedi o alla guida?)
    - "Mi hanno appena licenziato, aiutami" (Manca parametro fondamentale: Per giusta causa? Quale CCNL?)
    
    ESEMPI CHIARI (O non emergenze):
    - "Cos'è l'Habeas Corpus?"
    - "Spiegami l'art 186 C.d.S."
    - "Mi ha fermato la polizia e stavo guidando l'auto, ho rifiutato il test dell'etilometro."
    - Se nei messaggi precedenti l'utente ha GIÀ risposto alla tua domanda di disambiguazione (es. "ero alla guida"), allora ora la situazione è CHIARA.
    
    RISPOSTE AMMESSE (Devi rispondere SOLO in formato JSON valido, nessun markdown extra, niente backticks, usa le doppie virgolette per le chiavi JSON):
    
    Se la situazione finale è VAGA e serve disambiguazione umana:
    {{"needs_disambiguation": true, "triage_message": "Sii collaborativo! Prima di invocare la legge, dimmi: eri alla guida o a piedi?"}}
    
    Se la situazione finale è CHIARA (o non è un'emergenza, o l'utente ha appena risposto al tuo triage fornendo i dati mancanti):
    {{"needs_disambiguation": false, "triage_message": ""}}
    
    Conversazione Recente:
    {history_str}
    """
    
    try:
        triage_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.0)
        triage_res = triage_llm.invoke([HumanMessage(content=triage_prompt)])
        
        # Pulizia robusta del JSON dai backticks di Markdown
        clean_json = triage_res.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        
        needs_disambig = data.get("needs_disambiguation", False)
        triage_msg = data.get("triage_message", "")
        
        if needs_disambig:
            print(f"   => [HitL TRIGGERED] Richiesta Disambiguazione: {triage_msg}")
        else:
            print("   => [PASS] Query chiara, procedo all'Agente RAG.")
            
        return {"needs_disambiguation": needs_disambig, "triage_message": triage_msg}
        
    except Exception as e:
        print(f"Errore parsing JSON Triage: {e} -> Bypass di emergenza (RAG diretto).")
        return {"needs_disambiguation": False, "triage_message": ""}

def agent_node(state: AgentState):
    """Nodo Principale."""
    print("\n[Atena Agent] Analizzando il contesto e scegliendo i Tools...")
    sys_msg = SystemMessage(content="""
    Sei Atena, Magistrato Supremo e Intelligenza Legale Artificiale Autonoma.
    
    Hai a disposizione SEI strumenti principali:
    1. search_atena_knowledge_base: Usa questo per richiamare la memoria storica. La Costituzione, il Codice Civile, i Principi generali. (L'Occhio di Roma).
    2. search_live_internet: Usa questo per catturare l'istante presente. Nuove circolari, decreti di ieri, notizie di attualità non ancora consolidate.
    3. generate_legal_document: Usa questo tool QUANDO l'utente chiede esplicitamente di generare un file PDF da scaricare.
    4. send_communication_tool: Usa questo tool QUANDO l'utente chiede esplicitamente di "inviare un'email" O QUANDO dà la sua CONFERMA per inviare una bozza appena preparata.
    5. create_google_workspace_doc: Usa questo tool in priorità rispetto al PDF quando l'utente ti chiede di "redigere un atto su Docs", "Generare un Google Doc" o "Salvare su Drive".
    6. create_google_workspace_folder: Usa questo tool QUANDO l'utente chiede esplicitamente di "creare una cartella" o "organizzare file" su Google Drive.
    
    Se una domanda richiede elaborazioni complesse o l'utilizzo di più tool in sequenza, fallo usando tutti i tool necessari.
    Rispondi sempre con eleganza, precisione e freddezza tattica.
    """)
    messages = [sys_msg] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}

def fact_checker_node(state: AgentState) -> dict:
    """Verificatore di Allucinazioni."""
    print("\n[Fact Checker] Verifico la conformità della bozza di risposta...")
    last_message = state["messages"][-1]
    
    if isinstance(last_message, AIMessage) and not last_message.tool_calls:
        checker_prompt = f"""
        Sei l'Inquisitore Interno di Atena. Il tuo compito è individuare bugie o allucinazioni ESCLUSIVAMENTE su questioni giuridiche e legali.
        
        Regole di Valutazione:
        1. Se la risposta afferma l'esistenza di leggi oggettivamente inventate, inesistenti, o palesemente assurde, rispondi ESATTAMENTE con: "REJECT".
        2. Se la risposta è giuridicamente corretta, ammette di non avere dati precisi, OPPURE è una pura conversazione operativa (es. conferme d'invio email, saluti, generazione PDF completata), rispondi ESATTAMENTE con: "APPROVE".
        
        Risposta da verificare:
        {last_message.content}
        """
        eval_llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.0)
        evaluation = eval_llm.invoke([HumanMessage(content=checker_prompt)])
        print(f"   => Esito Verifica: {evaluation.content.strip()}")
        
        if "REJECT" in evaluation.content.upper():
            return {"messages": [SystemMessage(content="[FACT CHECKER SYSTEM INJECTION] La risposta contiene possibili informazioni false o inesatte. Non ipotizzare leggi inesistenti. Affidati ai Tool o dichiara di non avere dati sufficienti in merito.")]}
            
    return {"messages": []}

# ==========================================
# 5. GRAFO E WORKFLOW
# ==========================================
def check_triage(state: AgentState) -> Literal["interrupt", "agent"]:
    """Valuta se interrompere il grafo per Triage HitL o procedere all'Agente RAG."""
    if state.get("needs_disambiguation", False):
        return "interrupt"
    return "agent"

def should_continue(state: AgentState) -> Literal["tools", "fact_checker"]:
    messages = state['messages']
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tools"
    return "fact_checker"

def check_reflection(state: AgentState) -> Literal["agent", END]:
    messages = state['messages']
    last_message = messages[-1]
    if isinstance(last_message, SystemMessage) and "FACT CHECKER" in last_message.content:
        return "agent" 
    return END

workflow = StateGraph(AgentState)
workflow.add_node("triage", triage_node)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)
workflow.add_node("fact_checker", fact_checker_node)

workflow.add_edge(START, "triage")
workflow.add_conditional_edges("triage", check_triage, {"interrupt": END, "agent": "agent"})
workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", "fact_checker": "fact_checker"})
workflow.add_edge("tools", "agent")
workflow.add_conditional_edges("fact_checker", check_reflection, {"agent": "agent", END: END})

app = workflow.compile(checkpointer=MemorySaver())

def main():
    print("====================================================")
    print("ATENA OMNISCIENCE: Multi-Tool Agent")
    print("====================================================\n")
    config = {"configurable": {"thread_id": "omniscient_capitano"}}
    
    while True:
        user_input = input("Capitano > ")
        if user_input.lower() in ['esci', 'exit']:
            break
            
        print("\n--- Inizio Flusso Graph ---")
        try:
            for event in app.stream({"messages": [("user", user_input)]}, config, stream_mode="updates"):
                for node_name, node_state in event.items():
                    if node_name == "triage":
                        if node_state.get("needs_disambiguation"):
                            print(f"\n[DISAMBIGUAZIONE RICHIESTA]: {node_state.get('triage_message')}")
                    elif "messages" in node_state and len(node_state["messages"]) > 0:
                        msg = node_state["messages"][-1]
                        if node_name == "agent" and isinstance(msg, AIMessage) and not msg.tool_calls:
                           print(f"\n[Bozza Iniziale]: {msg.content}")
                        elif node_name == "fact_checker" and isinstance(msg, SystemMessage):
                           print(f"\n[REJECT]: Atena rielabora la risposta in base ai fatti reali.")
                           
            final_state = app.get_state(config)
            if final_state.values.get("needs_disambiguation"):
                print(f"\n✅ [ATENA TRIAGE]:\n{final_state.values.get('triage_message')}\n")
            else:
                final_msg = final_state.values["messages"][-1]
                print(f"\n✅ [ATENA SUPREMA]:\n{final_msg.content}\n")

        except Exception as e:
            print(f"❌ Errore critico nel grafo: {e}")

if __name__ == "__main__":
    main()
