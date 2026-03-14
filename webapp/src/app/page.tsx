'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MaintenanceMode from '../components/MaintenanceMode';
import NetworkBackground from '../components/NetworkBackground';

interface LegalSource {
  title: string;
  content: string;
  source_url: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}



export default function Home() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, sources?: LegalSource[], contra_analysis?: string, web_updates?: string, legal_illustration?: string }[]>([]);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('Tutte le Fonti');
  const [loading, setLoading] = useState(false);
  const [maintenanceMode] = useState(false); // Turned off, ingestion is complete
  const [ingestionProgress] = useState(15.9);
  const [currentChunk] = useState(573);
  const totalChunks = 3609;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query;
    // Add User Query to History Immediately
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    setLoading(true);

    try {
      // Pass the previous history (excluding the one we just added because Gemini doesn't need to know it's about to answer what we just asked as "history")
      const historyPayload = messages.map(msg => ({ role: msg.role, content: msg.content }));
      
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userQuery, 
          sourceFilter: sourceFilter === 'Tutte le Fonti' ? null : sourceFilter,
          history: historyPayload
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
           legal_illustration: data.legal_illustration
         }]);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Si è verificato un errore di rete." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      
      {/* Navbar Minimal - Fixed at Top */}
      <nav className="w-full flex items-center justify-between p-6 max-w-6xl mx-auto border-b border-white/5 shrink-0 z-50 bg-[#050505]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            L
          </div>
          <span className="font-semibold tracking-wide text-lg text-white/90">LEXAI</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/50">
          <Link href="/diff-demo" className="hover:text-white transition-colors flex items-center gap-1.5">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
             Version Diff
          </Link>
          <a href="#" className="hover:text-white transition-colors">Ricerca</a>
          <a href="#" className="hover:text-white transition-colors">Fonti</a>
          <Link href="/guardian" className="text-red-400/80 hover:text-red-400 transition-colors font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Guardian Alerts
          </Link>
        </div>
      </nav>

      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* R3F 3D Neural Network / Law Constellation */}
        <NetworkBackground />
        
        {/* Subtle glows to complement WebGL and tie the brand colors */}
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-indigo-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

    <main className="flex-1 overflow-y-auto relative z-10 w-full flex flex-col items-center pt-8 pb-32">
      <div className="w-full max-w-4xl px-4 flex flex-col gap-8">
        
        {/* Header - Only visible if no messages */}
        {messages.length === 0 && (
          <div className="text-center mt-12 mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-xs font-semibold tracking-wide text-white/80 uppercase">Silicon Valley Grade Intelligence</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/50">
              LEXAI
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto font-light leading-relaxed">
              Il motore di ricerca semantico definitivo per il Diritto Italiano. Interroga le fonti ufficiali usando il linguaggio naturale.
            </p>
          </div>
        )}

        {maintenanceMode ? (
          <div className="w-full flex justify-center mt-12">
            <MaintenanceMode 
              progress={ingestionProgress} 
              totalChunks={totalChunks} 
              currentChunk={currentChunk} 
            />
          </div>
        ) : (
          <div className="flex flex-col gap-10 w-full">
            {/* Chat Stream */}
            {messages.map((message, idx) => (
              <div key={idx} className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                
                {message.role === 'user' ? (
                  // User Message Bubble
                  <div className="max-w-[80%] p-5 rounded-3xl rounded-tr-sm bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 backdrop-blur-md">
                    <p className="text-white/90 text-lg">{message.content}</p>
                  </div>
                ) : (
                  // Assistant Message Area
                  <div className="w-full flex flex-col gap-6">
                    {/* AI Synthesis */}
                    <div className="p-8 rounded-3xl rounded-tl-sm bg-gradient-to-b from-[#1A1A1C] to-[#0A0A0B] border border-white/10 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50"></div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(37,99,235,0.8)]">L</div>
                        <h3 className="text-sm font-semibold text-white/60 tracking-wider uppercase">LEXAI Synthesis</h3>
                      </div>
                      <div className="prose prose-invert prose-p:leading-relaxed prose-blue max-w-none text-white/80">
                        {message.content}
                      </div>

                      {/* TENTH MAN PROTOCOL REBUTTAL */}
                      {message.contra_analysis && (
                        <div className="mt-8 pt-6 border-t border-amber-500/20 relative">
                           <div className="absolute -top-[1px] left-0 w-1/4 h-[1px] bg-gradient-to-r from-amber-500/50 to-transparent"></div>
                           <div className="flex items-center gap-2 mb-3">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              <h4 className="text-xs font-bold text-amber-500/80 tracking-widest uppercase">Protocollo Decimo Uomo (Verifica Incrociata)</h4>
                           </div>
                           <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/10">
                              <div className="prose prose-sm prose-invert prose-p:leading-relaxed prose-amber max-w-none text-amber-100/70">
                                {message.contra_analysis}
                              </div>
                           </div>
                        </div>
                      )}
                      
                      {/* LEGAL ILLUSTRATION (Google Imagen) */}
                      {message.legal_illustration && (
                        <div className="mt-8 pt-6 border-t border-purple-500/20 relative animate-fade-in-up">
                           <div className="absolute -top-[1px] right-0 w-1/4 h-[1px] bg-gradient-to-l from-purple-500/50 to-transparent"></div>
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                                <h4 className="text-xs font-bold text-purple-400/80 tracking-widest uppercase">Visual Legal Intelligence</h4>
                              </div>
                              <span className="text-[10px] uppercase font-mono text-purple-500/50 bg-purple-500/10 px-2 py-0.5 rounded-sm">Powered by Imagen 4</span>
                           </div>
                           <div className="rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.15)] border border-purple-500/20 group relative">
                              <img 
                                src={`data:image/jpeg;base64,${message.legal_illustration}`} 
                                alt="Legal Illustration" 
                                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end p-4">
                                <span className="text-white/80 text-xs font-medium">Immagine autogenerata dall&apos;IA sulla base del contesto giuridico</span>
                              </div>
                           </div>
                        </div>
                      )}
                    </div>

                    {/* Official Sources Cited (if any) */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="flex flex-col gap-4 pl-4 border-l-2 border-white/5">
                        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Fonti Ufficiali Consultate ({message.sources.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {message.sources.map((source: LegalSource, sIdx: number) => (
                            <a href={source.source_url} target="_blank" rel="noreferrer" key={sIdx} className="group p-4 rounded-2xl bg-[#141415]/50 border border-white/5 hover:border-white/20 hover:bg-[#1A1A1C] transition-all flex flex-col gap-2 relative overflow-hidden backdrop-blur-sm">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full filter blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                              <div className="flex items-center justify-between z-10 mb-1">
                                <span className="text-[10px] font-mono text-white/30 truncate flex items-center gap-2">
                                   {String(source.metadata?.source || 'Documento Legale')}
                                   {Boolean(source.metadata?.sezione) && <span className="bg-white/5 py-0.5 px-1.5 rounded-sm">{String(source.metadata?.sezione)}</span>}
                                </span>
                              </div>
                              <h4 className="text-sm font-medium text-white/90 truncate z-10">{source.title}</h4>
                              <p className="text-xs text-white/40 line-clamp-2 leading-relaxed z-10">{source.content}</p>
                              
                              <div className="mt-2 flex items-center justify-between z-10 w-full">
                                 <div className="w-1/2 h-[2px] bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${Math.round(source.similarity * 100)}%`}}></div>
                                 </div>
                                 <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">{(source.similarity * 100).toFixed(1)}% Match</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* LIVE WEB UPDATES (Perplexity Sonar) */}
                    {message.web_updates && (
                      <div className="flex flex-col gap-4 pl-4 border-l-2 border-emerald-500/20 mt-4">
                        <h3 className="text-xs font-semibold text-emerald-400/80 uppercase tracking-widest flex items-center gap-2">
                           <svg className="w-3 h-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                           Live Web Agent (Perplexity Sonar)
                        </h3>
                        <div className="p-5 rounded-2xl bg-emerald-950/10 border border-emerald-500/10 backdrop-blur-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-3xl"></div>
                          <div className="prose prose-sm prose-invert prose-emerald prose-p:leading-relaxed max-w-none text-emerald-100/70 z-10 relative">
                             {message.web_updates}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
      
    {/* Floating Bottom Input Area - Outside inner main to stick to bottom */}
    {!maintenanceMode && (
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pt-12 pb-8 px-4 z-50">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          
          {/* Source Filter Tabs */}
          <div className="flex justify-center gap-2">
            <div className="inline-flex gap-1 bg-[#141415]/80 backdrop-blur-md border border-white/10 p-1 rounded-xl shadow-lg">
              {['Tutte le Fonti', 'Costituzione Italiana', 'Codice Civile Italiano'].map((source) => (
                <button
                  key={source}
                  onClick={() => setSourceFilter(source)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sourceFilter === source 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {source === 'Tutte le Fonti' ? '🌐 Tutte' : source.replace(' Italiano', '').replace(' Italiana', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar - ChatGPT Style */}
          <div className="w-full relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
            <form onSubmit={handleSearch} className="relative flex items-center bg-[#141415] border border-white/10 rounded-2xl shadow-2xl p-2 focus-within:border-blue-500/50 transition-all">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Fai una domanda giuridica o cita un caso..."
                className="w-full bg-transparent border-none text-base text-white placeholder-white/20 focus:ring-0 px-4 py-3 outline-none"
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="absolute right-2 p-2.5 bg-white text-black rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {loading ? (
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </form>
          </div>
          
        </div>
      </div>
    )}
      


    </div>
  );
}
