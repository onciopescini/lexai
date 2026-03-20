'use client';

import React from 'react';
import { LegalArticle } from '@/components/library/AIXRayPanel';

export const libraryStructure = [
  {
    id: 'Codice Civile',
    title: 'Codice Civile',
    books: [
      { id: 'Libro I - Delle Persone e della Famiglia', title: 'Libro I - Delle Persone e della Famiglia' },
      { id: 'Libro II - Delle Successioni', title: 'Libro II - Delle Successioni' },
      { id: 'Libro III - Della Proprietà', title: 'Libro III - Della Proprietà' },
      { id: 'Libro IV - Delle Obbligazioni', title: 'Libro IV - Delle Obbligazioni' },
      { id: 'Libro V - Del Lavoro', title: 'Libro V - Del Lavoro' },
      { id: 'Libro VI - Della Tutela dei Diritti', title: 'Libro VI - Della Tutela dei Diritti' },
      { id: 'all', title: 'Tutti gli Articoli' }
    ]
  },
  {
    id: 'Codice Penale',
    title: 'Codice Penale',
    books: [
      { id: 'all', title: 'Tutte le Disposizioni' }
    ]
  },
  {
    id: 'Costituzione',
    title: 'Costituzione',
    books: [
      { id: 'all', title: 'Principi Fondamentali' }
    ]
  }
];

interface LibrarySidebarProps {
  activeCode: string;
  setActiveCode: (code: string) => void;
  activeBook: string;
  setActiveBook: (book: string) => void;
  setSelectedArticle: (article: LegalArticle | null) => void;
  setIsDiffMode: (mode: boolean) => void;
}

export default function LibrarySidebar({
  activeCode,
  setActiveCode,
  activeBook,
  setActiveBook,
  setSelectedArticle,
  setIsDiffMode
}: LibrarySidebarProps) {
  
  const handleSourceClick = (sourceId: string, books: {id: string}[]) => {
    setActiveCode(sourceId);
    setActiveBook(books[0].id);
    setSelectedArticle(null);
    setIsDiffMode(false);
  };

  return (
    <aside className="w-72 bg-white/60 backdrop-blur-md border-r border-slate-200/60 flex flex-col overflow-y-auto shrink-0">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-sm font-extrabold text-slate-400 tracking-widest uppercase mb-4">Fonti Normative</h2>
        <div className="space-y-2">
          {libraryStructure.map((source) => (
            <div key={source.id} className="mb-4">
              <button 
                onClick={() => handleSourceClick(source.id, source.books)}
                className={`w-full text-left px-3 py-2 rounded-[20px] font-bold text-sm transition-colors ${activeCode === source.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {source.title}
              </button>
              
              {activeCode === source.id && (
                <div className="mt-2 ml-3 pl-3 border-l-2 border-slate-200 space-y-1">
                  {source.books.map(book => (
                    <button 
                      key={book.id}
                      onClick={() => { setActiveBook(book.id); setSelectedArticle(null); setIsDiffMode(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${activeBook === book.id ? 'bg-blue-50/80 border border-blue-100 text-blue-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                      {book.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
