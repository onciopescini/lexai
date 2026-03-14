'use client';

import React from 'react';
import DiffViewer from '@/components/DiffViewer';
import NetworkBackground from '@/components/NetworkBackground';
import Link from 'next/link';

export default function DiffDemoPage() {
  const oldText = `L'imprenditore è il capo dell'impresa e da lui dipendono gerarchicamente i suoi collaboratori.
L'imprenditore deve adottare nell'esercizio dell'impresa le misure che, secondo la particolarità del lavoro, l'esperienza e la tecnica, sono necessarie a tutelare l'integrità fisica e la personalità morale dei prestatori di lavoro.`;

  const newText = `L'imprenditore è il capo dell'impresa e da lui dipendono gerarchicamente i suoi collaboratori, nel rispetto della dignità lavorativa.
Oltre alle disposizioni previste dalla legge, l'imprenditore deve adottare nell'esercizio dell'impresa tutte le misure che, secondo la particolarità del lavoro, l'esperienza e la migliore tecnica disponibile, si rendono necessarie a tutelare l'integrità fisica, mentale e la personalità morale dei prestatori di lavoro.`;

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
      {/* Background 3D Effect */}
      <NetworkBackground />

      <main className="relative z-10 p-8 max-w-6xl mx-auto pt-24">
        {/* Header */}
        <div className="flex animate-fade-in-up items-center justify-between mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
               <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
               </svg>
             </div>
             <div>
               <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
                 Version Comparison
               </h1>
               <p className="text-white/50 text-sm mt-1">
                 Analizza le modifiche storiche introdotte nel testo di legge.
               </p>
             </div>
          </div>
          <Link href="/">
             <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-all font-medium backdrop-blur-md">
               Torna alla Home
             </button>
          </Link>
        </div>

        {/* Diff Viewer Card */}
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div className="mb-6">
                <h2 className="text-lg font-medium text-white/90">Art. 2086 - 2087 (Codice Civile)</h2>
                <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="px-2 py-1 rounded bg-red-500/10 text-red-300 border border-red-500/20">Versione 1942</span>
                    <span className="text-white/30">vs</span>
                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-300 border border-green-500/20">Modifica D.Lgs. 14/2019</span>
                </div>
            </div>
          <DiffViewer oldText={oldText} newText={newText} splitView={true} />
        </div>
      </main>
    </div>
  );
}
