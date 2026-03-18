import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-marble-50 text-slate-800 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Torna alla Home
        </Link>
      </div>
      <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-3xl border border-marble-200/50 p-8 md:p-12 rounded-[32px] shadow-lg">
        <h1 className="text-4xl text-slate-900 font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-slate-700 leading-relaxed">
          <p>
            Benvenuto su Atena. La tua privacy è estremamente importante per noi. Questa Privacy Policy spiega come raccogliamo, 
            utilizziamo, divulghiamo e proteggiamo le tue informazioni quando visiti il nostro sito web e utilizzi il nostro 
            servizio di intelligenza artificiale per la ricerca legale.
          </p>

          <h2 className="text-2xl text-slate-900 font-semibold mt-8 mb-4">1. Informazioni che Raccogliamo</h2>
          <p>
            Raccogliamo informazioni personali che ci fornisci volontariamente quando ti registri sulla piattaforma, esprimi un interesse 
            per ottenere informazioni su di noi o sui nostri prodotti e servizi, quando partecipi ad attività sulla piattaforma o 
            altrimenti quando ci contatti. Le informazioni personali che raccogliamo dipendono dal contesto delle tue interazioni 
            con noi e con la piattaforma, dalle scelte che fai e dai prodotti e dalle funzionalità che utilizzi.
          </p>

          <h2 className="text-2xl text-slate-900 font-semibold mt-8 mb-4">2. Come Utilizziamo le Tue Informazioni</h2>
          <p>
            Utilizziamo le informazioni personali raccolte tramite la nostra piattaforma per una serie di scopi aziendali descritti di seguito. 
            Elaboriamo le tue informazioni personali per questi scopi contando sui nostri legittimi interessi commerciali, per stipulare 
            o eseguire un contratto con te, con il tuo consenso e/o per ottemperare ai nostri obblighi legali.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Per facilitare la creazione dell&apos;account e l&apos;accesso ai servizi di query legali.</li>
            <li>Per inviare informazioni amministrative, di prodotto o avvisi di sicurezza.</li>
            <li>Per ottimizzare i modelli di risposta dell&apos;intelligenza artificiale in formato anonimizzato.</li>
          </ul>

          <h2 className="text-2xl text-slate-900 font-semibold mt-8 mb-4">3. Condivisione delle Informazioni</h2>
          <p>
            Non condividiamo, vendiamo, affittiamo o scambiamo nessuna delle tue informazioni con terze parti per i loro scopi promozionali.
            Condividiamo informazioni esclusivamente per le necessità operative con i nostri fornitori (es. OpenAI, Supabase, Vercel) sotto stretti vincoli di sicurezza.
          </p>

          <h2 className="text-2xl text-slate-900 font-semibold mt-8 mb-4">4. I Tuoi Diritti Privacy (GDPR)</h2>
          <p>
            Se sei residente nello Spazio Economico Europeo (SEE), hai specifici diritti sulla privacy dei dati in base al GDPR.
            Hai il diritto di richiedere l&apos;accesso, l&apos;aggiornamento o la cancellazione delle tue informazioni personali 
            direttamente dal tuo account o contattandoci via email.
          </p>
        </div>
      </div>
    </div>
  );
}

