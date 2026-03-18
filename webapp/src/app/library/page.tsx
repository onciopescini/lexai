'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LegalArticle {
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

// Struttura fissa per la sidebar
const libraryStructure = [
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

export default function LibraryPage() {
  const [activeCode, setActiveCode] = useState('Codice Civile');
  const [activeBook, setActiveBook] = useState('Libro V - Del Lavoro');
  
  const [articles, setArticles] = useState<LegalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Caricamento Dati dal DB Backend (Supabase via API Route)
  useEffect(() => {
    async function loadArticles() {
      setLoading(true);
      try {
        const res = await fetch(`/api/library?codice=${encodeURIComponent(activeCode)}`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        } else {
          console.error("Fallimento recupero articoli:", await res.text());
          setArticles([]);
        }
      } catch (err) {
        console.error("Fetch err:", err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, [activeCode]);

  const handleSourceClick = (sourceId: string, books: {id: string}[]) => {
    setActiveCode(sourceId);
    setActiveBook(books[0].id);
  };

  // Filtraggio
  const filteredArticles = articles.filter(art => {
    if (activeBook !== 'all' && art.libro && art.libro !== activeBook) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const num = art.articolo_num ? art.articolo_num.toLowerCase() : '';
      const txt = art.testo ? art.testo.toLowerCase() : '';
      const tit = art.titolo ? art.titolo.toLowerCase() : '';
      return num.includes(q) || txt.includes(q) || tit.includes(q);
    }
    return true;
  });

  const currentSourceTitle = libraryStructure.find(s => s.id === activeCode)?.title || activeCode;
  const currentBookTitle = libraryStructure.find(s => s.id === activeCode)?.books.find(b => b.id === activeBook)?.title || '';

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-slate-900 font-sans flex flex-col">
      {/* Sfondo Global (Atena Pattern) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 z-0 bg-transparent opacity-30" style={{ backgroundImage: "url('/images/atena-pattern-bg.png')", backgroundSize: "300px", backgroundRepeat: "repeat" }}></div>
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-100 blur-[120px] rounded-full mix-blend-multiply"></div>
        <div className="absolute top-1/2 -right-1/4 w-1/2 h-1/2 bg-slate-200 blur-[120px] rounded-full mix-blend-multiply"></div>
      </div>

      {/* Navbar Mimetica */}
      <nav className="w-full flex items-center justify-between px-6 py-4 border-b border-black/5 shrink-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-3">
          <Link href="/">
             <Image src="/atena-logo-new.jpeg" alt="Atena Logo" width={100} height={32} className="object-contain drop-shadow-sm cursor-pointer hover:opacity-80 transition-opacity" priority style={{ width: 'auto', height: 'auto' }} loading="eager" />
          </Link>
        </div>
        <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
           <Link href="/library" className="text-slate-900 transition-colors flex items-center gap-1.5 border-b-2 border-slate-900 pb-1">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
             Biblioteca Legale
           </Link>
           <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1.5 pb-1">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
             Ricerca Semantica
           </Link>
        </div>
      </nav>

      <div className="flex flex-1 relative z-10 overflow-hidden">
        {/* Sidebar Navigazione */}
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
                          onClick={() => setActiveBook(book.id)}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-[13px] font-medium transition-colors ${activeBook === book.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
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

        {/* Contenuto Principale (Articoli Reali Filtrati) */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
           <div className="max-w-4xl mx-auto">
              
              {/* Header Breadcrumbs & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                 <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                    <span className="text-slate-400">Archivio</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    <span className="text-slate-700 font-bold">{currentSourceTitle}</span>
                    {activeBook !== 'all' && (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        <span className="text-blue-600 font-bold">{currentBookTitle}</span>
                      </>
                    )}
                 </div>
                 
                 <div className="relative">
                   <input 
                     type="text" 
                     placeholder="Cerca articolo o parola..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10 pr-4 py-2 w-full md:w-64 border border-slate-200 rounded-[24px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all" 
                   />
                   <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                 </div>
              </div>

              {/* View Lettura Documento */}
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_10px_40px_rgba(0,0,0,0.04)] overflow-hidden min-h-[500px]">
                
                {/* Header della View. Usiamo Titolo dinamico dal primo articolo (es. Titolo II) */}
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{currentBookTitle === 'Tutti gli Articoli' ? currentSourceTitle : currentBookTitle}</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Caricamento dinamico dal Database PicoClaw...</p>
                </div>
                
                <div className="p-8 space-y-12">
                   {loading ? (
                     <div className="flex flex-col gap-8 animate-pulse">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="space-y-4">
                            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                            <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                            <div className="h-24 bg-slate-50 border border-slate-100 rounded-[24px] w-full"></div>
                          </div>
                        ))}
                     </div>
                   ) : filteredArticles.length === 0 ? (
                     <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Nessun articolo trovato.</h3>
                        <p className="text-sm font-medium text-slate-500 mt-2">Prova a modificare la ricerca o i filtri. Assicurati che i crawler in background abbiano caricato le fonti.</p>
                     </div>
                   ) : (
                     filteredArticles.map((art) => (
                       <div key={art.id} className="group relative">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-lg font-bold text-slate-800">
                               {Number.isNaN(Number(art.articolo_num)) ? art.articolo_num : `Art. ${art.articolo_num}`}
                            </h3>
                            <div className="h-px flex-1 bg-slate-100"></div>
                            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">{art.versione_nome}</span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wide">
                             {art.titolo ? art.titolo : 'Disposizione'}
                          </h4>
                          
                          <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-slate-700 bg-slate-50/50 p-5 rounded-[24px] border border-slate-100 relative group-hover:bg-slate-50 transition-colors">
                             {art.testo}
                             
                             {/* Bottone Link to Storico Versioni per Diff Demo. Potremmo puntare ad un articolo specifico via URL params nel Diff Demo */}
                             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/diff-demo?articolo=${art.articolo_num}&codice=${encodeURIComponent(art.codice)}`}>
                                  <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 shadow-sm px-2.5 py-1.5 rounded-[20px] hover:text-blue-600 hover:border-blue-200 transition-colors">
                                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                     Verifica Storico Versioni
                                  </button>
                                </Link>
                             </div>
                          </div>
                       </div>
                     ))
                   )}
                </div>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
}

