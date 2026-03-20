'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';
import ImpactSimulatorDropdown from '@/components/guardian/ImpactSimulatorDropdown';
import RadarTimeline, { GuardianAlert } from '@/components/guardian/RadarTimeline';

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



  const processedAlerts = alerts
    .map(alert => {
      const dbImpact = alert.dynamic_impacts?.[profile];
      const fallbackImpact = alert.impact_level;
      return { 
        ...alert, 
        dynamicImpact: dbImpact || fallbackImpact 
      };
    })
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
            <ImpactSimulatorDropdown profile={profile} setProfile={setProfile} />
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
          <RadarTimeline loading={loading} processedAlerts={processedAlerts} profile={profile} />
        </div>
      </main>
    </PremiumEcosystemWrapper>
  );
}

