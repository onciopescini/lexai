'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LegalArticle {
  id: string;
  codice: string;
  libro: string | null;
  titolo: string | null;
  capo: string | null;
  articolo_num: string;
  articolo_titolo: string | null;
  testo: string;
  versione_nome: string;
  is_vigente: boolean;
}

interface AIXRayPanelProps {
  selectedArticle: LegalArticle | null;
  setSelectedArticle: (article: LegalArticle | null) => void;
  isDiffMode: boolean;
  setIsDiffMode: (mode: boolean) => void;
}

interface DiffResult {
  value: string;
  added?: boolean;
  removed?: boolean;
}

interface DiffData {
  oldVersion: string;
  newVersion: string;
  diff: DiffResult[];
}

export default function AIXRayPanel({ selectedArticle, setSelectedArticle, isDiffMode, setIsDiffMode }: AIXRayPanelProps) {
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const [currentArtId, setCurrentArtId] = useState<string | undefined>(selectedArticle?.id);
  
  if (selectedArticle?.id !== currentArtId) {
    setCurrentArtId(selectedArticle?.id);
    setDiffData(null);
  }

  useEffect(() => {
    let isMounted = true;
    const fetchDiff = async () => {
      // Delay to avoid synchronous setState warning inside effect
      await Promise.resolve();
      if (!isMounted) return;
      
      setLoadingDiff(true);
      try {
        const res = await fetch(`/api/library/diff?codice=${encodeURIComponent(selectedArticle!.codice)}&articolo_num=${encodeURIComponent(selectedArticle!.articolo_num)}`);
        const data = await res.json();
        if (isMounted && !data.error) {
          setDiffData(data);
        }
      } catch (err) {
        console.error("Failed to load diff", err);
      } finally {
        if (isMounted) setLoadingDiff(false);
      }
    };

    if (selectedArticle && isDiffMode && !diffData) {
      fetchDiff();
    }

    return () => {
      isMounted = false;
    };
  }, [selectedArticle, isDiffMode, diffData]);

  return (
    <AnimatePresence>
      {selectedArticle && (
        <motion.aside 
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-1/2 bg-white/95 backdrop-blur-xl border-l border-slate-200/50 shadow-[-10px_0_40px_rgba(0,0,0,0.03)] z-30 flex flex-col justify-between overflow-y-auto"
        >
           {/* Pannello Superiore Esplicativo */}
           <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                       <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div>
                       <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">AI X-Ray Analysis</h2>
                       <p className="text-[11px] font-bold tracking-widest text-blue-600 uppercase">Per {selectedArticle.articolo_num}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setSelectedArticle(null)}
                   className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setIsDiffMode(false)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${!isDiffMode ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  Sintesi AI
                </button>
                <button 
                  onClick={() => setIsDiffMode(true)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${isDiffMode ? 'bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Macchina del Tempo
                </button>
              </div>

              {/* Finta Spiegazione AI o Diffing */}
              <AnimatePresence mode="wait">
              {!isDiffMode ? (
              <motion.div 
                key="sintesi"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                 <div className="bg-slate-50 border border-slate-100 rounded-[24px] p-6 shadow-inner">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                       <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       Sintesi Legale Generativa
                    </h4>
                    <p className="text-[15px] leading-relaxed text-slate-700 font-medium">
                       Questa analisi viene generata dinamicamente dal sistema. L&apos;obiettivo principale della norma è la tutela preventiva e il riequilibrio tra le parti, assumendo un approccio strutturale in conformità alla Costituzione.
                    </p>
                 </div>

                 {/* Glossary Mocks */}
                 <div className="mt-8">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">Glossario Dinamico Rilevato</h4>
                    <div className="space-y-3">
                       <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group hover:border-blue-300 transition-colors">
                          <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold mb-2">Presunzione</span>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Conseguenza che la legge o il giudice ritrae da un fatto noto per risalire ad un fatto ignoto.</p>
                       </div>
                       <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group hover:border-blue-300 transition-colors">
                          <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-bold mb-2">Onere della prova</span>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Principio per cui chi vuol far valere un diritto in giudizio deve provare i fatti che ne costituiscono il fondamento.</p>
                       </div>
                    </div>
                 </div>
              </motion.div>
              ) : (
              <motion.div
                key="diffing"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="space-y-6"
              >
                 <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                       <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                       <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                       Confronto Storico ({diffData?.oldVersion || 'Old'} vs {diffData?.newVersion || 'New'})
                    </h4>
                    
                    <div className="font-serif text-[15px] leading-8 text-slate-700 bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300">
                       {loadingDiff ? (
                         <div className="space-y-4 py-4 w-full">
                           <div className="h-3 bg-slate-200/60 rounded-full w-full animate-pulse"></div>
                           <div className="h-3 bg-slate-200/60 rounded-full w-11/12 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                           <div className="h-3 bg-slate-200/60 rounded-full w-4/5 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                           <div className="h-3 bg-slate-200/60 rounded-full w-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                         </div>
                       ) : diffData && diffData.diff ? (
                         diffData.diff.map((part, index) => {
                           if (part.added) {
                             return <span key={index} className="bg-green-100 text-green-800 font-bold px-1 rounded mx-0.5">{part.value}</span>;
                           } else if (part.removed) {
                             return <span key={index} className="bg-red-100 text-red-800 line-through px-1 rounded mx-0.5">{part.value}</span>;
                           } else {
                             return <span key={index}>{part.value}</span>;
                           }
                         })
                       ) : (
                         <span>Errore nel caricamento del diff.</span>
                       )}
                    </div>
                    
                    <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-100">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                         <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div> Rimozioni
                       </div>
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                         <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div> Aggiunte
                       </div>
                    </div>
                 </div>
              </motion.div>
              )}
              </AnimatePresence>
           </div>

           {/* Sezione Bassa di Integrazione / Extra */}
           <div className="p-8 border-t border-slate-100 bg-slate-50/50 mt-auto">
              <div className="flex items-center justify-between mb-4">
                 <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Integrazioni Esterne</h4>
                 <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verifica Fonti <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg></span>
              </div>
              <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-bold text-sm py-3.5 rounded-2xl transition-all shadow-sm group">
                 <svg className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                 Vedi Giurisprudenza Cassazione Associata
              </button>
           </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
