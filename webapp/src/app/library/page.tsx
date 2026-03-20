'use client';

import React, { useState, useEffect } from 'react';
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';
import SemanticSearchBar from '@/components/library/SemanticSearchBar';
import AIXRayPanel, { LegalArticle } from '@/components/library/AIXRayPanel';
import LibrarySidebar, { libraryStructure } from '@/components/library/LibrarySidebar';

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
        <LibrarySidebar
          activeCode={activeCode}
          setActiveCode={setActiveCode}
          activeBook={activeBook}
          setActiveBook={setActiveBook}
          setSelectedArticle={setSelectedArticle}
          setIsDiffMode={setIsDiffMode}
        />

        {/* Contenuto Principale (Articoli Reali Filtrati) */}
        <main className={`flex-1 overflow-y-auto p-8 relative transition-all duration-500 ease-in-out ${selectedArticle ? 'w-1/2 pr-4 border-r border-slate-200 bg-white/40' : 'w-full px-12 lg:px-24'}`}>
              
            {/* Header Ricerca Semantica */}
            <SemanticSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentSourceTitle={currentSourceTitle}
            />

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
        <AIXRayPanel
          selectedArticle={selectedArticle}
          setSelectedArticle={setSelectedArticle}
          isDiffMode={isDiffMode}
          setIsDiffMode={setIsDiffMode}
        />
        </div>
      </div>
    </PremiumEcosystemWrapper>
  );
}

