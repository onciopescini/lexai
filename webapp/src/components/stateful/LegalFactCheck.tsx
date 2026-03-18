'use client';

import { useState } from 'react';

interface FactCheckClaim {
  claim: string;
  verdict: 'verified' | 'partial' | 'unsupported' | 'opinion';
  source_ref: string;
  explanation: string;
}

interface FactCheckReport {
  overall_score: number;
  total_claims: number;
  verified: number;
  partial: number;
  unsupported: number;
  opinion: number;
  claims: FactCheckClaim[];
  methodology: string;
}

const verdictConfig = {
  verified:    { icon: '✅', label: 'Verificato',     color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  partial:     { icon: '⚠️', label: 'Parziale',       color: 'amber',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400' },
  unsupported: { icon: '❌', label: 'Non Supportato', color: 'red',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400' },
  opinion:     { icon: 'ℹ️', label: 'Opinione',       color: 'blue',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400' },
};

function ScoreCircle({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return '#10b981'; // emerald
    if (s >= 60) return '#f59e0b'; // amber
    if (s >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
        <circle 
          cx="40" cy="40" r={radius} 
          stroke={getColor(score)} 
          strokeWidth="6" 
          fill="none" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-800">{score}</span>
        <span className="text-[9px] text-slate-400 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

export default function LegalFactCheck({ report }: { report: FactCheckReport }) {
  const [expanded, setExpanded] = useState(false);

  if (!report || !report.claims) return null;

  return (
    <div className="mt-8 pt-6 border-t border-marble-200 relative animate-fade-in-up">
      <div className="absolute -top-[1px] left-0 w-1/4 h-[1px] bg-gradient-to-r from-platinum-300 to-transparent"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-[24px] bg-blue-500 animate-pulse"></span>
          <h4 className="text-xs font-bold text-slate-600 tracking-widest uppercase">Fact-Check Autonomo (Auto-Validazione)</h4>
        </div>
        <span className="text-[10px] uppercase font-mono text-slate-500 bg-marble-100 border border-marble-200 px-2 py-0.5 rounded-sm">
          Indipendente & Imparziale
        </span>
      </div>

      {/* Summary Card */}
      <div className="p-5 rounded-[24px] bg-white/80 border border-marble-200 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-6">
          {/* Score Circle */}
          <ScoreCircle score={report.overall_score} />
          
          {/* Stats Breakdown */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span>✅</span>
              <span className="text-emerald-600 font-bold">{report.verified}</span>
              <span className="text-slate-500 text-xs">Verificati</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>⚠️</span>
              <span className="text-amber-600 font-bold">{report.partial}</span>
              <span className="text-slate-500 text-xs">Parziali</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>❌</span>
              <span className="text-red-600 font-bold">{report.unsupported}</span>
              <span className="text-slate-500 text-xs">Non Supportati</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>ℹ️</span>
              <span className="text-blue-600 font-bold">{report.opinion}</span>
              <span className="text-slate-500 text-xs">Opinioni</span>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="mt-4 w-full text-center text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors py-2 border-t border-marble-200"
        >
          {expanded ? '▲ Nascondi dettaglio claims' : `▼ Mostra ${report.total_claims} claims analizzati`}
        </button>

        {/* Claims Detail (Expandable) */}
        {expanded && (
          <div className="mt-4 space-y-2 animate-fade-in-up">
            {report.claims.map((claim, idx) => {
              const config = verdictConfig[claim.verdict];
              return (
                <div key={idx} className={`p-3 rounded-[24px] bg-marble-50 border-marble-200 border flex flex-col gap-1.5`}>
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5 shrink-0">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">{claim.claim}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest text-slate-600`}>{config.label}</span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate">{claim.source_ref}</span>
                      </div>
                      {claim.explanation && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed italic">{claim.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Methodology Footer */}
            <div className="pt-3 border-t border-marble-200">
              <p className="text-[10px] text-slate-400 italic leading-relaxed">
                🔒 {report.methodology}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

