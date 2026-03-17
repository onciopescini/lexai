'use client';

import React, { useMemo, useState } from 'react';
import * as diff from 'diff';

interface DiffViewerProps {
  oldText: string;
  newText: string;
  splitView?: boolean;
}

export default function DiffViewer({ oldText, newText, splitView = true }: DiffViewerProps) {
  const [isSplit, setIsSplit] = useState(splitView);

  // Calcolo delle differenze tramite la libreria 'diff'
  const diffResult = useMemo(() => {
    return diff.diffWordsWithSpace(oldText, newText);
  }, [oldText, newText]);

  return (
    <div className="flex flex-col w-full bg-white rounded-3xl border border-slate-200 overflow-hidden font-sans shadow-[0_10px_40px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
          </svg>
          <span className="text-sm font-bold text-slate-700 tracking-wide uppercase">Tavola di Comparazione</span>
        </div>
        
        {/* Toggle View Mode */}
        <div className="flex items-center bg-slate-200/50 rounded-xl p-1 border border-slate-200 shadow-inner">
          <button 
            onClick={() => setIsSplit(false)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${!isSplit ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Unificata
          </button>
          <button 
            onClick={() => setIsSplit(true)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${isSplit ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Affiancata
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-0 overflow-x-auto text-[15px] leading-relaxed text-slate-700">
        {isSplit ? (
          /* SPLIT VIEW (Side-by-Side) */
          <div className="flex min-w-[600px] divide-x divide-slate-200">
            {/* Left Column: Old Text */}
            <div className="w-1/2 p-8 bg-red-50/30">
              <div className="text-xs font-bold text-red-500 mb-6 pb-3 border-b border-red-100 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-red-400"></span> Testo Originale (Abrogato)
              </div>
              <div className="whitespace-pre-wrap">
                {diffResult.map((part, index) => {
                   if (part.added) return null; // Non mostriamo test aggiunto nel vecchio
                   
                   return (
                     <span 
                       key={index} 
                       className={part.removed ? "bg-red-100 text-red-800 font-semibold line-through decoration-red-400/60 rounded-md px-1.5 py-0.5 mx-0.5" : ""}
                     >
                       {part.value}
                     </span>
                   );
                })}
              </div>
            </div>

            {/* Right Column: New Text */}
            <div className="w-1/2 p-8 bg-emerald-50/30">
              <div className="text-xs font-bold text-emerald-600 mb-6 pb-3 border-b border-emerald-100 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Testo Vigente (Modificato)
              </div>
              <div className="whitespace-pre-wrap">
                 {diffResult.map((part, index) => {
                   if (part.removed) return null; // Non mostriamo test rimosso nel nuovo
                   
                   return (
                     <span 
                       key={index} 
                       className={part.added ? "bg-emerald-100 text-emerald-800 font-semibold rounded-md px-1.5 py-0.5 mx-0.5 shadow-sm" : ""}
                     >
                       {part.value}
                     </span>
                   );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* UNIFIED VIEW */
          <div className="p-8 whitespace-pre-wrap min-h-[200px] bg-slate-50/50">
            {diffResult.map((part, index) => {
              if (part.added) {
                return <span key={index} className="bg-emerald-100 text-emerald-800 font-semibold rounded-md px-1.5 py-0.5 mx-0.5 shadow-sm">{part.value}</span>;
              }
              if (part.removed) {
                return <span key={index} className="bg-red-100 text-red-800 font-semibold line-through decoration-red-400/60 rounded-md px-1.5 py-0.5 mx-0.5">{part.value}</span>;
              }
              return <span key={index}>{part.value}</span>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
