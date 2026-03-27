'use client';

import React, { useState } from 'react';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export interface GuardianAlert {
  id: string;
  title: string;
  summary: string;
  impact_level: string;
  target_audience: string;
  source_url: string;
  date_published: string;
  created_at: string;
  dynamic_impacts?: Record<string, string>;
  dynamicImpact?: string; // Add optional dynamicImpact string
}

interface RadarTimelineProps {
  loading: boolean;
  processedAlerts: GuardianAlert[];
  profile: string;
}

const getImpactStyles = (impact: string | undefined) => {
  if (!impact) return { ribbon: 'bg-blue-500', cardGlow: 'hover:shadow-[0_20px_60px_rgba(59,130,246,0.1)] hover:border-blue-200', textGlow: 'group-hover:text-blue-600', button: 'text-blue-700 bg-blue-50 hover:bg-blue-600 border-blue-100' };
  switch (impact.toLowerCase()) {
    case 'high': return { ribbon: 'bg-rose-500', cardGlow: 'hover:shadow-[0_20px_60px_rgba(244,63,94,0.15)] hover:border-rose-300', textGlow: 'group-hover:text-rose-600', button: 'text-rose-700 bg-rose-50 hover:bg-rose-600 border-rose-100 hover:text-white' };
    case 'medium': return { ribbon: 'bg-amber-500', cardGlow: 'hover:shadow-[0_20px_60px_rgba(245,158,11,0.15)] hover:border-amber-300', textGlow: 'group-hover:text-amber-600', button: 'text-amber-700 bg-amber-50 hover:bg-amber-600 border-amber-100 hover:text-white' };
    case 'low': return { ribbon: 'bg-emerald-500', cardGlow: 'hover:shadow-[0_20px_60px_rgba(16,185,129,0.15)] hover:border-emerald-300', textGlow: 'group-hover:text-emerald-600', button: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-600 border-emerald-100 hover:text-white' };
    default: return { ribbon: 'bg-blue-500', cardGlow: 'hover:shadow-[0_20px_60px_rgba(59,130,246,0.1)] hover:border-blue-300', textGlow: 'group-hover:text-blue-600', button: 'text-blue-700 bg-blue-50 hover:bg-blue-600 border-blue-100 hover:text-white' };
  }
};

const RadarAlertCard = ({ alert, idx }: { alert: GuardianAlert, idx: number }) => {
  const [expanded, setExpanded] = useState(false);
  const styles = getImpactStyles(alert.dynamicImpact);

  return (
    <div className={`relative group bg-white/70 backdrop-blur-2xl border border-slate-200/60 p-8 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-500 animate-fade-in-up ${styles.cardGlow}`} style={{animationDelay: `${idx * 100}ms`}}>
       <div className={`absolute top-0 right-8 px-4 py-1.5 rounded-b-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-sm ${styles.ribbon}`}>
          Impatto {alert.dynamicImpact || 'Sconosciuto'}
       </div>

       <div className="flex flex-wrap items-center gap-3 mb-5 mt-2">
          <span className="text-[11px] text-slate-500 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm uppercase tracking-wider">
             {new Date(alert.date_published).toLocaleDateString('it-IT')}
          </span>
          {alert.target_audience && (
             <span className="text-[11px] font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm uppercase tracking-wider">
                Destinazione: {alert.target_audience}
             </span>
          )}
       </div>

       <h2 className={`text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 transition-colors leading-tight ${styles.textGlow}`}>
          {alert.title}
       </h2>

       <div className="flex items-center gap-2 mb-6 p-2.5 bg-emerald-50/80 rounded-[14px] border border-emerald-100 w-max shadow-sm">
          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Sintesi Verificata - Fonti Ufficiali</span>
       </div>
       
       <div className="relative mb-6 max-w-4xl">
           <div className={`text-[15px] leading-relaxed font-medium text-slate-600 transition-all duration-300 ${expanded ? '' : 'line-clamp-3'}`}>
              <MarkdownRenderer content={alert.summary} />
           </div>
           {!expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-50/80 to-transparent pointer-events-none" />
           )}
       </div>
       
       <button 
         onClick={() => setExpanded(!expanded)} 
         className="text-[11px] font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest flex items-center gap-1.5 mb-8 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/50 hover:border-slate-300 transition-colors shadow-sm"
       >
         {expanded ? 'Nascondi Analisi' : 'Espandi Analisi Completa'}
         <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
       </button>

       <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <a href={alert.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-700 transition-colors shadow-sm">
             Leggi Fonte Integrale
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
          <div className="flex items-center gap-3">
             <button className="text-[13px] font-bold text-slate-400 hover:text-slate-600 px-4 py-2 transition-colors">Condividi</button>
             <button className={`text-[13px] font-bold px-5 py-3 rounded-2xl transition-all shadow-sm border ${styles.button}`}>
               Analizza Impatto Specifico
             </button>
          </div>
       </div>
    </div>
  );
};

export default function RadarTimeline({ loading, processedAlerts, profile }: RadarTimelineProps) {
  return (
    <div className="mt-4">
      <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
         <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
         Radar Timeline ({processedAlerts.length} allerte rilevanti)
      </h3>
      
      {loading ? (
          <div className="flex flex-col gap-6">
              {[1,2,3].map(i => (
                  <div key={i} className="w-full p-8 rounded-[32px] bg-white/40 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] animate-pulse">
                     <div className="w-32 h-6 bg-slate-200/60 rounded mb-4"></div>
                     <div className="w-full h-8 bg-slate-200/60 rounded mb-4"></div>
                     <div className="w-2/3 h-4 bg-slate-200/60 rounded mb-2"></div>
                     <div className="w-1/2 h-4 bg-slate-200/60 rounded mb-6"></div>
                  </div>
              ))}
          </div>
      ) : processedAlerts.length === 0 ? (
          <div className="w-full text-center py-20 bg-white/40 backdrop-blur-md rounded-[32px] border border-slate-200/50 flex flex-col items-center gap-4">
            <span className="text-5xl border p-4 rounded-full bg-slate-50 border-slate-100">📡</span>
            <h3 className="text-lg font-bold text-slate-700">Radar Libero per il tuo Profilo</h3>
            <p className="text-sm text-slate-500 font-medium">Nessuna allerta legislativa di impatto rilevata di recente per <b>{profile}</b>.</p>
          </div>
      ) : (
          <div className="flex flex-col gap-8">
            {processedAlerts.map((alert, idx) => (
                <RadarAlertCard key={alert.id} alert={alert} idx={idx} />
            ))}
          </div>
      )}
    </div>
  );
}
