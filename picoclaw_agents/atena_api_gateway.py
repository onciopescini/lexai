import os
import sys
import json
import asyncio
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Import the LangGraph workflow we built in Campagna 2
# Note: we are importing from atena_langgraph_tools which currently contains the best logic
try:
    from atena_langgraph_tools import app as agent_app
except ImportError:
    print("❌ Errore: atena_langgraph_tools.py non trovato. Assicurarsi di essere nella directory giusta.")
    sys.exit(1)

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

load_dotenv()

app = FastAPI(
    title="Atena API Gateway",
    description="L'Oracolo Integrato: REST/SSE API per comunicare con l'Agente LangGraph.",
    version="1.0.0"
)

# CORS configuration for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"🚨 [Global Exception] Inaspettata eccezione su {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Errore interno al server FastAPI.", "error": str(exc)}
    )

class FilePayload(BaseModel):
    filename: str
    mime_type: str
    data: str

class ChatRequest(BaseModel):
    query: str
    thread_id: str = "default_session"
    file: Optional[FilePayload] = None

@app.get("/")
def read_root():
    return {"status": "Atena API Gateway is online", "version": "1.0.0"}

async def agent_stream_generator(request_data: ChatRequest):
    """
    Generator that runs the LangGraph agent and yields Server-Sent Events (SSE).
    """
    config = {"configurable": {"thread_id": request_data.thread_id}}
    
    # Costruzione del messaggio multimodale se c'è un file allegato
    if request_data.file:
        content = [
            {"type": "text", "text": request_data.query or "Analizza questo documento."},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{request_data.file.mime_type};base64,{request_data.file.data}"}
            }
        ]
        user_message = HumanMessage(content=content)
    else:
        user_message = HumanMessage(content=request_data.query)
    
    # 1. Invia il messaggio iniziale all'utente
    yield f"data: {json.dumps({'type': 'status', 'content': 'Atena sta analizzando la richiesta...' })}\n\n"
    
    try:
        # 2. Eseguiamo l'agent in modalità stream
        # Nota: usiamo stream_mode="updates" per vedere ogni nodo che finisce
        for event in agent_app.stream({"messages": [user_message]}, config, stream_mode="updates"):
            for node_name, node_state in event.items():
                if "messages" in node_state and len(node_state["messages"]) > 0:
                    msg = node_state["messages"][-1]
                    
                    if node_name == "agent" and isinstance(msg, AIMessage) and not msg.tool_calls:
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Formulazione della risposta...'})}\n\n"
                    
                    elif node_name == "tools":
                        # Se il tool ha girato, avvisiamo l'utente
                        yield f"data: {json.dumps({'type': 'tool', 'content': 'Ricerca in corso nei database storici o in rete...'})}\n\n"
                        
                    elif node_name == "fact_checker" and isinstance(msg, SystemMessage):
                        yield f"data: {json.dumps({'type': 'status', 'content': '⚠ Rilevata inesattezza. L\'Inquisitore impone una revisione dei fatti...'})}\n\n"
            
            # Piccolo delay per permettere all'utente di leggere gli status nello streaming
            await asyncio.sleep(0.1)

        # 3. Estraiamo il risultato finale
        final_content = "Sono spiacente, ma si è verificato un errore nel calcolo della risposta."
        
        try:
            final_state = agent_app.get_state(config)
            if final_state and getattr(final_state, 'values', None) and "messages" in final_state.values:
                final_msg = final_state.values["messages"][-1]
                content = final_msg.content
                
                if isinstance(content, list):
                    # Formatta correttamente se Gemini risponde con un array JSON strutturato
                    text_parts = []
                    for item in content:
                        if isinstance(item, dict) and 'text' in item:
                            text_parts.append(item['text'])
                        elif isinstance(item, str):
                            text_parts.append(item)
                    final_content = "\n".join(text_parts) if text_parts else str(content)
                else:
                    final_content = content
            elif 'msg' in locals() and hasattr(msg, 'content'):
                # Fallback on the last seen message in the stream loop
                final_content = msg.content
        except Exception as state_err:
            print(f"Failed to get final state properly: {state_err}")
            if 'msg' in locals() and hasattr(msg, 'content'):
                final_content = msg.content
        
        # 4. Inviamo il chunk finale con la risposta completa
        yield f"data: {json.dumps({'type': 'message', 'content': final_content})}\n\n"
        
    except Exception as e:
        error_msg = f"Errore interno di Atena: {str(e)}"
        print(error_msg)
        yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"
        
    finally:
        yield "data: [DONE]\n\n"


@app.post("/ask")
async def ask_atena(request: ChatRequest):
    """
    Endpoint per avviare una conversazione in streaming (SSE) con l'agente.
    Supporta input multimodali (testo + file Base64).
    """
    return StreamingResponse(
        agent_stream_generator(request), 
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    print("⚖️ Avvio dell'Atena API Gateway (Campagna 3) sulla porta 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
