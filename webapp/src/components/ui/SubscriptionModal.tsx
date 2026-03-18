'use client';

import React, { useState } from 'react';

interface SubscriptionModalProps {
  onClose: () => void;
  userEmail: string;
}

export default function SubscriptionModal({ onClose, userEmail }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Errore durante la creazione del checkout: " + (data.error || "Sconosciuto"));
      }
    } catch (err) {
      console.error(err);
      alert("Errore di rete contattando Stripe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bg-white/80 rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/40">
        
        {/* Left Side: Premium Features */}
        <div className="flex-1 p-10 flex flex-col justify-center bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-200 bg-purple-100/50 mb-6 w-max">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-[10px] font-black tracking-widest text-purple-700 uppercase">Atena Premium</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
             Il potere legale,<br/>senza compromessi.
          </h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
             Sblocca le funzionalità avanzate di Atena per dominare ogni caso: analisi di fascicoli PDF multi-pagina, generazione di immagini per presentazioni e ricerca ibrida prioritaria.
          </p>
          
          <ul className="flex flex-col gap-4">
            {[
              "Analisi di Documenti PDF illimitata",
              "Accesso al RAG Semantico Multimodale",
              "Creazione di Mappe Mentali complesse",
              "Creazione Atti su Google Docs",
              "Assistenza AI Prioritaria in Tempo Reale",
              "Generazione Grafici e Immagini via Imagen 4"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side: Pricing Card */}
        <div className="flex-1 p-10 flex items-center justify-center bg-white">
          <div className="w-full max-w-sm rounded-[32px] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-8 text-center flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full filter blur-2xl -z-10"></div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Piano Professionale</h3>
            <div className="flex items-end justify-center gap-1 mb-6">
              <span className="text-5xl font-black text-slate-900">€29</span>
              <span className="text-slate-500 font-medium mb-1">/mese</span>
            </div>

            <p className="text-sm text-slate-500 font-medium mb-8">
              Fatturazione mensile. Cancella in qualsiasi momento. Supporto dedicato incluso.
            </p>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 rounded-[24px] bg-slate-900 text-white font-bold text-sm shadow-[0_5px_20px_rgba(0,0,0,0.15)] hover:bg-slate-800 hover:shadow-[0_8px_30px_rgba(59,130,246,0.3)] transition-all active:scale-[0.98] flex justify-center items-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Abbonati Ora'}
            </button>
            <div className="mt-4 text-xs font-bold text-slate-400">
               Pagamento sicuro gestito da Stripe
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

