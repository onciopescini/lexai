import sys
import os
try:
    from workspace_integrations import create_google_doc, create_google_drive_folder
    
    print("Testing Google Drive Folder Creation...")
    folder_url = create_google_drive_folder("Atena_Test_Folder")
    print(f"Folder URL: {folder_url}")
    
    print("Testing Google Docs Document Creation...")
    doc_url = create_google_doc("Atena_Test_Document", "Questo è un test automatico di Atena per verificare i permessi Google Workspace.")
    print(f"Doc URL: {doc_url}")

    print("\n✅ Test E2E Google Workspace superato!")

except Exception as e:
    print(f"❌ Errore durante i test E2E: {str(e)}")
