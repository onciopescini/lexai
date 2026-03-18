'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import Image from 'next/image';
import Link from 'next/link';

interface Lesson {
  id: string;
  query_text: string;
  ai_response: string;
  fact_check_confidence: number;
  user_feedback_score: number;
  created_at: string;
}

export default function CivicLessonsDashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      // Fetch telemetry data that has a positive user feedback score
      const { data, error } = await supabase
        .from('atena_truth_telemetry')
        .select('*')
        .gt('user_feedback_score', 0) // Only highly rated lessons
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setLessons(data);
      }
      setLoading(false);
    };

    fetchLessons();
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-slate-900 font-sans selection:bg-blue-500/20">
      {/* Navbar Minimal */}
      <nav className="w-full flex items-center justify-between p-6 max-w-6xl mx-auto border-b border-black/5 bg-[#fbfbfd]/70 backdrop-blur-xl sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image src="/atena-logo-new.jpeg" alt="Atena Logo" width={110} height={35} className="object-contain drop-shadow-sm" priority style={{ width: 'auto', height: 'auto' }} />
        </Link>
        <div className="flex items-center gap-7 text-sm font-bold text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors">Torna all&apos;Assistente</Link>
        </div>
      </nav>

      {/* Header */}
      <header className="w-full text-center py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/4 w-1/2 h-full bg-blue-100 blur-[120px] rounded-full mix-blend-multiply"></div>
          <div className="absolute bottom-0 right-1/4 w-1/2 h-full bg-indigo-100 blur-[120px] rounded-full mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50/50 mb-6 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-[11px] font-bold tracking-widest text-blue-700 uppercase">Lezioni Civiche Condivise</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            Libreria della Saggezza
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            Esplora le ricerche legali più precise e utili generate da Atena, validate e approvate dalla community.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="w-full max-w-6xl mx-auto px-4 pb-32 relative z-10">
        {loading ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="break-inside-avoid bg-white/40 backdrop-blur-xl border border-slate-100 rounded-[32px] p-6 shadow-sm overflow-hidden">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="w-3/4 h-5 bg-slate-200/60 rounded animate-pulse"></div>
                  <div className="w-8 h-8 rounded-full bg-slate-200/60 animate-pulse shrink-0"></div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="w-full h-3.5 bg-slate-200/60 rounded animate-pulse"></div>
                  <div className="w-full h-3.5 bg-slate-200/60 rounded animate-pulse"></div>
                  <div className="w-5/6 h-3.5 bg-slate-200/60 rounded animate-pulse"></div>
                  <div className="w-4/6 h-3.5 bg-slate-200/60 rounded animate-pulse"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="w-24 h-5 bg-slate-200/60 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-slate-200/60 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6 text-3xl">📚</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Nessuna lezione disponibile</h3>
            <p className="text-slate-500 font-medium">Non ci sono ancora ricerche validate dalla community.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {lessons.map((lesson) => (
              <div 
                key={lesson.id} 
                className="break-inside-avoid bg-white/80 backdrop-blur-xl border border-black/5 rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.08)] hover:-translate-y-1 hover:border-blue-200/50 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/50 transition-colors duration-500 pointer-events-none"></div>
                
                <div className="relative z-10">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-3">
                      &quot;{lesson.query_text}&quot;
                    </h3>
                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm" title="Votata positivamente">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Card Body (Snapshot of AI Response) */}
                  <div className="prose prose-sm prose-slate prose-a:text-blue-600 max-w-none text-slate-600 font-medium line-clamp-6 mb-4 relative">
                    <MarkdownRenderer content={lesson.ai_response} />
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      Confidence: {Math.round((lesson.fact_check_confidence || 1) * 100)}%
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{new Date(lesson.created_at).toLocaleDateString('it-IT', { year: 'numeric', month: 'short', day: 'numeric'})}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (navigator.share) {
                            navigator.share({
                              title: `Atena Lezione Civica: ${lesson.query_text}`,
                              text: `Scopri questa lezione giuridica generata da Atena: "${lesson.query_text}"\n\nLeggi di più su LexAI.`
                            }).catch(console.error);
                          } else {
                            navigator.clipboard.writeText(`Scopri questa lezione giuridica generata da Atena: "${lesson.query_text}"\n\n${lesson.ai_response}\n\nLeggi di più su LexAI.`);
                            alert("Testo copiato negli appunti! La condivisione nativa non è supportata su questo dispositivo.");
                          }
                        }}
                        className="flex items-center justify-center w-7 h-7 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-md border border-blue-100 transition-colors shadow-sm"
                        title="Condividi"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

