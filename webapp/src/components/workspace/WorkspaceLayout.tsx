'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, Search, X, FileText, Share2, Layers, GitCompare } from 'lucide-react';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import LegalFactCheck from '../stateful/LegalFactCheck';
import ThinkingIndicator from '../ui/ThinkingIndicator';
import MindMapViewer from '../ui/MindMapViewer';
import { User } from '@supabase/supabase-js';
import { type FactCheckReport } from '@/lib/gemini';

interface LegalSource {
  title: string;
  content: string;
  source_url: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: LegalSource[];
  contra_analysis?: string;
  web_updates?: string;
  legal_illustration?: string;
  fact_check?: FactCheckReport;
  social_summary?: string;
  loading_social?: boolean;
}

// Tipi di artefatti che possono vivere nel Canvas destro
type ArtifactType = 'mindmap' | 'sources' | 'illustration' | 'factcheck' | 'contra_analysis';

interface ActiveArtifact {
  type: ArtifactType;
  title: string;
  data: unknown;
  messageIndex: number;
}

export default function WorkspaceLayout({ 
  user, 
  onRequireAuth, 
  onRequirePro 
}: { 
  user: User | null; 
  onRequireAuth: () => void; 
  onRequirePro: () => void; 
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('Tutte le Fonti');
  const [draftingMode, setDraftingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const isPremium = user?.user_metadata?.is_premium === true;
  const [freeQueriesUsed, setFreeQueriesUsed] = useState<number>(user?.user_metadata?.free_queries_used || 0);
  const freeQueriesLeft = Math.max(0, 10 - freeQueriesUsed);

  // Canvas State (Stitch 2.0 Paradigm)
  const [activeArtifact, setActiveArtifact] = useState<ActiveArtifact | null>(null);

  // Altri stati
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return onRequireAuth();
    if (user?.user_metadata?.is_premium !== true) return onRequirePro();

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
       alert("Si prega di caricare solo file PDF per l'analisi.");
       return;
    }

    setMessages(prev => [...prev, { role: 'user', content: `📄 [Documento caricato: ${file.name}] Effettua un'analisi avanzata di questo documento.` }]);
    setLoading(true);
    setActiveArtifact(null); // Close canvas on new query

    const formData = new FormData();
    formData.append('file', file);
    formData.append('draftingMode', String(draftingMode));
    if (messages.length > 0) {
      formData.append('history', JSON.stringify(messages.map(m => ({ role: m.role, content: m.content }))));
    }

    try {
      const res = await fetch('/api/analyze-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.error) {
         setMessages(prev => [...prev, { role: 'assistant', content: `[Errore Analisi PDF]: ${data.error}` }]);
      } else {
         const newMsg: ChatMessage = { 
           role: 'assistant', 
           content: data.response, 
           sources: data.sources, 
           contra_analysis: data.contra_analysis,
           fact_check: data.fact_check
         };
         setMessages(prev => [...prev, newMsg]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Errore durante l'upload e l'analisi." }]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return onRequireAuth();
    if (!isPremium && freeQueriesLeft <= 0) return onRequirePro();
    if (!query.trim()) return;

    const userQuery = query;
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    setLoading(true);
    // Smooth transition: if we start a new thought, we might clear the canvas or keep it if it's relevant. Let's close it to focus on chat.
    if (window.innerWidth < 1024) setActiveArtifact(null); 

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
         if (data.error === 'QUOTA_EXCEEDED' || data.error === 'PREMIUM_REQUIRED') {
            onRequirePro();
            setMessages(prev => prev.slice(0, -1)); // Rimuovi il messaggio utente visto che è stato bloccato
         } else {
            setMessages(prev => [...prev, { role: 'assistant', content: `[Errore di Sistema]: ${data.error}` }]);
         }
      } else {
         if (!isPremium) setFreeQueriesUsed(prev => prev + 1);
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
      setMessages(prev => [...prev, { role: 'assistant', content: "Errore di rete." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMindMap = async () => {
    if (!user) return onRequireAuth();
    if (user?.user_metadata?.is_premium !== true) return onRequirePro();
    if (messages.length === 0) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: messages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!data.error) {
        setActiveArtifact({
          type: 'mindmap',
          title: 'Sintesi Cognitiva',
          data: data,
          messageIndex: messages.length - 1
        });
      } else {
        alert("Errore AI: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Errore durante la generazione della mappa.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING CANVAS CONTENT ---
  const renderCanvasContent = () => {
    if (!activeArtifact) return null;

    switch (activeArtifact.type) {
      case 'sources':
        const sources = activeArtifact.data as LegalSource[];
        return (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            {sources.map((source: LegalSource, sIdx: number) => (
              <a href={source.source_url} target="_blank" rel="noreferrer" key={sIdx} className="group p-5 rounded-[32px] bg-white border border-marble-200 shadow-sm hover:border-platinum-300 hover:shadow-md transition-all flex flex-col gap-3 relative overflow-hidden">
                <div className="flex items-center justify-between z-10 mb-1">
                  <span className="text-[11px] font-bold text-slate-500 truncate flex items-center gap-2">
                    {String(source.metadata?.source || 'Documento Legale')}
                  </span>
                </div>
                <h4 className="text-base font-playfair font-bold text-slate-800 z-10">{source.title}</h4>
                <p className="text-sm text-slate-600 line-clamp-4 leading-relaxed font-light z-10">{source.content}</p>
                <div className="mt-2 flex items-center justify-between z-10 w-full bg-marble-50 p-3 rounded-[24px] border border-marble-200">
                  <div className="w-1/2 h-2 bg-marble-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${source.similarity >= 0.1 ? 'bg-slate-700' : 'bg-slate-500'}`} style={{ width: `${Math.round(source.similarity * 100)}%`}}></div>
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-700">Rilevanza {Math.round(source.similarity * 100)}%</span>
                </div>
              </a>
            ))}
          </div>
        );
      case 'mindmap':
        // eslint-disable-next-line no-case-declarations
        const rawMindmap = activeArtifact.data as Record<string, unknown>;
        // Handle both flat {nodes, edges} and nested {data: {nodes, edges}} from agent
        // eslint-disable-next-line no-case-declarations
        const mindmapData = (rawMindmap?.nodes ? rawMindmap : rawMindmap?.data ? rawMindmap.data : rawMindmap) as { nodes: Record<string, unknown>[], edges: Record<string, unknown>[] };
        return (
          <div className="w-full h-[600px] bg-marble-50/50 rounded-[32px] overflow-hidden border border-marble-200 relative">
            <MindMapViewer 
              initialNodes={mindmapData?.nodes} 
              initialEdges={mindmapData?.edges} 
            />
          </div>
        );
      case 'illustration':
        return (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <div className="w-full relative h-[400px] rounded-[32px] overflow-hidden border border-purple-500/20 shadow-xl">
              <Image 
                src={`data:image/jpeg;base64,${activeArtifact.data as string}`} 
                alt="Visual Legal Intelligence" 
                fill
                className="object-cover"
              />
            </div>
            <p className="text-sm text-slate-500 text-center font-light">
              Generazione Visiva Contestuale basata sul ragionamento giuridico in corso.
            </p>
          </div>
        );
      case 'contra_analysis':
         return (
            <div className="p-6 rounded-[32px] bg-amber-50 border border-amber-200 shadow-inner overflow-y-auto max-h-[80vh] custom-scrollbar animate-fade-in-up text-slate-800">
               <MarkdownRenderer content={activeArtifact.data as string} />
            </div>
         );
       case 'factcheck':
         return (
           <div className="animate-fade-in-up">
              <LegalFactCheck report={activeArtifact.data as FactCheckReport} />
           </div>
         );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-80px)] overflow-hidden bg-transparent">
      
      {/* LEFT PANEL: CHAT INTERFACE */}
      <div className={`flex flex-col h-full bg-marble-50 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative z-10 
          ${activeArtifact ? 'w-full lg:w-1/2 border-r border-marble-200 opacity-40 lg:opacity-100' : 'w-full'}
      `}>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 pb-40">
            {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                 <Image src="/atena-logo-new.jpeg" alt="Atena" width={120} height={120} className="mix-blend-multiply opacity-50 mb-6 drop-shadow-xl" style={{ width: 'auto', height: 'auto' }} />
                 <h2 className="text-2xl font-playfair font-black text-slate-700 mb-2">Workspace Giuridico Attivo</h2>
                 <p className="text-sm text-slate-500">Inizia a digitare o carica un PDF per sbloccare la sintesi generativa di Atena.</p>
               </div>
            ) : (
               <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
                 {messages.map((message, idx) => (
                   <div key={idx} className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                     {message.role === 'user' ? (
                       <div className="max-w-[85%] p-5 rounded-[24px] rounded-tr-[8px] bg-white backdrop-blur-xl text-slate-800 shadow-md border border-marble-200">
                         <p className="text-slate-800 text-base font-medium leading-relaxed">{message.content}</p>
                       </div>
                     ) : (
                       <div className="w-full flex flex-col gap-4">
                         
                         {/* Assistente Response */}
                         <div className="p-6 md:p-8 rounded-[32px] rounded-tl-[8px] relative bg-white/80 backdrop-blur-2xl border border-marble-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] text-slate-800">
                           <div className="flex items-center gap-3 mb-5">
                             <div className="w-7 h-7 rounded-[20px] bg-gradient-to-br from-white to-marble-100 border border-marble-200 flex items-center justify-center shadow-sm">
                               <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                             </div>
                             <h3 className="text-xs font-playfair font-bold text-slate-500 tracking-widest uppercase">Atena Synthesis</h3>
                           </div>
                           <div className="prose-sm">
                             <MarkdownRenderer content={message.content} />
                           </div>

                           {/* Smart Interactive Pills (Triggers Canvas) */}
                           <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-marble-200">
                              {message.sources && message.sources.length > 0 && (
                                <button onClick={() => setActiveArtifact({ type: 'sources', title: 'Fonti Normative', data: message.sources, messageIndex: idx })} className="px-3 py-1.5 rounded-[20px] bg-white border border-marble-200 hover:border-platinum-300 text-xs text-slate-600 flex items-center gap-1.5 transition-all shadow-sm">
                                  <Layers className="w-3.5 h-3.5 text-slate-700" /> Fonti ({message.sources.length})
                                </button>
                              )}
                              {message.contra_analysis && (
                                <button onClick={() => setActiveArtifact({ type: 'contra_analysis', title: 'Protocollo Decimo Uomo', data: message.contra_analysis, messageIndex: idx })} className="px-3 py-1.5 rounded-[20px] bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs text-slate-700 flex items-center gap-1.5 transition-all shadow-sm">
                                  <GitCompare className="w-3.5 h-3.5" /> Decimo Uomo
                                </button>
                              )}
                              {message.fact_check && (
                                <button onClick={() => setActiveArtifact({ type: 'factcheck', title: 'Fact Check Report', data: message.fact_check, messageIndex: idx })} className="px-3 py-1.5 rounded-[20px] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-xs text-emerald-700 flex items-center gap-1.5 transition-all shadow-sm">
                                  <FileText className="w-3.5 h-3.5" /> Affidabilità: {Math.round(message.fact_check.overall_score)}/100
                                </button>
                              )}
                              {message.legal_illustration && (
                                <button onClick={() => setActiveArtifact({ type: 'illustration', title: 'Generazione Visiva', data: message.legal_illustration, messageIndex: idx })} className="px-3 py-1.5 rounded-[20px] bg-purple-50 border border-purple-200 hover:bg-purple-100 text-xs text-purple-700 flex items-center gap-1.5 transition-all shadow-sm">
                                  <Sparkles className="w-3.5 h-3.5" /> Visual Intelligence
                                </button>
                              )}
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
                 
                 {loading && (
                   <div className="flex w-full justify-start animate-fade-in-up">
                     <ThinkingIndicator />
                   </div>
                 )}
                 <div ref={messagesEndRef} />
               </div>
            )}
         </div>

         {/* OMNIBAR INPUT (Floating at bottom of left panel) */}
         <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-marble-50 via-marble-50/90 to-transparent pt-10 pb-6 px-4 z-40 transition-all duration-700`}>
            <div className={`w-full mx-auto flex flex-col gap-3 transition-all duration-700 ${activeArtifact ? 'max-w-full' : 'max-w-3xl'}`}>
               <div className="flex w-full overflow-x-auto no-scrollbar gap-2 pb-1 items-center">
                 {['Tutte le Fonti', 'Costituzione Italiana', 'Codice Civile Italiano', 'Codice Penale', 'EUR-Lex'].map((source) => (
                   <button
                     key={source}
                     onClick={() => setSourceFilter(source)}
                     className={`px-3 py-1.5 rounded-[24px] text-[11px] font-semibold transition-all whitespace-nowrap border ${
                       sourceFilter === source 
                         ? 'bg-white text-slate-800 border-platinum-300 shadow-sm scale-105' 
                         : 'bg-white/80 text-slate-500 border-marble-200 hover:text-slate-700 shadow-sm'
                     }`}
                   >
                     {source.replace(' Italiano', '').replace(' Italiana', '')}
                   </button>
                 ))}
                 <button onClick={() => {
                   if (!isPremium) return onRequirePro();
                   setDraftingMode(!draftingMode);
                 }} className={`px-3 py-1.5 rounded-[24px] text-[11px] font-bold transition-all whitespace-nowrap border shadow-sm ${ draftingMode ? 'bg-white text-slate-800 border-platinum-300 shadow-sm scale-105' : 'bg-white/80 text-slate-500 border-marble-200 hover:text-slate-700' }`}>
                   Drafting: {draftingMode ? 'ON' : 'OFF'}
                 </button>
                 {messages.length > 0 && (
                   <button onClick={handleGenerateMindMap} className="px-3 py-1.5 rounded-[24px] text-[11px] font-bold transition-all whitespace-nowrap bg-white text-slate-700 border border-marble-200 hover:bg-marble-50 shadow-sm flex items-center gap-1">
                     <Layers className="w-3 h-3" /> Mappa
                   </button>
                 )}
                 
                 {!isPremium && (
                   <div className="ml-auto px-3 py-1.5 rounded-[24px] bg-white text-[10px] font-bold text-slate-500 flex items-center gap-1.5 border border-marble-200 shadow-sm whitespace-nowrap hidden sm:flex">
                     <div className={`w-1.5 h-1.5 rounded-full ${freeQueriesLeft > 0 ? 'bg-emerald-400' : 'bg-rose-500'} ${freeQueriesLeft > 0 ? 'animate-pulse' : ''} shadow-sm`}></div>
                     {freeQueriesLeft} / 10 Free
                   </div>
                 )}
               </div>

               <form onSubmit={handleSearch} className="relative flex items-center bg-white/90 backdrop-blur-2xl border border-marble-200 rounded-[24px] p-2 shadow-lg focus-within:border-platinum-300 transition-all">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Interroga la Dea o esplora la giurisprudenza..."
                    className="w-full bg-transparent border-none text-base text-slate-800 placeholder-slate-400 focus:ring-0 px-4 py-3 outline-none"
                    disabled={loading}
                  />
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-slate-600 transition-colors" disabled={loading}>
                    <FileText className="w-5 h-5" />
                  </button>
                  <button type="submit" disabled={loading || !query.trim()} className="p-3 ml-1 bg-slate-900 text-white rounded-[20px] hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0 flex items-center justify-center shadow-md">
                    <Search className="w-5 h-5" strokeWidth={3} />
                  </button>
               </form>
            </div>
         </div>
      </div>

      {/* RIGHT PANEL: GENERATIVE CANVAS (STITCH 2.0 STYLE) */}
      <div 
         className={`h-full absolute lg:relative right-0 top-0 bg-marble-50/90 lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-y-auto custom-scrollbar z-50 lg:z-auto
            ${activeArtifact ? 'w-full lg:w-1/2 opacity-100 translate-x-0' : 'w-full lg:w-0 opacity-0 translate-x-full lg:translate-x-10 pointer-events-none'}
         `}
      >
         {activeArtifact && (
            <div className="absolute inset-0 p-6 flex flex-col pt-10">
               <div className="flex items-center justify-between mb-8 pb-4 border-b border-marble-200 sticky top-0 bg-marble-50/90 backdrop-blur-md z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center shadow-lg">
                       <Sparkles className="w-4 h-4 text-white" />
                     </div>
                     <div>
                       <h2 className="text-lg font-black text-slate-800 tracking-tight">
                          {activeArtifact.title}
                       </h2>
                       <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Generato da Atena AI Engine</p>
                     </div>
                  </div>
                  <button onClick={() => setActiveArtifact(null)} className="p-2 rounded-[24px] bg-white border border-marble-200 text-slate-500 hover:text-slate-800 shadow-sm transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="flex-1">
                  {renderCanvasContent()}
               </div>
               
               <div className="mt-8 pt-6 border-t border-marble-200 flex justify-between items-center text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5">Powered by <span className="font-bold text-slate-500">Atena AI</span> · Perplexity · Google Gemini</span>
                  <div className="flex gap-4 border border-marble-200 rounded-[20px] px-3 py-1.5 bg-white shadow-sm">
                     <Share2 className="w-4 h-4 hover:text-slate-800 cursor-pointer transition-colors" />
                  </div>
               </div>
            </div>
         )}
      </div>

    </div>
  );
}


