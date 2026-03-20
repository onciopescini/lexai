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
      {/* Background glow ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-amber-legal/3 blur-[200px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[350px] bg-blue-600/4 blur-[180px] rounded-full" />
      </div>

      {/* 3-column layout */}
      <div className="flex h-full relative z-10">

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
        <main className={`flex-1 overflow-y-auto transition-all duration-500 ease-out
          ${selectedArticle ? 'max-w-[480px]' : 'max-w-full'}`}>

          {/* Sticky header */}
          <div className="sticky top-0 z-20 glass-panel px-6 pt-6 pb-4 border-b border-white/5">
            <SemanticSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentSourceTitle={currentSourceTitle}
            />
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  {currentBookTitle === 'Tutti gli Articoli' ? currentSourceTitle : currentBookTitle || currentSourceTitle}
                </h1>
                <p className="text-xs text-white/30 mt-0.5 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Aggiornamento real-time · {filteredArticles.length} articoli
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
                    <div className="h-4 bg-white/5 rounded w-1/3 mb-3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-white/4 rounded w-full" />
                      <div className="h-3 bg-white/4 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/2">
                <span className="text-4xl block mb-4">📜</span>
                <h3 className="text-sm font-bold text-white/60">Nessun articolo trovato.</h3>
                <p className="text-xs text-white/30 mt-2">Prova termini più specifici nella ricerca.</p>
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
                    className={`group relative glass-card rounded-2xl p-5 cursor-pointer transition-all duration-200
                      ${isSelected
                        ? 'border-amber-legal/30 bg-amber-legal/5 shadow-[0_0_20px_rgba(212,168,83,0.08)]'
                        : 'hover:border-white/15 hover:bg-white/4'
                      }`}
                  >
                    {/* Article header */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className={`font-black text-sm ${isSelected ? 'text-amber-legal' : 'text-white/90 group-hover:text-white'} transition-colors`}>
                        {Number.isNaN(Number(art.articolo_num)) ? art.articolo_num : `Art. ${art.articolo_num}`}
                      </h3>
                      <div className="h-px flex-1 bg-white/6" />
                      {art.is_vigente ? (
                        <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400/80 bg-emerald-400/8 px-2 py-0.5 rounded-full border border-emerald-400/15">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          Vigente
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-amber-legal/60 bg-amber-legal/6 px-2 py-0.5 rounded-full border border-amber-legal/10">
                          <IconClock size={9} />
                          Storico
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    {art.titolo && (
                      <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-2">
                        {art.titolo}
                      </p>
                    )}

                    {/* Excerpt */}
                    <p className={`text-sm text-white/50 leading-relaxed ${isSelected ? '' : 'line-clamp-3'}`}>
                      {art.testo}
                    </p>

                    {/* CTA */}
                    <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-semibold transition-all duration-200
                      ${isSelected ? 'text-amber-legal opacity-100' : 'text-white/20 opacity-0 group-hover:opacity-100'}`}>
                      {isSelected
                        ? <><IconBolt size={11} /> Analisi AI X-Ray Attiva</>
                        : <><IconChevronRight size={11} /> Apri Analisi X-Ray</>
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
              className="overflow-hidden border-l border-white/5 shrink-0"
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
