'use client';

import React, { useState, useEffect } from 'react';
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';
import SemanticSearchBar from '@/components/library/SemanticSearchBar';
import AIXRayPanel, { LegalArticle } from '@/components/library/AIXRayPanel';
import LibrarySidebar, { libraryStructure } from '@/components/library/LibrarySidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBolt, IconClock, IconChevronRight } from '@tabler/icons-react';

export default function LibraryPage() {
  const [activeCode, setActiveCode] = useState('Codice Civile');
  const [activeBook, setActiveBook] = useState('Libro V - Del Lavoro');
  const [articles, setArticles] = useState<LegalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vigenti' | 'storici'>('all');
  const [selectedArticle, setSelectedArticle] = useState<LegalArticle | null>(null);
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
          setArticles([]);
        }
      } catch (err) {
        console.error('Fetch err:', err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
    setSelectedArticle(null);
  }, [activeCode]);

  const filteredArticles = articles.filter(art => {
    if (activeBook !== 'all' && art.libro && art.libro !== activeBook) return false;
    if (filterType === 'vigenti' && !art.is_vigente) return false;
    if (filterType === 'storici' && art.is_vigente) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (art.articolo_num?.toLowerCase().includes(q) ||
              art.testo?.toLowerCase().includes(q) ||
              art.titolo?.toLowerCase().includes(q));
    }
    return true;
  });

  const currentSourceTitle = libraryStructure.find(s => s.id === activeCode)?.title || activeCode;
  const currentBookTitle  = libraryStructure.find(s => s.id === activeCode)?.books.find(b => b.id === activeBook)?.title || '';

  return (
    <PremiumEcosystemWrapper>
      <div className="flex h-full">

        {/* ── COL 1: Source Navigator ── */}
        <LibrarySidebar
          activeCode={activeCode}
          setActiveCode={setActiveCode}
          activeBook={activeBook}
          setActiveBook={setActiveBook}
          setSelectedArticle={setSelectedArticle}
          setIsDiffMode={setIsDiffMode}
        />

        {/* ── COL 2: Article Feed ── */}
        <main className={`flex-1 overflow-y-auto bg-[#F7F7F5] transition-all duration-400 ${selectedArticle ? 'max-w-[480px]' : 'max-w-full'}`}>

          {/* Sticky Header */}
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 pt-5 pb-4">
            <SemanticSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentSourceTitle={currentSourceTitle}
            />
            <div className="flex items-center gap-2 mt-2 mb-1">
              {['all', 'vigenti', 'storici'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setFilterType(t as 'all' | 'vigenti' | 'storici')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${filterType === t ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {t === 'all' ? 'Tutti' : t === 'vigenti' ? 'Solo Vigenti' : 'Archivio Storico'}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900 font-serif tracking-tight">
                  {currentBookTitle === 'Tutti gli Articoli' ? currentSourceTitle : currentBookTitle || currentSourceTitle}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Normativa vigente · {filteredArticles.length} articoli
                </p>
              </div>
            </div>
          </div>

          {/* Article list */}
          <div className="p-4 space-y-3 pb-24">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="glass-card rounded-2xl p-5">
                    <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-50 rounded w-full" />
                      <div className="h-3 bg-slate-50 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                <span className="text-4xl block mb-4">📜</span>
                <h3 className="text-sm font-bold text-slate-600">Nessun articolo trovato.</h3>
                <p className="text-xs text-slate-400 mt-2">Prova termini più specifici.</p>
              </div>
            ) : (
              filteredArticles.map((art, idx) => {
                const isSelected = selectedArticle?.id === art.id;
                return (
                  <motion.div
                    key={art.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.25 }}
                    onClick={() => { setSelectedArticle(art); setIsDiffMode(false); }}
                    className={`group glass-card rounded-2xl p-5 cursor-pointer transition-all duration-200
                      ${isSelected ? 'border-[#C9A84C]/40 bg-[#F0E9D6]/30' : ''}`}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className={`font-bold text-sm font-serif ${isSelected ? 'text-[#9C7A2A]' : 'text-slate-800 group-hover:text-slate-900'} transition-colors`}>
                        {Number.isNaN(Number(art.articolo_num)) ? art.articolo_num : `Art. ${art.articolo_num}`}
                      </h3>
                      <div className="h-px flex-1 bg-slate-100" />
                      {art.is_vigente ? (
                        <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          Vigente
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                          <IconClock size={8} />
                          Storico
                        </span>
                      )}
                    </div>

                    {art.titolo && (
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">{art.titolo}</p>
                    )}

                    <p className={`text-sm text-slate-600 leading-relaxed ${isSelected ? '' : 'line-clamp-3'}`}>
                      {art.testo}
                    </p>

                    <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold transition-all
                      ${isSelected ? 'text-[#C9A84C] opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}>
                      {isSelected
                        ? <><IconBolt size={11} /> Analisi AI X-Ray Attiva</>
                        : <><IconChevronRight size={11} /> Apri X-Ray</>
                      }
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </main>

        {/* ── COL 3: X-Ray Slide Panel ── */}
        <AnimatePresence>
          {selectedArticle && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-l border-slate-100 shrink-0"
            >
              <AIXRayPanel
                selectedArticle={selectedArticle}
                setSelectedArticle={setSelectedArticle}
                isDiffMode={isDiffMode}
                setIsDiffMode={setIsDiffMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PremiumEcosystemWrapper>
  );
}
