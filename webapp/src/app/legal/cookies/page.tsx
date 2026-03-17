import React from 'react';
import { Activity } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-20 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Activity className="h-8 w-8 text-emerald-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
            Cookie Policy
          </h1>
        </div>
        
        <div className="prose prose-invert prose-emerald max-w-none">
          <p className="text-slate-400">Ultimo aggiornamento: 15 Marzo 2026</p>
          
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Cosa sono i Cookie</h2>
          <p>
            I cookie sono piccoli file di testo che i siti visitati inviano al terminale dell&apos;utente, dove vengono memorizzati, per poi essere ritrasmessi agli stessi siti alla visita successiva.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Tipologie di Cookie usati da Atena</h2>
          <p>
            Allo stato attuale, la Piattaforma Atena utilizza **esclusivamente cookie tecnici e di sessione**, strettamente necessari per:
            <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-300">
              <li>Mantenere lo stato di autenticazione dell&apos;utente (via Supabase Auth).</li>
              <li>Preservare i thread identificativi (Thread ID) delle chat in corso.</li>
              <li>Garantire il corretto routing delle chiamate API in Next.js.</li>
            </ul>
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Cookie di Terze Parti e Tracciamento</h2>
          <p>
            Atena **non** impiega attivamente cookie di profilazione marketing proprietari. Tuttavia, potrebbero essere iniettati cookie tecnici da provider infrastrutturali (Vercel, Cloudflare, Supabase) necessari all&apos;erogazione e sicurezza del traffico.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Gestione Consenso</h2>
          <p>
            Essendo cookie strettamente necessari, non è richiesto in via preventiva un banner di consenso bloccante (direttiva ePrivacy e linee guida EDPB), ma l&apos;utente può comunque configurare il browser per rifiutarli, consapevole che ciò impedirà il funzionamento della chat AI.
          </p>
        </div>
      </div>
    </div>
  );
}
