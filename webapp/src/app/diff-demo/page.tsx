'use client';

import React, { useState, useEffect, Suspense } from 'react';
import DiffViewer from '@/components/ui/DiffViewer';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function DiffDemoContent() {
  const searchParams = useSearchParams();
  const rawArticolo = searchParams.get('articolo') || '2086'; // fallback a default temporaneo per test
  const codice = searchParams.get('codice') || 'Codice Civile';

  // Normalize art number to support strings like "Art. 2086" or just "2086"
  const articolo_num = rawArticolo.replace(/.*?(\d+.*)/, '$1').trim();

  interface HistoryVersion {
    versione_nome?: string;
    is_vigente?: boolean;
    testo?: string;
  }

  const [history, setHistory] = useState<HistoryVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // For selection of left/right version.
  const [newVersionIndex, setNewVersionIndex] = useState<number>(0);
  const [oldVersionIndex, setOldVersionIndex] = useState<number>(1);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const res = await fetch(`/api/library/history?codice=${encodeURIComponent(codice)}&articolo_num=${encodeURIComponent(articolo_num)}`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
          
          // Defaults: new is index 0 (vigente), old is index 1 (previous)
          if (data.history?.length > 1) {
             setNewVersionIndex(0);
             setOldVersionIndex(1);
          } else {
             setNewVersionIndex(0);
             setOldVersionIndex(0);
          }
        }
      } catch {
        // Ignora gli errori di connessione sul client
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [codice, articolo_num]);


  if (loading) {
     return <div className="text-center py-20 animate-pulse text-slate-500 font-medium">Caricamento dello storico versioni in corso...</div>;
  }

  if (history.length === 0) {
     return (
       <div className="text-center py-20 text-slate-500 font-medium">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h3>Nessuno storico trovato per l&apos;Art. {articolo_num} ({codice}).</h3>
          <p className="text-sm mt-2 max-w-sm mx-auto">Potrebbe non essere ancora stato scansionato dal bot, oppure non ci sono versioni modificate per questa specifica legge.</p>
       </div>
     );
  }

  const newText = history[newVersionIndex]?.testo || '';
  const oldText = history[oldVersionIndex]?.testo || '';

  return (
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Art. {articolo_num} ({codice})</h2>
                
                {history.length > 1 && (
                  <div className="flex items-center gap-3 text-sm font-semibold">
                      <select 
                        value={oldVersionIndex} 
                        onChange={(e) => setOldVersionIndex(Number(e.target.value))}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 shadow-sm outline-none cursor-pointer"
                      >
                         {history.map((v, i) => (
                           <option key={i} value={i}>{v.versione_nome}</option>
                         ))}
                      </select>

                      <span className="text-slate-400 font-extrabold text-xs tracking-wider">VS</span>
                      
                      <select 
                        value={newVersionIndex} 
                        onChange={(e) => setNewVersionIndex(Number(e.target.value))}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm outline-none cursor-pointer"
                      >
                         {history.map((v, i) => (
                           <option key={i} value={i}>{v.versione_nome} {v.is_vigente ? '(Vigente)' : ''}</option>
                         ))}
                      </select>
                  </div>
                )}
            </div>
            
            {history.length === 1 && (
                <div className="mb-6 p-4 bg-blue-50/50 text-blue-700 text-sm font-medium border border-blue-100/50 rounded-xl">
                    Questo articolo ha solo una versione storica registrata. Non sono presenti modifiche.
                </div>
            )}

            {history.length > 0 && (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                    <DiffViewer oldText={oldText} newText={newText} splitView={true} />
                </div>
            )}
        </div>
  );
}

export default function DiffDemoPage() {
  return (
    <div className="relative min-h-screen bg-[#fbfbfd] text-slate-900 font-sans overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 z-0 bg-transparent opacity-30" style={{ backgroundImage: "url('/images/atena-pattern-bg.png')", backgroundSize: "300px", backgroundRepeat: "repeat" }}></div>
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-100 blur-[120px] rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-slate-200 blur-[120px] rounded-full mix-blend-multiply"></div>
      </div>

      <main className="relative z-10 p-8 max-w-6xl mx-auto pt-24">
        {/* Header */}
        <div className="flex animate-fade-in-up items-center justify-between mb-12 pb-6 rounded-2xl bg-white/60 p-6 backdrop-blur-xl shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-6">
             <div className="flex items-center justify-center p-4 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-100">
               <Image src="/images/atena-text-logo.png" alt="Atena Logo" width={110} height={35} className="object-contain drop-shadow-sm" priority />
             </div>
             <div>
               <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
                 Storico Versioni
               </h1>
               <p className="text-slate-500 text-sm mt-1.5 font-medium">
                 Analizza le modifiche storiche introdotte nel testo di legge.
               </p>
             </div>
          </div>
          <Link href="/library">
             <button className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
               Torna alla Biblioteca
             </button>
          </Link>
        </div>

        {/* Diff Viewer Card */}
        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-200 min-h-[400px]">
           <Suspense fallback={<div className="text-center py-20 animate-pulse text-slate-500 font-medium">Inizializzazione...</div>}>
              <DiffDemoContent />
           </Suspense>
        </div>
      </main>
    </div>
  );
}
