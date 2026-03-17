import schedule
import time
import os
import subprocess
from datetime import datetime

print("==================================================")
print(" ATENA SOCIAL SCHEDULER - LA LEGGE DEL GIORNO")
print("==================================================")
print(f"Avviato alle: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("Il bot pubblicherà un nuovo approfondimento ogni giorno alle 10:00 (o in base all'intervallo di test).")

def run_social_bot():
    print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Esecuzione atena_social_bot.py in corso...")
    try:
        # Usa subprocess per richiamare lo script in modo pulito
        result = subprocess.run(["python", "atena_social_bot.py"], capture_output=True, text=True, check=True)
        print("Successo! Output:")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Errore durante l'esecuzione del bot. Codice di uscita: {e.returncode}")
        print("Error log:")
        print(e.stderr)

# Configura lo scheduling.
# In produzione potrebbe essere: schedule.every().day.at("10:00").do(run_social_bot)
# Per testing, eseguiamo ogni 2 ore.
schedule.every(2).hours.do(run_social_bot)

# Run once immediately on startup for testing purposes
run_social_bot()

try:
    while True:
        schedule.run_pending()
        time.sleep(60) # Controlla ogni minuto
except KeyboardInterrupt:
    print("\nScheduler terminato manualmente dall'utente.")
