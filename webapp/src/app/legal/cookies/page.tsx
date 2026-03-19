import React from 'react';
import { Activity } from 'lucide-react';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#fbfbfd] text-slate-800 py-20 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Activity className="h-8 w-8 text-teal-600" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
            Cookie Policy
          </h1>
        </div>
        
        <div className="prose prose-slate max-w-none bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-8 sm:p-12 shadow-sm">
          <p className="text-slate-500 font-medium">Ultimo aggiornamento: 15 Marzo 2026</p>
          
          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Definizioni</h2>
          <p className="text-slate-700 leading-relaxed">
            I cookie sono stringhe di testo di piccole dimensioni che i siti visitati dall&apos;utente posizionano all&apos;interno del dispositivo dell&apos;utente medesimo. Il loro scopo è salvaguardare il mantenimento di uno stato persistente ad ogni richiesta HTTP verso le API e i server erogatori del servizio.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Classificazioni e Utilizzo di Atena</h2>
          <p className="text-slate-700 leading-relaxed">
            La Piattaforma Atena imposta la propria politica sull&apos;uso <strong>esclusivo di cookie tecnici e di funzionalità crittografata</strong>. Il sistema fa largo impiego di Cookie di Sicurezza e Sessione per le seguenti operazioni mission-critical:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-700">
            <li><strong>Sessione Autenticata (Supabase Auth):</strong> Gestione resiliente e impenetrabile dei token JWT d&apos;accesso ai servizi Premium Ecosistemici e della connessione protetta via Supabase in real-time.</li>
            <li><strong>Thread ID Retention:</strong> Stoccaggio temporaneo e recupero in failover delle chiavi di indicizzazione cronologica dei messaggi chat associati al Workspace.</li>
            <li><strong>Caching CSRF:</strong> Sicurezza crittografica integrata in Next.js Middleware contro manomissioni e Request Forgery.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. Nessun Profilamento di Terze Parti</h2>
          <p className="text-slate-700 leading-relaxed">
            La Piattaforma <strong>non implementa</strong>, progetta né inserisce alcun protocollo o blocco di cookie proprietario o associativo volto alla determinazione incrociata (profilazione commerciale incrociata o remarketing profilato invasivo) delle abitudini di acquisto o navigazione degli utenti al fine di cessione dati a terzi a scopo di lucro. Gli unici tracciatori tecnici di terze parti per i passaggi di rete derivano strettamente dall&apos;infrastruttura Edge (es. Vercel) a salvaguardia delle performance e dal firewall proxy di Stripe Checkout per l&apos;esazione sicura dell&apos;Abbonamento Premium.
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Base Giuridica ed Esenzione di Blocco</h2>
          <p className="text-slate-700 leading-relaxed">
            Considerato che i cookie sopra menzionati godono dello status di &quot;strettamente necessari ai sensi della Direttiva ePrivacy e successive interpretazioni dell&apos;EDPB&quot; per procedere all&apos;esecuzione del servizio stesso esplicitamente e consapevolmente richiesto dall&apos;utente abbonato (fornitura Piattaforma AI Legale), Atena è esentata dall&apos;obbligo del Cookie Banner bloccante preventivo a fini di consenso. La non accettazione dei suddetti cookie a monte operata sui Settings del Web Browser impedirà matematicamente e fisicamente l&apos;autenticazione ed esecuzione di qualsivoglia operazione logica.
          </p>
        </div>
      </div>
    </div>
  );
}
