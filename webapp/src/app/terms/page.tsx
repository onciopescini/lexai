import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-marble-50 text-slate-800 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Torna alla Home
        </Link>
      </div>
      <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-3xl border border-marble-200/50 p-8 md:p-12 rounded-[32px] shadow-lg">
        <h1 className="text-4xl text-slate-900 font-bold mb-8">Termini di Servizio</h1>
        
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>
            Ultimo aggiornamento: Marzo 2026.
          </p>
          <p>
            Leggere attentamente i presenti Termini di Servizio prima di utilizzare il sito web e l&apos;applicazione Atena Lex.
          </p>

          <h2 className="text-2xl text-slate-900 font-semibold mt-8 mb-4">1. Accettazione dei Termini</h2>
          <p>
            Accedendo o utilizzando i nostri servizi, accetti di essere vincolato da questi Termini e accetti tutte le conseguenze giuridiche. 
            Se non accetti questi termini e condizioni, per intero o in parte, ti raccomandiamo di non utilizzare il Servizio.
          </p>

          <h2 className="text-2xl text-slate-900 font-semibold mt-8 mb-4">2. Nessun Parere Legale (Disclaimer)</h2>
          <p>
            Atena Lex automatizza la ricerca documentale tramite algoritmi AI. <strong>Il sistema non offre consulenza legale.</strong> 
            Tutte le informazioni, i documenti, i riassunti e i riferimenti non sostituiscono in alcun modo il lavoro di un professionista 
            regolarmente iscritto all&apos;albo. Spetta sempre all&apos;utente verificare autonomamente la veridicità e l&apos;applicabilità delle informazioni.
          </p>

          <h2 className="text-2xl text-slate-900 font-semibold mt-8 mb-4">3. Utilizzo Consentito</h2>
          <p>
            Un account registrato consente l&apos;uso personale o limitato alla propria attività professionale dei servizi. 
            Non è consentito condividere le credenziali di accesso, sottoporre il sistema ad attacchi o tentativi di reverse-engineering, 
            o lanciare query automatizzate tramite bot non autorizzati.
          </p>

          <h2 className="text-2xl text-slate-900 font-semibold mt-8 mb-4">4. Rinnovo e Cancellazione</h2>
          <p>
            Nei piani a pagamento, l&apos;abbonamento si rinnova automaticamente fino a cancellazione, che può 
            essere effettuata in qualsiasi momento. Non si effettuano rimborsi per cicli di fatturazione già iniziati.
          </p>
        </div>
      </div>
    </div>
  );
}

