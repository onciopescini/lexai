'use client';

import { useState, useEffect } from 'react';

const phases = [
  { icon: '🔍', label: 'Analisi semantica della domanda', sublabel: 'Embedding vettoriale in corso...' },
  { icon: '📚', label: 'Interrogazione database legale', sublabel: 'Supabase pgvector + Perplexity Sonar' },
  { icon: '🧠', label: 'Sintesi con Intelligenza Artificiale', sublabel: 'Gemini 2.5 Flash — generazione risposta' },
  { icon: '⚔️', label: 'Protocollo Decimo Uomo', sublabel: 'Verifica incrociata indipendente' },
  { icon: '🛡️', label: 'Fact-Check autonomo', sublabel: 'Validazione claims contro fonti ufficiali' },
  { icon: '🎨', label: 'Generazione illustrazione', sublabel: 'Google Imagen 4 — visual intelligence' },
];

const legalTips = [
  '💡 Lo sapevi? La Costituzione Italiana è composta da 139 articoli e XVIII Disposizioni Transitorie e Finali.',
  '📜 Curiosità: Il Codice Civile Italiano fu promulgato nel 1942 e contiene oltre 2.900 articoli.',
  '⚖️ Il principio "ignorantia legis non excusat" significa che non si può invocare l\'ignoranza della legge come scusa.',
  '🏛️ La Corte Costituzionale italiana è composta da 15 giudici e ha sede nel Palazzo della Consulta a Roma.',
  '📖 L\'Art. 3 della Costituzione sancisce il principio di uguaglianza: "Tutti i cittadini hanno pari dignità sociale".',
  '🔒 Il GDPR (Reg. UE 2016/679) è diventato applicabile il 25 maggio 2018 in tutti gli Stati membri UE.',
  '⚡ Atena analizza fino a 5 database in parallelo per ogni tua domanda.',
  '🤖 Il Protocollo Decimo Uomo verifica ogni risposta cercando attivamente falle e interpretazioni alternative.',
];

export default function ThinkingIndicator() {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Advance phases progressively (simulate pipeline)
    const phaseTimings = [800, 2500, 5000, 8000, 10000, 12000];
    const timers = phaseTimings.map((ms, idx) =>
      setTimeout(() => setCurrentPhase(idx), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    // Rotate tips every 4 seconds
    const tipTimer = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % legalTips.length);
    }, 4000);
    return () => clearInterval(tipTimer);
  }, []);

  useEffect(() => {
    // Elapsed seconds counter
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full animate-fade-in-up">
      <div className="p-6 rounded-[32px] rounded-tl-sm bg-gradient-to-b from-[#F5F0EB] to-[#EDE5DB] border border-[#D4C8B8]/40 relative overflow-hidden shadow-2xl">
        {/* Top progress glow */}
        <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 animate-shimmer" 
               style={{ width: '200%', animation: 'shimmer 2s ease-in-out infinite' }}></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center shadow-[0_0_10px_rgba(30,30,30,0.3)]">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-sm font-semibold text-slate-700/80 tracking-wider uppercase">Atena sta elaborando...</h3>
          </div>
          <span className="text-xs text-slate-500/40 font-mono tabular-nums">{elapsed}s</span>
        </div>

        {/* Pipeline Phases */}
        <div className="space-y-1.5 mb-5">
          {phases.map((phase, idx) => {
            const isActive = idx === currentPhase;
            const isDone = idx < currentPhase;

            return (
              <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-[24px] transition-all duration-500 ${
                isActive ? 'bg-slate-800/[0.06] border border-slate-400/20' : 
                isDone ? 'opacity-60' : 
                'opacity-25'
              }`}>
                {/* Status indicator */}
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {isDone ? (
                    <span className="text-emerald-600 text-sm">✓</span>
                  ) : isActive ? (
                    <div className="w-3 h-3 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-400/20"></div>
                  )}
                </div>
                
                {/* Phase text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{phase.icon}</span>
                    <span className={`text-sm font-medium ${isActive ? 'text-slate-800' : isDone ? 'text-slate-600' : 'text-slate-400'}`}>
                      {phase.label}
                    </span>
                  </div>
                  {isActive && (
                    <p className="text-[11px] text-slate-500/60 mt-0.5 ml-7 animate-pulse">{phase.sublabel}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legal Tip Rotator */}
        <div className="px-4 py-3 rounded-[24px] bg-slate-800/[0.03] border border-slate-300/10">
          <p className="text-xs text-slate-500/50 leading-relaxed transition-all duration-500" key={currentTip}>
            {legalTips[currentTip]}
          </p>
        </div>
      </div>
    </div>
  );
}

