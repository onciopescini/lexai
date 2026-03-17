'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';
import MaintenanceMode from '../components/ui/MaintenanceMode';
import LegalFactCheck from '../components/stateful/LegalFactCheck';
import ThinkingIndicator from '../components/ui/ThinkingIndicator';
import AsyncQueueTracker from '../components/stateful/AsyncQueueTracker';
import TruthFeedback from '../components/stateful/TruthFeedback';
import SocialCard from '../components/ui/SocialCard';
import MindMapViewer from '../components/ui/MindMapViewer';
import GoogleDocCard, { extractGoogleDocUrl } from '../components/ui/GoogleDocCard';
import AuthModal from '../components/ui/AuthModal';
import SubscriptionModal from '../components/ui/SubscriptionModal';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface LegalSource {
  title: string;
  content: string;
  source_url: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

// Stats Counter Animation
function AnimatedStat({ value, label, suffix = '' }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center group">
      <div className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 group-hover:from-blue-300 group-hover:to-indigo-300 transition-all">
        {value}{suffix}
      </div>
      <div className="text-xs text-white/40 mt-1 uppercase tracking-wider font-medium">{label}</div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, tag }: { icon: string; title: string; description: string; tag?: string }) {
  return (
    <div className="group relative p-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-black/5 hover:border-blue-500/20 hover:bg-white/90 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-500 overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl drop-shadow-sm">{icon}</span>
          {tag && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{tag}</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm font-medium text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// 3-Step Process Component
function ProcessStep({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center group">
      <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-slate-100 to-white flex items-center justify-center text-2xl font-black text-slate-800 shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-slate-200 group-hover:scale-110 group-hover:shadow-[0_10px_30px_rgba(59,130,246,0.15)] group-hover:border-blue-200 transition-all duration-500 mb-6">
        {step}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-base text-slate-500 max-w-xs leading-relaxed font-medium">{description}</p>
    </div>
  );
}


import { type FactCheckReport } from '@/lib/gemini';

export default function AtenaChat() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, sources?: LegalSource[], contra_analysis?: string, web_updates?: string, legal_illustration?: string, fact_check?: FactCheckReport, social_summary?: string, loading_social?: boolean }[]>([]);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('Tutte le Fonti');
  const [draftingMode, setDraftingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maintenanceMode] = useState(false);
  const [ingestionProgress] = useState(15.9);
  const [currentChunk] = useState(573);
  const totalChunks = 3609;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for the Active Social Card Modal
  const [activeSocialCardContent, setActiveSocialCardContent] = useState<{ content: string; sourceTitle?: string } | null>(null);

  // State for Mind Map
  const [mindMapData, setMindMapData] = useState<{nodes: Record<string, unknown>[], edges: Record<string, unknown>[]} | null>(null);
  const [loadingMindMap, setLoadingMindMap] = useState(false);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const supabase = createClient();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowAuthModal(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check Premium Tier from Supabase user metadata (set by Stripe webhook)
    const isPremium = user?.user_metadata?.is_premium === true;
    if (!isPremium) {
      setShowSubscriptionModal(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
       alert("Si prega di caricare solo file PDF per l'analisi.");
       return;
    }

    setMessages(prev => [...prev, { role: 'user', content: `📄 [Documento caricato: ${file.name}] Effettua un'analisi avanzata di questo documento.` }]);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('draftingMode', String(draftingMode));
    if (messages.length > 0) {
      formData.append('history', JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))));
    }

    try {
      const res = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.error) {
         setMessages(prev => [...prev, { role: 'assistant', content: `[Errore Analisi PDF]: ${data.error}` }]);
      } else {
         setMessages(prev => [...prev, { 
           role: 'assistant', 
           content: data.response, 
           sources: data.sources, 
           contra_analysis: data.contra_analysis,
           fact_check: data.fact_check
         }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Si è verificato un errore durante l'upload e l'analisi del documento." }]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!query.trim()) return;

    const userQuery = query;
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    setLoading(true);

    try {
      const historyPayload = messages.map(msg => ({ role: msg.role, content: msg.content }));
      
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userQuery, 
          sourceFilter: sourceFilter === 'Tutte le Fonti' ? null : sourceFilter,
          history: historyPayload,
          draftingMode
        }),
      });
      const data = await res.json();
      
      if (data.error) {
         setMessages(prev => [...prev, { role: 'assistant', content: `[Errore di Sistema]: ${data.error}` }]);
      } else {
         setMessages(prev => [...prev, { 
           role: 'assistant', 
           content: data.response, 
           sources: data.sources, 
           contra_analysis: data.contra_analysis, 
           web_updates: data.web_updates,
           legal_illustration: data.legal_illustration,
           fact_check: data.fact_check
         }]);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Si è verificato un errore di rete." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSocialSummary = async (idx: number) => {
    // Trova la domanda originale dell'utente subito prima di questa risposta
    const originalQuery = messages[idx - 1]?.content || '';
    const complexResponse = messages[idx].content;

    setMessages(prev => {
      const newMessages = [...prev];
      newMessages[idx] = { ...newMessages[idx], loading_social: true };
      return newMessages;
    });

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalQuery, complexResponse }),
      });
      
      const data = await res.json();
      
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[idx] = { 
          ...newMessages[idx], 
          loading_social: false,
          social_summary: data.error ? `[Errore] ${data.error}` : data.summary
        };
        return newMessages;
      });
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[idx] = { ...newMessages[idx], loading_social: false, social_summary: '[Errore di rete durante la generazione]' };
        return newMessages;
      });
    }
  };

  const handleGenerateMindMap = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const isPremium = user?.user_metadata?.is_premium === true;
    if (!isPremium) {
      setShowSubscriptionModal(true);
      return;
    }

    if (messages.length === 0) return;
    setLoadingMindMap(true);
    try {
      const res = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: messages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!data.error) {
        setMindMapData(data);
      } else {
        alert("Errore AI: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Errore di rete durante la generazione della mappa.");
    } finally {
      setLoadingMindMap(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-slate-900 font-sans selection:bg-blue-500/20 overflow-x-hidden">
      
      {/* Navbar Minimal - Fixed at Top */}
      <nav className="w-full flex items-center justify-between p-6 max-w-6xl mx-auto border-b border-black/5 shrink-0 z-50 glass-panel sticky top-0 transition-all duration-300">
        <div className="flex items-center gap-3">
          <Image src="/images/atena-text-logo.png" alt="Atena Logo" width={110} height={35} className="object-contain drop-shadow-sm" priority />
        </div>
        <div className="flex items-center gap-7 text-sm font-bold text-slate-500">
          <Link href="/library" className="hover:text-slate-900 transition-colors flex items-center gap-1.5 pb-1">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
             Biblioteca Legale
          </Link>
          <Link href="/diff-demo" className="hover:text-slate-900 transition-colors flex items-center gap-1.5 pb-1">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
             Version Diff
          </Link>
          <a href="#search" className="hover:text-slate-900 transition-colors">Ricerca</a>
          <a href="#features" className="hover:text-slate-900 transition-colors">Funzionalità</a>
          <Link href="/atena" className="text-blue-600 hover:text-blue-700 transition-colors font-bold flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            Atena AI Chat
          </Link>
          <Link href="/guardian" className="text-red-500 hover:text-red-600 transition-colors font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Guardian Alerts
          </Link>
          
          <div className="w-px h-5 bg-slate-200 ml-2"></div>
          
          {user ? (
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={() => setShowSubscriptionModal(true)}
                className="text-xs font-black text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-4 py-2 rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95"
              >
                Passa a Premium ✨
              </button>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl"
              >
                Esci
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md ml-2"
            >
              Accedi
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u: User) => {
             setUser(u);
             setShowAuthModal(false);
          }}
        />
      )}

      {/* Subscription Paywall Overlay */}
      {showSubscriptionModal && (
        <SubscriptionModal 
          onClose={() => setShowSubscriptionModal(false)}
          userEmail={user?.email || ''}
        />
      )}

      {/* Background Effects Removed - Handled globally by GenerativeBackground in layout.tsx */}

      <main className="flex-1 relative z-10 w-full flex flex-col items-center">
        <div className="w-full max-w-5xl px-4 flex flex-col">

          {/* ============================================ */}
          {/* LANDING PAGE (visible only when no messages) */}
          {/* ============================================ */}
          {messages.length === 0 && (
            <>
              {/* HERO SECTION (2-Column Premium Layout) */}
              <section className="w-full max-w-6xl mx-auto mt-20 mb-20 flex flex-col md:flex-row items-center gap-12 animate-fade-in-up px-4">
                {/* Text Content */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/50 mb-8 backdrop-blur-md shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">Progetto Sperimentale Giuridico</span>
                  </div>
                  <div className="mb-6 max-w-[280px] md:max-w-xs mx-auto md:mx-0">
                    <Image src="/images/atena-text-logo.png" alt="Atena" width={300} height={100} priority className="object-contain drop-shadow-md" />
                  </div>
                  <p className="text-xl md:text-2xl text-slate-600 max-w-xl md:mx-0 mx-auto font-light leading-relaxed mb-8">
                    Assistente Avanzato per la <strong className="text-slate-900 font-semibold">Ricerca Giuridica</strong> e l&apos;Analisi Normativa.
                  </p>
                  <p className="text-sm text-slate-500 max-w-md md:mx-0 mx-auto font-medium">
                    Analisi semantica di Costituzione, Codici e Giurisprudenza basata sull&apos;intelligenza artificiale.
                  </p>
                </div>
                
                {/* 3D Visual Graphic */}
                <div className="flex-1 relative flex justify-center items-center">
                  {/* Soft background behind image */}
                  <div className="absolute inset-0 bg-slate-100/50 blur-[100px] rounded-full scale-110"></div>
                  
                  {/* The generated image floating */}
                  <div className="relative z-10 animate-float">
                    <div className="rounded-[40px] overflow-hidden animate-glow border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative bg-white/40 backdrop-blur-xl p-4">
                      <Image 
                        src="/atena-scale-logo.png" 
                        alt="Atena Legal AI - Logo" 
                        width={400} 
                        height={400}
                        className="object-cover w-full h-auto max-w-sm md:max-w-md rounded-[28px] !shadow-none mix-blend-multiply"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* SEARCH AREA */}
              <section id="search" className="w-full max-w-3xl mx-auto mb-16 relative z-20">
                {/* Source Filter Tabs */}
                <div className="flex justify-center flex-wrap gap-2 mb-6">
                  <div className="inline-flex flex-wrap justify-center items-center gap-1.5 bg-white/70 backdrop-blur-2xl border border-black/5 p-1.5 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    {['Tutte le Fonti', 'Costituzione Italiana', 'Codice Civile Italiano', 'Codice Penale', 'EUR-Lex', 'Gazzetta Ufficiale'].map((source) => (
                      <button
                        key={source}
                        onClick={() => setSourceFilter(source)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                          sourceFilter === source 
                            ? 'bg-slate-900 text-white shadow-md scale-100' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 scale-95 hover:scale-100'
                        }`}
                      >
                        {source === 'Tutte le Fonti' ? '🌐 Tutte' : source.replace(' Italiano', '').replace(' Italiana', '')}
                      </button>
                    ))}
                    <div className="w-px h-6 bg-slate-200 mx-2"></div>
                    <button
                      onClick={() => setDraftingMode(!draftingMode)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                        draftingMode 
                          ? 'bg-blue-50 text-blue-600 shadow-[0_2px_10px_rgba(59,130,246,0.15)] border border-blue-200 scale-100' 
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 border border-transparent scale-95 hover:scale-100'
                      }`}
                    >
                      <span>✍️</span> {draftingMode ? 'Drafting: ON' : 'Drafting: OFF'}
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="w-full relative group max-w-2xl mx-auto">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-100/40 to-slate-100/40 rounded-3xl blur-[15px] opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
                  <form onSubmit={handleSearch} className="relative flex items-center bg-white/90 backdrop-blur-xl border border-black/5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-2 focus-within:shadow-[0_8px_40px_rgba(59,130,246,0.1)] focus-within:border-blue-200 transition-all duration-500">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Fai una domanda giuridica o cita un caso..."
                      className="w-full bg-transparent border-none text-lg text-slate-800 placeholder-slate-400 focus:ring-0 px-5 py-4 outline-none font-medium pr-24"
                      disabled={loading}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="application/pdf"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-16 p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-xl flex items-center justify-center"
                      title="Analizza documento PDF"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || !query.trim()}
                      className="absolute right-3 p-3 bg-slate-900 text-white rounded-xl shadow-md hover:bg-blue-600 hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-40 disabled:shadow-none flex items-center justify-center"
                    >
                      {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              </section>

              {/* LIVE STATS BAR */}
              <section className="w-full max-w-5xl mx-auto mb-20 relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 via-slate-100 to-transparent rounded-[32px] blur-xl opacity-30"></div>
                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 p-6 md:p-8 rounded-[32px] bg-white/70 border border-black/5 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.03)]">
                  <AnimatedStat value="8.000" label="Documenti Indicizzati" suffix="+" />
                  <AnimatedStat value="24/7" label="Web Scraping Attivo" />
                  <AnimatedStat value="5+" label="Database Ufficiali" />
                  <AnimatedStat value="< 2s" label="Tempo di Risposta" />
                </div>
              </section>

              {/* 3-STEP PROCESS (Apple Style) */}
              <section className="w-full max-w-4xl mx-auto mb-20">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                    Come funziona Atena
                  </h2>
                  <p className="text-lg text-slate-500 max-w-lg mx-auto font-medium">Tre passi per ottenere risposte legali precise, verificate e aggiornate in tempo reale.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <ProcessStep step={1} title="Chiedi" description="Scrivi la tua domanda in linguaggio naturale, come parleresti con un collega. Atena capisce il contesto giuridico." />
                  <ProcessStep step={2} title="Analizza" description="L'IA interroga simultaneamente 5 database ufficiali, verifica le fonti con il Protocollo Decimo Uomo e cerca aggiornamenti live." />
                  <ProcessStep step={3} title="Proteggi" description="Ricevi una risposta con fonti citate, contro-analisi critica e alert in tempo reale su cambiamenti normativi." />
                </div>
              </section>

              {/* FEATURE SHOWCASE */}
              <section id="features" className="w-full max-w-6xl mx-auto mb-20 px-4">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                    Architettura e Funzionalità Core
                  </h2>
                  <p className="text-lg text-slate-500 max-w-lg mx-auto font-medium">Strumenti di analisi strutturati per supportare la ricerca e l&apos;interpretazione normativa.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FeatureCard 
                    icon="🧠" 
                    title="RAG Semantico Multimodale" 
                    description="Ricerca vettoriale con embedding Gemini su documenti testuali, audio e immagini. Non keyword matching, ma comprensione del significato."
                    tag="Core Engine"
                  />
                  <FeatureCard 
                    icon="⚔️" 
                    title="Protocollo Decimo Uomo" 
                    description="Ogni risposta viene sottoposta a contro-analisi critica. L'IA cerca attivamente falle, eccezioni e interpretazioni alternative."
                    tag="Anti-Bias"
                  />
                  <FeatureCard 
                    icon="🌐" 
                    title="Live Web Agent" 
                    description="Integrazione con Perplexity Sonar per aggiornamenti in tempo reale da fonti web. Sentenze recenti, dottrina, news giuridiche."
                    tag="Real-Time"
                  />
                  <FeatureCard 
                    icon="🛡️" 
                    title="Guardian Alerts" 
                    description="Sistema autonomo che monitora cambiamenti normativi e identifica potenziali anomalie e trappole legali prima che impattino i cittadini."
                  />
                  <FeatureCard 
                    icon="🎨" 
                    title="Visual Legal Intelligence" 
                    description="Google Imagen 4 genera illustrazioni contestuali per rendere comprensibili concetti giuridici complessi. Perfetto per presentazioni."
                  />
                  <FeatureCard 
                    icon="📊" 
                    title="Version Diff Tracker" 
                    description="Confronta versioni di articoli di legge nel tempo. Visualizza aggiunte, rimozioni e modifiche con evidenziazione diff precisa."
                  />
                </div>
              </section>

              {/* SYSTEM ARCHITECTURE */}
              <section className="w-full max-w-4xl mx-auto mb-20">
                <div className="text-center mb-10">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Infrastruttura di Sistema</p>
                </div>
                <div className="flex flex-wrap justify-center gap-10 items-center opacity-70">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="text-xl drop-shadow-sm">🔮</span> Modelli Linguistici di Base
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="text-xl drop-shadow-sm">🔍</span> Agente Web in Tempo Reale
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="text-xl drop-shadow-sm">⚡</span> Architettura Vettoriale Distribuita
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="text-xl drop-shadow-sm">🎨</span> Generazione Visiva Contestuale
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="text-xl drop-shadow-sm">▲</span> Infrastruttura Serverless
                  </div>
                </div>
              </section>

              {/* CTA FINALE */}
              <section className="w-full max-w-4xl mx-auto mb-32 text-center px-4">
                <div className="p-6 md:p-8 rounded-[2rem] rounded-tl-md bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative w-full transition-all duration-500 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50"></div>
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 blur-[100px] rounded-full mix-blend-multiply opacity-50"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                      Pronto a rivoluzionare la tua ricerca legale?
                    </h2>
                    <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto font-medium">
                      Inizia subito — nessuna registrazione richiesta. Scrolla in alto e fai la tua prima domanda.
                    </p>
                    <a href="#search" className="inline-flex items-center gap-3 px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_40px_rgba(59,130,246,0.3)] hover:-translate-y-1 active:translate-y-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Inizia la Ricerca
                    </a>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ============================================ */}
          {/* CHAT MODE (visible when messages exist)      */}
          {/* ============================================ */}
          {messages.length > 0 && (
            <div className="flex flex-col gap-10 w-full pt-8 pb-32">
              {maintenanceMode ? (
                <div className="w-full flex justify-center mt-12">
                  <MaintenanceMode 
                    progress={ingestionProgress} 
                    totalChunks={totalChunks} 
                    currentChunk={currentChunk} 
                  />
                </div>
              ) : (
                <>
                  {/* Chat Stream */}
                  {messages.map((message, idx) => (
                    <div key={idx} className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                      
                      {message.role === 'user' ? (
                        <div className="max-w-[80%] p-6 rounded-[28px] rounded-tr-[10px] bg-slate-900/80 backdrop-blur-xl text-white shadow-2xl border border-white/10">
                          <p className="text-white/95 text-lg font-medium leading-relaxed">{message.content}</p>
                        </div>
                      ) : (
                        <div className="w-full flex flex-col gap-6">
                          <div className="p-8 md:p-10 rounded-[32px] rounded-tl-[10px] relative overflow-hidden glass-panel">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400/50 to-indigo-500/50 opacity-80 backdrop-blur-md"></div>
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300 flex items-center justify-center text-sm font-bold text-slate-800 shadow-sm">L</div>
                              <h3 className="text-sm font-bold text-slate-800 tracking-widest uppercase">Atena Synthesis</h3>
                            </div>
                              <MarkdownRenderer content={message.content} />

                            {/* TENTH MAN PROTOCOL */}
                            {message.contra_analysis && (
                              <div className="mt-10 pt-8 border-t border-amber-500/20 relative">
                                 <div className="absolute -top-[1px] left-0 w-1/4 h-[2px] bg-gradient-to-r from-amber-500 to-transparent"></div>
                                 <div className="flex items-center gap-3 mb-4">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
                                    <h4 className="text-xs font-bold text-amber-600 tracking-widest uppercase">Protocollo Decimo Uomo (Verifica Incrociata)</h4>
                                 </div>
                                 <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200/50 shadow-inner">
                                      <MarkdownRenderer content={message.contra_analysis} />
                                 </div>
                              </div>
                            )}
                            
                            {/* LEGAL ILLUSTRATION */}
                            {message.legal_illustration && (
                              <div className="mt-10 pt-8 border-t border-purple-500/20 relative animate-fade-in-up">
                                 <div className="absolute -top-[1px] right-0 w-1/4 h-[2px] bg-gradient-to-l from-purple-500 to-transparent"></div>
                                 <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                                      <h4 className="text-xs font-bold text-purple-600 tracking-widest uppercase">Visual Legal Intelligence</h4>
                                    </div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 bg-purple-100 px-3 py-1 rounded-md border border-purple-200">Powered by Imagen 4</span>
                                 </div>
                                 <div className="rounded-[28px] overflow-hidden shadow-xl border border-purple-200 group relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                      src={`data:image/jpeg;base64,${message.legal_illustration}`} 
                                      alt="Legal Illustration" 
                                      className="w-full h-auto object-cover transform group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none flex items-end p-6">
                                      <span className="text-white/95 text-sm font-semibold tracking-wide drop-shadow-md">Immagine autogenerata dall&apos;IA sulla base del contesto giuridico</span>
                                    </div>
                                 </div>
                              </div>
                            )}

                            {/* GOOGLE DOC CARD */}
                            {(() => {
                              const docUrl = extractGoogleDocUrl(message.content);
                              return docUrl ? <GoogleDocCard url={docUrl} /> : null;
                            })()}

                            {/* FACT-CHECK AUTO-VALIDATION */}
                            {message.fact_check && (
                              <LegalFactCheck report={message.fact_check} />
                            )}

                            {/* TRUTH FEEDBACK */}
                            <TruthFeedback 
                              queryText={messages[idx - 1]?.content || ''} 
                              assistantResponse={message.content} 
                            />

                            {/* SOCIAL ECHO (Viral Pill) */}
                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
                              {!message.social_summary && !message.loading_social ? (
                                <button
                                  onClick={() => handleGenerateSocialSummary(idx)}
                                  className="self-start text-sm font-bold text-pink-500 hover:text-pink-600 bg-pink-50 hover:bg-pink-100 px-4 py-2 rounded-xl transition-colors border border-pink-100 flex items-center gap-2 shadow-sm"
                                >
                                  ✨ Genera Pillola Social
                                </button>
                              ) : message.loading_social ? (
                                <div className="flex items-center gap-2 text-sm text-pink-500 animate-pulse font-medium">
                                  <span className="w-4 h-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin"></span>
                                  Sintesi per i social in corso...
                                </div>
                              ) : (
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 shadow-inner relative group animate-fade-in-up">
                                  <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xl">✨</span>
                                    <h4 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 tracking-widest uppercase">Pillola Social Pronta</h4>
                                  </div>
                                  <div className="text-slate-800 whitespace-pre-wrap font-medium leading-relaxed">
                                    {message.social_summary}
                                  </div>
                                  <div className="flex items-center gap-3 mt-6">
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(message.social_summary || '');
                                        alert('Testo copiato negli appunti! Pronto per Instagram/TikTok o da incollare dove preferisci.');
                                      }}
                                      className="text-xs font-bold text-white bg-slate-900 hover:bg-black px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-md"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                      Copia Testo
                                    </button>
                                    <button
                                      onClick={() => setActiveSocialCardContent({ 
                                        content: message.social_summary || '', 
                                        sourceTitle: message.sources?.[0]?.title || undefined 
                                      })}
                                      className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                      <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                      Atena Snapshot (Card)
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (navigator.share) {
                                          navigator.share({
                                            title: "Pillola Social di Atena",
                                            text: message.social_summary || '',
                                            url: window.location.href,
                                          }).catch(console.error);
                                        } else {
                                          alert("La condivisione nativa non è supportata su questo dispositivo. Usa il bottone 'Copia Testo'.");
                                        }
                                      }}
                                      className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                      <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                      Condividi
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Official Sources */}
                          {message.sources && message.sources.length > 0 && (
                            <div className="flex flex-col gap-4 pl-4 md:pl-6 border-l-[3px] border-slate-200">
                              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Fonti Ufficiali Consultate ({message.sources.length})</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                                {message.sources.map((source: LegalSource, sIdx: number) => (
                                  <a href={source.source_url} target="_blank" rel="noreferrer" key={sIdx} className="group p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:border-slate-300 transition-all duration-300 flex flex-col gap-3 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full filter blur-2xl group-hover:bg-blue-50 transition-colors duration-500"></div>
                                    <div className="flex items-center justify-between z-10 mb-1">
                                      <span className="text-[11px] font-bold text-slate-500 truncate flex items-center gap-2">
                                         {String(source.metadata?.source || 'Documento Legale')}
                                         {Boolean(source.metadata?.sezione) && <span className="bg-slate-100 border border-slate-200 text-slate-600 py-0.5 px-2 rounded-md">{String(source.metadata?.sezione)}</span>}
                                      </span>
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 truncate z-10">{source.title}</h4>
                                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium z-10">{source.content}</p>
                                    <div className="mt-3 flex items-center justify-between z-10 w-full bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                       <div className="w-1/2 h-2 bg-slate-200 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full ${source.similarity >= 0.1 ? 'bg-blue-500' : 'bg-indigo-400'}`} style={{ width: `${Math.round(source.similarity * 100)}%`}}></div>
                                       </div>
                                       <span className={`text-[10px] font-black uppercase tracking-widest ${source.similarity >= 0.1 ? 'text-blue-600' : 'text-indigo-500'}`}>{source.similarity >= 0.1 ? 'ALTA' : 'MEDIA'} RILEVANZA</span>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* LIVE WEB UPDATES */}
                          {message.web_updates && (
                            <div className="flex flex-col gap-4 pl-4 md:pl-6 border-l-[3px] border-emerald-500 mt-6">
                              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 pl-2">
                                 <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                 Live Web Agent (Perplexity Sonar)
                              </h3>
                              <div className="p-8 rounded-[32px] bg-emerald-50/50 border border-emerald-200/60 shadow-inner relative overflow-hidden ml-2">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-100/50 rounded-full filter blur-3xl"></div>
                                   <MarkdownRenderer content={message.web_updates} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  ))}

                  {/* Mind Map Generator Button */}
                  {messages.length > 0 && !loading && (
                    <div className="flex w-full justify-center animate-fade-in-up mt-8">
                       <button 
                         onClick={handleGenerateMindMap}
                         disabled={loadingMindMap}
                         className="px-8 py-3.5 rounded-2xl glass-panel text-sm font-extrabold text-indigo-700 hover:text-indigo-800 flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] shadow-[0_8px_30px_rgba(79,70,229,0.1)] active:scale-95 group border border-indigo-200"
                       >
                         {loadingMindMap ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Sintesi Cognitiva in corso...
                            </>
                         ) : (
                            <>
                              <span className="text-xl group-hover:rotate-12 transition-transform">🧠</span>
                              Genera Mappa Mentale (Riepilogo Sessione)
                            </>
                         )}
                       </button>
                    </div>
                  )}

                  {/* Thinking Indicator — shown during loading */}
                  {loading && (
                    <div className="flex w-full justify-start animate-fade-in-up">
                      <ThinkingIndicator />
                    </div>
                  )}

                  {/* Floating Input when in chat mode */}
                  <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white/60 via-white/40 to-transparent backdrop-blur-[2px] pt-16 pb-8 px-4 z-50">
                    <div className="max-w-3xl mx-auto w-full flex flex-col gap-5">
                      <div className="flex justify-center flex-wrap gap-2 max-w-full">
                        <div className="flex w-full md:w-auto md:inline-flex md:flex-wrap items-center gap-1.5 glass-panel p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
                          {['Tutte le Fonti', 'Costituzione Italiana', 'Codice Civile Italiano', 'Codice Penale', 'EUR-Lex', 'Gazzetta Ufficiale'].map((source) => (
                            <button
                              key={source}
                              onClick={() => setSourceFilter(source)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                                sourceFilter === source 
                                  ? 'bg-slate-900 text-white shadow-md' 
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                              }`}
                            >
                              {source === 'Tutte le Fonti' ? '🌐 Tutte' : source.replace(' Italiano', '').replace(' Italiana', '')}
                            </button>
                          ))}
                          <div className="w-px h-6 bg-slate-200 mx-1"></div>
                          <button
                            onClick={() => setDraftingMode(!draftingMode)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                              draftingMode 
                                ? 'bg-blue-50 text-blue-600 shadow-[0_2px_10px_rgba(59,130,246,0.15)] border border-blue-200' 
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 border border-transparent'
                            }`}
                          >
                            <span>✍️</span> {draftingMode ? 'Drafting: ON' : 'Drafting: OFF'}
                          </button>
                        </div>
                      </div>
                      <div className="w-full relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-100/40 to-slate-100/40 rounded-3xl blur-[15px] opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
                        <form onSubmit={handleSearch} className="relative flex items-center glass-panel rounded-[2rem] p-2 focus-within:bg-white/95 focus-within:shadow-[0_15px_50px_rgba(59,130,246,0.12)] focus-within:border-blue-100 transition-all duration-500">
                          <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Fai una domanda giuridica o cita un caso..."
                            className="w-full bg-transparent border-none text-lg text-slate-800 placeholder-slate-400 focus:ring-0 px-6 py-5 outline-none font-semibold pr-24"
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute right-16 p-3.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300 rounded-[1.25rem] flex items-center justify-center"
                            title="Analizza documento PDF"
                            disabled={loading}
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                          </button>
                          <button 
                            type="submit" 
                            disabled={loading || !query.trim()}
                            className="absolute right-3 p-3.5 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-[1.25rem] shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_25px_rgba(59,130,246,0.25)] hover:from-blue-600 hover:to-blue-500 transition-all duration-500 disabled:opacity-40 disabled:hover:shadow-none flex items-center justify-center active:scale-95"
                          >
                            {loading ? (
                              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-black/5 bg-white py-16 relative z-10 shrink-0 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg font-bold border border-slate-200 text-slate-800 shadow-sm">L</div>
             <div>
               <Image src="/images/atena-text-logo.png" alt="Atena Logo" width={90} height={28} className="object-contain opacity-90 mb-1" />
               <p className="text-sm font-medium text-slate-500">L&apos;Intelligenza Legale Definitiva</p>
             </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3 text-sm text-slate-400 font-medium max-w-2xl">
            <p className="text-center md:text-right text-xs leading-relaxed">
              Le informazioni generate da Atena sono intese esclusivamente a scopo di ricerca e analisi testuale. Atena è un sistema di intelligenza artificiale sperimentale e può produrre risultati imprecisi o incompleti (allucinazioni). Nessuna risposta sostituisce il parere di un avvocato abilitato o la consultazione diretta delle gazzette ufficiali. Utilizzando questo servizio, accetti che Atena e i suoi creatori non sono responsabili per eventuali danni derivanti dall&apos;uso di queste informazioni.
            </p>
            <div className="flex gap-6 mt-1">
               <span className="hover:text-slate-900 transition-colors cursor-pointer">Privacy Policy</span>
               <span className="hover:text-slate-900 transition-colors cursor-pointer">Termini di Servizio</span>
               <span className="hover:text-slate-900 transition-colors cursor-pointer">Contatti</span>
             </div>
          </div>
        </div>
      </footer>
      <AsyncQueueTracker />
      
      {/* RENDER MODAL CONDITIONAL */}
      {activeSocialCardContent && (
        <SocialCard
          content={activeSocialCardContent.content}
          sourceTitle={activeSocialCardContent.sourceTitle}
          onClose={() => setActiveSocialCardContent(null)}
        />
      )}

      {/* RENDER MIND MAP CONDITIONAL */}
      {mindMapData && (
        <MindMapViewer 
          initialNodes={mindMapData.nodes} 
          initialEdges={mindMapData.edges} 
          onClose={() => setMindMapData(null)} 
        />
      )}
    </div>
  );
}
