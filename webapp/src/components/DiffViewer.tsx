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
    <div className="flex flex-col w-full bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden font-sans shadow-lg">
      
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
          </svg>
          <span className="text-sm font-medium text-white/80">Comparazione Testo di Legge</span>
        </div>
        
        {/* Toggle View Mode */}
        <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
          <button 
            onClick={() => setIsSplit(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${!isSplit ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
          >
            Unified
          </button>
          <button 
            onClick={() => setIsSplit(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${isSplit ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/70'}`}
          >
            Split
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-0 overflow-x-auto text-sm leading-relaxed text-white/80">
        {isSplit ? (
          /* SPLIT VIEW (Side-by-Side) */
          <div className="flex min-w-[600px] divide-x divide-white/10">
            {/* Left Column: Old Text */}
            <div className="w-1/2 p-6 bg-red-900/5">
              <div className="text-xs font-mono text-white/30 mb-4 pb-2 border-b border-white/10 uppercase tracking-wider">Testo Originale</div>
              <div className="whitespace-pre-wrap">
                {diffResult.map((part, index) => {
                   if (part.added) return null; // Non mostriamo test aggiunto nel vecchio
                   
                   return (
                     <span 
                       key={index} 
                       className={part.removed ? "bg-red-500/20 text-red-300 font-medium line-through decoration-red-500/50 rounded px-1.5 py-0.5 mx-0.5" : ""}
                     >
                       {part.value}
                     </span>
                   );
                })}
              </div>
            </div>

            {/* Right Column: New Text */}
            <div className="w-1/2 p-6 bg-green-900/5">
              <div className="text-xs font-mono text-white/30 mb-4 pb-2 border-b border-white/10 uppercase tracking-wider">Testo Vigente (Modificato)</div>
              <div className="whitespace-pre-wrap">
                 {diffResult.map((part, index) => {
                   if (part.removed) return null; // Non mostriamo test rimosso nel nuovo
                   
                   return (
                     <span 
                       key={index} 
                       className={part.added ? "bg-green-500/20 text-green-300 font-medium rounded px-1.5 py-0.5 mx-0.5" : ""}
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
          <div className="p-6 whitespace-pre-wrap min-h-[200px] bg-black/20">
            {diffResult.map((part, index) => {
              if (part.added) {
                return <span key={index} className="bg-green-500/20 text-green-300 font-medium rounded px-1.5 py-0.5 mx-0.5">{part.value}</span>;
              }
              if (part.removed) {
                return <span key={index} className="bg-red-500/20 text-red-300 font-medium line-through decoration-red-500/50 rounded px-1.5 py-0.5 mx-0.5">{part.value}</span>;
              }
              return <span key={index}>{part.value}</span>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
