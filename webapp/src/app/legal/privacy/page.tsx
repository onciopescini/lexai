import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#fbfbfd] text-slate-800 py-20 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <ShieldCheck className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Privacy Policy
          </h1>
        </div>
        
        <div className="prose prose-slate max-w-none bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-8 sm:p-12 shadow-sm">
          <p className="text-slate-500 font-medium">Ultimo aggiornamento: 15 Marzo 2026</p>
          
          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Titolare del Trattamento</h2>
          <p className="text-slate-700 leading-relaxed">
            Atena AI Legal Systems (di seguito &quot;Atena&quot; o &quot;Piattaforma&quot;) tratta i dati personali in conformità al Regolamento Generale sulla Protezione dei Dati (GDPR - EU 2016/679) e alla normativa Privacy nazionale vigente.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Dati Raccolti</h2>
          <p className="text-slate-700 leading-relaxed">
            Raccogliamo rigorosamente e unicamente i dati necessari al funzionamento del servizio e all&apos;erogazione delle funzionalità Premium:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-700">
            <li><strong>Dati di Query:</strong> Testo dei prompt e interrogazioni inviate ad Atena (esclusivamente per fini di esecuzione contestuale).</li>
            <li><strong>Dati Transitori:</strong> Documenti e immagini caricati temporaneamente per l&apos;analisi limitatamente al tempo di sessione. Vengono epurati dal sistema a ciclo concluso se non salvati volontariamente nel Workspace o Knowledge Base dell&apos;utente.</li>
            <li><strong>Metadati di Telemetria:</strong> Dati di diagnostica ed eventi di utilizzo volti a migliorare il &quot;Telemetry Truth&quot; per il refinement asincrono del sistema (sempre in formato anonimo o aggregato).</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. Utilizzo dell&apos;Intelligenza Artificiale Generativa</h2>
          <p className="text-slate-700 leading-relaxed">
            Atena opera integrando modelli linguistici di grandi dimensioni (LLM) proprietari e API di primari fornitori terzi. I prompt, le query e i contesti forniti dagli utenti possono transitare, per mezzo di connessioni criptate e sicure, sui server di tali fornitori terzi al puro scopo di inferenza.
            Raccomandiamo <strong>vivamente</strong> e perentoriamente agli utenti di oscurare qualsivoglia informazione sensibile e dato personale (PII) non strettamente necessari al chiarimento del quesito giuridico.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Diritti dell&apos;Utente</h2>
          <p className="text-slate-700 leading-relaxed">
            I soggetti interessati possono in qualsiasi momento far valere i propri diritti ex artt. 15 e seguenti del GDPR, tra cui:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-700">
            <li>Il diritto di accesso, rettifica o cancellazione (diritto all&apos;oblio) dei propri dati.</li>
            <li>Il diritto di limitazione od opposizione al trattamento.</li>
            <li>Il diritto alla portabilità dei dati strutturati.</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4">
            Per l&apos;esercizio dei diritti è possibile inoltrare tempestiva richiesta a: <strong>privacy@atena-legal.ai</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
