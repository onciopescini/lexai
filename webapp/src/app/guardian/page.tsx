'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';

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
  const [profile, setProfile] = useState('Tech Startup (SaaS)');

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



  const getDynamicImpact = (alert: GuardianAlert, selectedProfile: string) => {
    if (!alert) return 'Medium';
    const testText = `${alert.target_audience || ''} ${alert.title || ''} ${alert.summary || ''}`.toLowerCase();
    
    if (selectedProfile === 'Tech Startup (SaaS)') {
       if (testText.includes('tech') || testText.includes('data') || testText.includes('privacy') || testText.includes('ai') || testText.includes('digitale') || testText.includes('software')) return 'High';
       return 'Low';
    } else if (selectedProfile === 'E-commerce Retail') {
       if (testText.includes('commerce') || testText.includes('consumator') || testText.includes('vendit') || testText.includes('spedizion') || testText.includes('retail')) return 'High';
       return 'Low';
    }
    return alert.impact_level; // Per lo 'Studio Legale' mostra impatto oggettivo
  };

  const getImpactDotColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const processedAlerts = alerts
    .map(alert => ({ ...alert, dynamicImpact: getDynamicImpact(alert, profile) }))
    .filter(alert => alert.dynamicImpact !== 'Low' || profile === 'Studio Legale')
    .sort((a, b) => {
      const w = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return (w[b.dynamicImpact as keyof typeof w] || 0) - (w[a.dynamicImpact as keyof typeof w] || 0);
    });

  return (
    <PremiumEcosystemWrapper>
      {/* Background Effects (Matches page.tsx) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute inset-0 z-0 bg-transparent opacity-30" style={{ backgroundImage: "url('/images/atena-pattern-bg.png')", backgroundSize: "300px", backgroundRepeat: "repeat" }}></div>
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-100 blur-[120px] rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-slate-200 blur-[120px] rounded-full mix-blend-multiply"></div>
      </div>

      <main className="flex-1 relative z-10 w-full flex flex-col items-center pt-8 md:pt-16 pb-32">
        <div className="w-full max-w-5xl px-4 flex flex-col gap-12">
          
          {/* Header & Profilo Impatto */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white/50 mb-4 backdrop-blur-md shadow-sm">
                 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                 <span className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">Radar Legislativo Attivo</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900">
                 The Guardian
               </h1>
               <p className="text-slate-500 max-w-xl font-medium mt-2 leading-relaxed">
                 Mappatura continua del tessuto giurisprudenziale. Analisi predittiva dell&apos;impatto normativo sul tuo business.
               </p>
            </div>
            {/* Profilo */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] border border-slate-200/60 shadow-lg flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
               <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-inner shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
               </div>
               <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Impact Simulator</p>
                  <select 
                     value={profile}
                     onChange={(e) => setProfile(e.target.value)}
                     className="bg-transparent text-sm font-extrabold text-slate-800 outline-none cursor-pointer w-full"
                  >
                     <option value="Tech Startup (SaaS)">Tech Startup (SaaS)</option>
                     <option value="E-commerce Retail">E-commerce Retail</option>
                     <option value="Studio Legale">Studio Legale</option>
                  </select>
               </div>
            </div>
          </div>

          {/* Dashboard Radar Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{animationDelay: '100ms'}}>
             {/* Metric Card 1 */}
             <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm uppercase tracking-wider">+2 Oggi</span>
                </div>
                <h4 className="text-3xl font-extrabold text-slate-900 mb-1">3</h4>
                <p className="text-sm font-medium text-slate-500">Allerte ad Alto Impatto</p>
             </div>
             {/* Metric Card 2 */}
             <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ultimi 7 gg</span>
                </div>
                <h4 className="text-2xl font-extrabold text-slate-900 mb-1 leading-tight">Privacy & Dati</h4>
                <p className="text-sm font-medium text-slate-500">Settore più colpito</p>
             </div>
             {/* Metric Card 3 */}
             <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-6 rounded-[32px] shadow-lg text-white">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-white/10 text-white rounded-2xl backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                   </div>
                   <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Status Protezione</span>
                </div>
                <h4 className="text-xl font-extrabold mb-1">Azione Richiesta</h4>
                <p className="text-sm font-medium text-slate-300">1 normativa richiede audit</p>
                <button className="mt-4 w-full py-2.5 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm">Vedi Dettagli</button>
             </div>
          </div>

          {/* Main Feed Section */}
          <div className="mt-4">
            <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
               <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
               Radar Timeline ({processedAlerts.length} allerte rilevanti)
            </h3>
            
            {loading ? (
                <div className="flex flex-col gap-6">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-full p-8 rounded-[32px] bg-white/40 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] animate-pulse">
                           <div className="w-32 h-6 bg-slate-200/60 rounded mb-4"></div>
                           <div className="w-full h-8 bg-slate-200/60 rounded mb-4"></div>
                           <div className="w-2/3 h-4 bg-slate-200/60 rounded mb-2"></div>
                           <div className="w-1/2 h-4 bg-slate-200/60 rounded mb-6"></div>
                        </div>
                    ))}
                </div>
            ) : processedAlerts.length === 0 ? (
                <div className="w-full text-center py-20 bg-white/40 backdrop-blur-md rounded-[32px] border border-slate-200/50 flex flex-col items-center gap-4">
                  <span className="text-5xl border p-4 rounded-full bg-slate-50 border-slate-100">📡</span>
                  <h3 className="text-lg font-bold text-slate-700">Radar Libero per il tuo Profilo</h3>
                  <p className="text-sm text-slate-500 font-medium">Nessuna allerta legislativa di impatto rilevata di recente per <b>{profile}</b>.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                  {processedAlerts.map((alert, idx) => (
                      <div key={alert.id} className="relative group bg-white/70 backdrop-blur-2xl border border-slate-200/60 p-8 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_60px_rgba(59,130,246,0.1)] hover:border-blue-200 transition-all duration-500 animate-fade-in-up" style={{animationDelay: `${idx * 100}ms`}}>
                         {/* Impact Ribbon */}
                         <div className={`absolute top-0 right-8 px-4 py-1.5 rounded-b-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-sm ${getImpactDotColor(alert.dynamicImpact)}`}>
                            Impatto {alert.dynamicImpact}
                         </div>

                         <div className="flex flex-wrap items-center gap-3 mb-5">
                            <span className="text-[11px] text-slate-500 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm uppercase tracking-wider">
                               {new Date(alert.date_published).toLocaleDateString('it-IT')}
                            </span>
                            {alert.target_audience && (
                               <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm uppercase tracking-wider">
                                  Destinazione: {alert.target_audience}
                               </span>
                            )}
                         </div>

                         <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                            {alert.title}
                         </h2>

                         {/* AI Verified Seal */}
                         <div className="flex items-center gap-2 mb-6 p-2.5 bg-emerald-50/80 rounded-[14px] border border-emerald-100 w-max shadow-sm">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Sintesi Verificata - Fonti Ufficiali</span>
                         </div>
                         
                         <div className="text-[16px] leading-relaxed font-medium text-slate-600 mb-8 max-w-4xl">
                            <MarkdownRenderer content={alert.summary} />
                         </div>

                         {/* Action Footer */}
                         <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                            <a href={alert.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-700 transition-colors shadow-sm">
                               Leggi Fonte Integrale
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                            <div className="flex items-center gap-3">
                               <button className="text-[13px] font-bold text-slate-400 hover:text-slate-600 px-4 py-2 transition-colors">Condividi</button>
                               <button className="text-[13px] font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 px-5 py-3 rounded-2xl transition-colors shadow-sm border border-blue-100">Analizza Impatto Specifico</button>
                            </div>
                         </div>
                      </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </main>
    </PremiumEcosystemWrapper>
  );
}

