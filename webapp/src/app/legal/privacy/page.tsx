import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-20 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <ShieldCheck className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Privacy Policy
          </h1>
        </div>
        
        <div className="prose prose-invert prose-indigo max-w-none">
          <p className="text-slate-400">Ultimo aggiornamento: 15 Marzo 2026</p>
          
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Titolare del Trattamento</h2>
          <p>
            Atena AI Legal Systems (di seguito &quot;Atena&quot; o &quot;Piattaforma&quot;) tratta i dati personali in conformità al Regolamento Generale sulla Protezione dei Dati (GDPR - EU 2016/679).
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Dati Raccolti</h2>
          <p>
            Raccogliamo unicamente i dati necessari al funzionamento del servizio:
            <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-300">
              <li>Testo dei prompt e query inviate ad Atena (esclusivamente per fini di esecuzione).</li>
              <li>Dati temporanei derivanti da caricamento di documenti e immagini limitatamente al tempo di sessione e cancellati a ciclo concluso se non richiesto diversamente.</li>
              <li>Metadati di diagnostica (feedback positivi/negativi) finalizzati al training anonimizzato del set di regole (Telemetry Truth).</li>
            </ul>
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Utilizzo dell&apos;Intelligenza Artificiale Generativa</h2>
          <p>
            Atena sfrutta API di terze parti (come Google Gemini e Perplexity AI). I testi forniti dagli utenti possono transitare sui server di tali provider. Raccomandiamo **vivamente** agli utenti di offuscare informazioni sensibili e PII (Personally Identifiable Information) non necessarie al quesito giuridico, prima di farle analizzare ad Atena.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Diritti dell&apos;Utente</h2>
          <p>
            Ai sensi del GDPR (Art. 15-22), l&apos;interessato ha diritto a:
            <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-300">
              <li>Accedere, rettificare o cancellare i propri dati.</li>
              <li>Limitare od opporsi al trattamento.</li>
              <li>Richiedere la portabilità dei dati.</li>
            </ul>
            Per esercitare i tuoi diritti, scrivi a: privacy@atena-legal.ai
          </p>
        </div>
      </div>
    </div>
  );
}
