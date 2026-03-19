import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

# SCOPES per avere pieno accesso a Google Docs e Google Drive
SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive"
]

def authenticate_google():
    """Mostra la pagina di login Google e salva il token.json"""
    creds = None
    
    # Il file token.json memorizza i token di accesso e di aggiornamento
    # Si crea automaticamente la prima volta che l'Auth Flow ha successo
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # Se non ci sono credenziali (o sono invalide), l'utente si logga
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            # Usa la porta fissa 8080 per far combaciare l'URL di redirect configurato su Google Cloud
            creds = flow.run_local_server(port=8080)
            
        # Salva le credenziali create per i prossimi run degli Agenti
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
            
    print("✅ Autenticazione OAuth completata con successo! Il file 'token.json' è stato generato.")
    return creds

if __name__ == '__main__':
    authenticate_google()
