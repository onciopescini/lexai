'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

interface GuardianAlert {
  id: string;
  title: string;
  summary: string;
  impact_level: string;
  target_audience: string;
  source_url: string;
  date_published: string;
  created_at: string;
}

export default function GuardianFeed() {
  const [alerts, setAlerts] = useState<GuardianAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from('atena_guardian_alerts')
          .select('*')
          .order('date_published', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) setAlerts(data);
      } catch (err) {
        console.error("Error fetching guardian alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-50 text-red-600 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-600 border-green-200';
      default: return 'bg-blue-50 text-blue-600 border-blue-200';
    }
  };

  const getImpactDotColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fbfbfd] text-slate-900 font-sans selection:bg-blue-500/20 overflow-x-hidden">
      
      {/* Navbar Minimal - Fixed at Top (Matches page.tsx exactly) */}
      <nav className="w-full flex items-center justify-between p-6 max-w-6xl mx-auto border-b border-black/5 shrink-0 z-50 bg-[#fbfbfd]/70 backdrop-blur-xl sticky top-0 transition-all duration-300">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Image src="/images/atena-text-logo.png" alt="Atena Logo" width={110} height={35} className="object-contain drop-shadow-sm cursor-pointer" priority />
          </Link>
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
          <Link href="/" className="hover:text-slate-900 transition-colors">Ricerca</Link>
          <Link href="/#features" className="hover:text-slate-900 transition-colors">Funzionalità</Link>
          <Link href="/guardian" className="text-red-500 hover:text-red-600 transition-colors font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Guardian Alerts
          </Link>
        </div>
      </nav>

      {/* Background Effects (Matches page.tsx) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 z-0 bg-transparent opacity-30" style={{ backgroundImage: "url('/images/atena-pattern-bg.png')", backgroundSize: "300px", backgroundRepeat: "repeat" }}></div>
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-100 blur-[120px] rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-slate-200 blur-[120px] rounded-full mix-blend-multiply"></div>
      </div>

      <main className="flex-1 relative z-10 w-full flex flex-col items-center pt-16 pb-32">
        <div className="w-full max-w-4xl px-4 flex flex-col gap-16">
          
          {/* Header */}
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white/50 mb-6 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">Sistema di Allerta Autonomo</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 text-slate-900">
              The Guardian
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
              Mappatura continua del tessuto giurisprudenziale italiano. Le novità legislative, spiegate e classificate dall&apos;Intelligenza Artificiale.
            </p>
          </div>

          {/* Feed */}
          {loading ? (
            <div className="flex flex-col gap-8 w-full relative">
              <div className="absolute left-6 top-10 bottom-10 w-px bg-slate-100 hidden md:block"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative w-full pl-0 md:pl-16">
                  <div className="absolute left-[19px] top-8 w-3.5 h-3.5 rounded-full border-2 border-[#fbfbfd] hidden md:block z-10 bg-slate-200/60 animate-pulse"></div>
                  <div className="w-full p-8 rounded-3xl bg-white/40 backdrop-blur-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-6 bg-slate-200/60 rounded mb-1 animate-pulse"></div>
                          <div className="w-16 h-6 bg-slate-200/60 rounded mb-1 animate-pulse"></div>
                        </div>
                        <div className="w-24 h-7 bg-slate-200/60 rounded-full animate-pulse"></div>
                      </div>
                      <div className="w-2/3 h-8 bg-slate-200/60 rounded animate-pulse"></div>
                      <div className="space-y-3">
                        <div className="w-full h-4 bg-slate-200/60 rounded animate-pulse"></div>
                        <div className="w-full h-4 bg-slate-200/60 rounded animate-pulse"></div>
                        <div className="w-4/5 h-4 bg-slate-200/60 rounded animate-pulse"></div>
                      </div>
                      <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                         <div className="w-32 h-4 bg-slate-200/60 rounded animate-pulse"></div>
                         <div className="w-16 h-4 bg-slate-200/60 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="w-full text-center py-20 text-slate-400 font-medium flex flex-col items-center gap-4">
              <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Nessuna allerta legislativa processata di recente.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-8 w-full relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-10 bottom-10 w-px bg-slate-200 hidden md:block"></div>

              {alerts.map((alert, idx) => (
                <div key={alert.id} className="relative w-full pl-0 md:pl-16 group animate-fade-in-up" style={{animationDelay: `${idx * 100}ms`}}>
                  
                  {/* Timeline dot */}
                  <div className={`absolute left-[19px] top-8 w-3.5 h-3.5 rounded-full border-2 border-[#fbfbfd] hidden md:block z-10 transition-transform duration-300 group-hover:scale-125 ${getImpactDotColor(alert.impact_level)}`}></div>
                  
                  <div className="w-full p-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-black/5 hover:border-blue-500/20 hover:bg-white/90 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-500">
                    
                    <div className="flex flex-col gap-5 relative z-10">
                      {/* Top Meta */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${getImpactColor(alert.impact_level)}`}>
                            {alert.impact_level} IMPACT
                          </span>
                          <span className="text-xs text-slate-500 font-mono bg-slate-100/80 px-2 py-1 rounded">
                            {new Date(alert.date_published).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                        
                        {alert.target_audience && (
                          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {alert.target_audience.toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Title */}
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {alert.title}
                      </h2>
                      
                      {/* Summary */}
                      <div className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
                        <MarkdownRenderer content={alert.summary} />
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-4 mt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <a 
                          href={alert.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          VEDI FONTE UFFICIALE
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>

                        <button className="text-xs text-slate-400 font-bold tracking-wide hover:text-slate-600 flex items-center gap-1.5 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          SALVA
                        </button>
                      </div>

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
