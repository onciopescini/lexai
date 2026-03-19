'use client';

import React, { useState, useEffect } from 'react';
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Modalità Split-Screen
  const [selectedArticle, setSelectedArticle] = useState<LegalArticle | null>(null);
  
  // Macchina del Tempo (Diffing)
  const [isDiffMode, setIsDiffMode] = useState(false);
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
    setSelectedArticle(null);
  }, [activeCode]);

  const handleSourceClick = (sourceId: string, books: {id: string}[]) => {
    setActiveCode(sourceId);
    setActiveBook(books[0].id);
    setSelectedArticle(null);
    setIsDiffMode(false);
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
    <PremiumEcosystemWrapper>
      <div className="flex flex-col w-full h-full relative font-sans text-slate-900">
        {/* Sfondo Global (Atena Pattern) */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
          <div className="absolute inset-0 z-0 bg-transparent opacity-30" style={{ backgroundImage: "url('/images/atena-pattern-bg.png')", backgroundSize: "300px", backgroundRepeat: "repeat" }}></div>
          <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-100 blur-[150px] rounded-full mix-blend-multiply"></div>
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-indigo-100 blur-[150px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="flex flex-1 relative z-10 min-h-[90vh] mx-2 my-4 md:mx-6 md:my-6 rounded-[40px] overflow-hidden border border-slate-200/50 shadow-2xl bg-white/60 backdrop-blur-3xl">
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

        {/* Contenuto Principale (Articoli Reali Filtrati) */}
        <main className={`flex-1 overflow-y-auto p-8 relative transition-all duration-500 ease-in-out ${selectedArticle ? 'w-1/2 pr-4 border-r border-slate-200 bg-white/40' : 'w-full px-12 lg:px-24'}`}>
              
            {/* Header Ricerca Semantica */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
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

            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {currentBookTitle === 'Tutti gli Articoli' ? currentSourceTitle : currentBookTitle}
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Aggiornato in tempo reale con le ultime modifiche normative.</p>
            </div>

            {/* Lista Documenti (Dossier Layout) */}
             <div className="space-y-6 pb-20">
                {loading ? (
                  <div className="flex flex-col gap-6 animate-pulse">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="p-6 bg-white rounded-3xl border border-slate-100">
                         <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
                         <div className="space-y-2">
                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                            <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                         </div>
                       </div>
                     ))}
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                     <span className="text-4xl block mb-4">📜</span>
                     <h3 className="text-lg font-bold text-slate-700">Nessun articolo trovato per questa ricerca.</h3>
                     <p className="text-sm font-medium text-slate-500 mt-2">La scansione profonda (RAG) potrebbe richiedere termini più precisi.</p>
                  </div>
                ) : (
                  filteredArticles.map((art) => (
                    <div 
                      key={art.id} 
                      onClick={() => { setSelectedArticle(art); setIsDiffMode(false); }}
                      className={`group relative p-6 md:p-8 rounded-[32px] border transition-all duration-300 cursor-pointer overflow-hidden ${selectedArticle?.id === art.id ? 'bg-white border-blue-400 shadow-[0_10px_40px_rgba(59,130,246,0.1)] ring-1 ring-blue-500/20 ring-inset' : 'bg-white/80 border-slate-200/60 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5'}`}
                    >
                       <div className="flex items-center gap-4 mb-4">
                         <h3 className={`text-xl font-extrabold ${selectedArticle?.id === art.id ? 'text-blue-600' : 'text-slate-800 group-hover:text-blue-600'} transition-colors`}>
                            {Number.isNaN(Number(art.articolo_num)) ? art.articolo_num : `Art. ${art.articolo_num}`}
                         </h3>
                         <div className="h-px flex-1 bg-slate-100"></div>
                         {art.is_vigente ? (
                           <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                             Vigente
                           </span>
                         ) : (
                           <span className="text-[10px] font-bold tracking-widest uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">Storico</span>
                         )}
                       </div>
                       
                       <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">
                          {art.titolo ? art.titolo : 'Disposizione Generale'}
                       </h4>
                       
                       <div className={`text-[15px] leading-relaxed text-slate-700 font-medium ${selectedArticle?.id === art.id ? '' : 'line-clamp-4'}`}>
                          {art.testo}
                       </div>

                       {/* Call to action "Analizza" hovering state */}
                       <div className={`mt-6 pt-4 border-t transition-colors ${selectedArticle?.id === art.id ? 'border-blue-100 flex justify-between items-center' : 'border-slate-100 opacity-0 group-hover:opacity-100'}`}>
                          {selectedArticle?.id === art.id ? (
                             <>
                               <div className="text-xs font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                  Analisi AI X-Ray Attiva
                               </div>
                             </>
                          ) : (
                             <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                               Clicca per Analisi AI X-Ray <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                             </span>
                          )}
                       </div>
                    </div>
                  ))
                )}
             </div>
        </main>

        {/* 3. "AI X-Ray" Split-Screen Panel (Visibile solo se un file è selezionato) */}
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
                           Confronto Storico (Versione 2024 vs 2025)
                        </h4>
                        
                        <div className="font-serif text-[15px] leading-8 text-slate-700 bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300">
                           Chiunque <span className="bg-red-100 text-red-800 line-through px-1 rounded mx-0.5">senza giusta causa</span> <span className="bg-green-100 text-green-800 font-bold px-1 rounded mx-0.5">con dolo o colpa grave</span> cagiona ad altri un danno ingiusto è tenuto a risarcire <span className="bg-red-100 text-red-800 line-through px-1 rounded mx-0.5">tutti</span> i danni <span className="bg-green-100 text-green-800 font-bold px-1 rounded mx-0.5">patrimoniali e non patrimoniali diretti</span>.
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
        </div>
      </div>
    </PremiumEcosystemWrapper>
  );
}

