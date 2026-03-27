'use client';

import React from 'react';

interface SemanticSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentSourceTitle: string;
}

export default function SemanticSearchBar({ searchQuery, setSearchQuery, currentSourceTitle }: SemanticSearchBarProps) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-3">
       <div className="flex gap-2 text-sm font-medium text-slate-500 items-center">
          <span className="text-slate-400">Library</span>
          <span>/</span>
          <span className="text-slate-700 font-bold">{currentSourceTitle}</span>
       </div>
       
       <div className="relative group w-full xl:w-96">
         <input 
           type="text" 
           placeholder="Ricerca Semantica RAG (es. Cessione del credito)..." 
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           className="pl-12 pr-4 py-3 w-full border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all placeholder:text-slate-400" 
         />
         <svg className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
         <div className="absolute right-3 top-2.5 px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-sm pointer-events-none">AI Powered</div>
       </div>
    </div>
  );
}
