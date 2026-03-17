import requests
import json
import sys

def test_streaming():
    url = "http://localhost:8000/ask"
    payload = {
        "query": "Cosa è la legge 104 in Italia?",
        "thread_id": "test_user_session_1"
    }
    
    print(f"[*] Chiamando {url} su un flusso streaming (SSE)...")
    
    try:
        with requests.post(url, json=payload, stream=True) as response:
            if response.status_code != 200:
                print(f"[!] Errore HTTP: {response.status_code}")
                sys.exit(1)
            
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith('data: '):
                        data_str = decoded_line[6:]
                        if data_str == "[DONE]":
                            print("\n[OK] Stream concluso.")
                            break
                        try:
                            data_json = json.loads(data_str)
                            tipo = data_json.get('type')
                            content = data_json.get('content')
                            
                            if tipo == 'status':
                                print(f"🔄 [Stato]: {content}")
                            elif tipo == 'tool':
                                print(f"⚙️ [Azione Tool]: {content}")
                            elif tipo == 'message':
                                print(f"\n⚖️ [Atena]:\n{content}")
                            elif tipo == 'error':
                                print(f"❌ [Errore]: {content}")
                                
                        except json.JSONDecodeError as e:
                            print(f"[!] Errore JSON parsando il dato SSE: {data_str}")
    
    except requests.exceptions.ConnectionError:
         print("[!] Impossibile connettersi ad Atena. Assicurarsi che il server FastAPI sia avviato.")

if __name__ == "__main__":
    test_streaming()
