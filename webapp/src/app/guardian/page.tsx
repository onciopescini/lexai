'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import NetworkBackground from '../../components/NetworkBackground';
import Link from 'next/link';

interface CivicLesson {
  id: string;
  trend_topic: string;
  lesson_title: string;
  content_script: string;
  image_prompt: string;
  image_url: string;
  created_at: string;
}

export default function GuardianFeed() {
  const [lessons, setLessons] = useState<CivicLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const { data, error } = await supabase
          .from('civic_lessons')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) setLessons(data);
      } catch (err) {
        console.error("Error fetching civic lessons:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Navbar Minimal */}
      <nav className="w-full flex items-center justify-between p-6 max-w-6xl mx-auto border-b border-white/5 shrink-0 z-50 bg-[#050505]/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.5)] group-hover:scale-105 transition-transform">
            L
          </div>
          <span className="font-semibold tracking-wide text-lg text-white/90">Atena</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-white/50 hover:text-white transition-colors">Ricerca</Link>
          <span className="text-blue-400 font-medium tracking-wide">Guardian Alerts</span>
        </div>
      </nav>

      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <NetworkBackground />
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-red-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-indigo-900/10 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <main className="flex-1 overflow-y-auto relative z-10 w-full flex flex-col items-center pt-12 pb-32">
        <div className="w-full max-w-2xl px-4 flex flex-col gap-16">
          
          {/* Header */}
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/10 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-semibold tracking-wide text-red-200 uppercase">Citizen Protection Protocol</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-red-200/50">
              PicoClaw Guardian
            </h1>
            <p className="text-lg text-white/40 max-w-xl mx-auto font-light leading-relaxed">
              Micro-lezioni generate automaticamente in base ai dubbi legali più frequenti dei cittadini in tempo reale.
            </p>
          </div>

          {/* Feed */}
          {loading ? (
            <div className="w-full flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-t-2 border-b-2 border-white/20 animate-spin"></div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="w-full text-center py-20 text-white/30">Nessuna allerta attiva al momento.</div>
          ) : (
            <div className="flex flex-col gap-12 w-full">
              {lessons.map((lesson, idx) => (
                <div key={lesson.id} className="w-full bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up backdrop-blur-sm" style={{animationDelay: `${idx * 150}ms`}}>
                  
                  {/* Visual Placeholder (Image/Video Area) */}
                  <div className="w-full h-80 relative bg-[#0a0a0a] border-b border-white/5 flex flex-col items-center justify-center p-8 group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent z-10"></div>
                    
                    {/* Raw AI Prompt Overlay - giving it a hacker/agentic vibe */}
                    <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 p-6 overflow-hidden">
                       <p className="font-mono text-xs text-blue-300/40 break-words leading-relaxed filter blur-[1px]">
                         {lesson.image_prompt} {lesson.image_prompt} {lesson.image_prompt}
                       </p>
                    </div>

                    <div className="z-20 flex flex-col items-center gap-3">
                       <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center backdrop-blur-md">
                         <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                       </div>
                       <span className="text-xs font-mono uppercase tracking-widest text-blue-400/80">Video Generation Pending...</span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-8 md:p-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{lesson.trend_topic}</span>
                       <span className="text-xs text-white/30 font-mono">{new Date(lesson.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white/90">
                      {lesson.lesson_title.replace(/\*/g, '')}
                    </h2>
                    
                    <div className="prose prose-invert prose-p:leading-relaxed prose-blue max-w-none text-white/70">
                      {lesson.content_script.split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
