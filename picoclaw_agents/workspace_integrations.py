import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive.file"
]

def get_google_credentials():
    """Gets valid user credentials from storage or initiates OAuth2 flow."""
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Errore nel refresh del token: {e}")
                creds = None
                
        if not creds:
            if not os.path.exists("credentials.json"):
                raise FileNotFoundError(
                    "Il file 'credentials.json' manca. "
                    "Scarica le credenziali OAuth dal Google Cloud Console e salvale nella cartella picoclaw_agents."
                )
            flow = InstalledAppFlow.from_client_secrets_file(
                "credentials.json", SCOPES
            )
            # Use run_local_server for desktop auth flow
            creds = flow.run_local_server(port=0)
            
        # Save the credentials for the next run
        with open("token.json", "w") as token:
            token.write(creds.to_json())
            
    return creds

def create_google_doc(title: str, content: str) -> str:
    """Creates a Google Doc with the specified title and content, returning its URL."""
    try:
        creds = get_google_credentials()
        # Create Google Docs API service
        docs_service = build("docs", "v1", credentials=creds)
        
        # Create the document
        document = docs_service.documents().create(body={"title": title}).execute()
        document_id = document.get("documentId")
        
        # Insert text into the document
        requests = [
            {
                "insertText": {
                    "location": {
                        "index": 1,
                    },
                    "text": content
                }
            }
        ]
        
        result = docs_service.documents().batchUpdate(
            documentId=document_id, body={'requests': requests}).execute()
            
        doc_url = f"https://docs.google.com/document/d/{document_id}/edit"
        print(f"[*] Creato Google Doc: {doc_url}")
        return doc_url
        
    except HttpError as err:
        print(f"Si è verificato un errore HTTP con Google API: {err}")
        return f"Errore API Google Docs: {err}"
    except Exception as e:
        print(f"Errore in create_google_doc: {e}")
        return f"Errore interno: {e}"

if __name__ == "__main__":
    # Test esecuzione diretta per forzare il login OAuth la prima volta
    print("Inizializzo l'autenticazione Google Workspace...")
    try:
        creds = get_google_credentials()
        print("✅ Autenticazione completata con successo. Il token.json è stato generato.")
    except Exception as e:
        print(f"❌ Errore: {e}")
