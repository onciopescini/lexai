'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';
import ImpactSimulatorDropdown from '@/components/guardian/ImpactSimulatorDropdown';
import RadarTimeline, { GuardianAlert } from '@/components/guardian/RadarTimeline';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { IconAlertTriangle, IconShieldCheck, IconTrendingUp, IconRadar } from '@tabler/icons-react';

// Lazy-load Recharts so it doesn't bloat the initial bundle
const GuardianRadarChart = dynamic(
  () => import('@/components/guardian/GuardianRadarChart').then(m => m.GuardianRadarChart),
  { ssr: false, loading: () => <div className="glass-card rounded-2xl h-[260px] animate-pulse" /> }
);

const supabase = createClient();

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
        console.error('Error fetching guardian alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const processedAlerts = alerts
    .map(alert => ({
      ...alert,
      dynamicImpact: alert.dynamic_impacts?.[profile] || alert.impact_level,
    }))
    .filter(alert => alert.dynamicImpact !== 'Low' || profile === 'Studio Legale')
    .sort((a, b) => {
      const w = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return (w[b.dynamicImpact as keyof typeof w] || 0) - (w[a.dynamicImpact as keyof typeof w] || 0);
    });

  const highCount = processedAlerts.filter(a => a.dynamicImpact === 'High').length;

  const METRIC_CARDS = [
    {
      icon: IconAlertTriangle,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-50 border border-red-100',
      label: 'Alert ad Alto Impatto',
      value: String(highCount),
      badge: '+2 Oggi',
    },
    {
      icon: IconTrendingUp,
      iconColor: 'text-[#9C7A2A]',
      iconBg: 'bg-[#F0E9D6] border border-[#C9A84C]/20',
      label: 'Settore Più Colpito',
      value: 'Privacy',
      badge: 'Ultimi 7 gg',
    },
    {
      icon: IconShieldCheck,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border border-emerald-100',
      label: 'Azione Richiesta',
      value: '1 Audit',
      badge: 'Pendente',
    },
  ];

  return (
    <PremiumEcosystemWrapper>
      <main className="flex-1 overflow-y-auto bg-[#F7F7F5]">
        <div className="max-w-6xl mx-auto px-6 py-8 pb-24">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-red-600 uppercase">Radar Legislativo Attivo</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 font-serif">
                The Guardian
              </h1>
              <p className="text-slate-500 max-w-xl mt-2 leading-relaxed text-sm">
                Mappatura continua del tessuto giurisprudenziale. Analisi predittiva dell&apos;impatto normativo sul tuo business.
              </p>
            </div>
            <ImpactSimulatorDropdown profile={profile} setProfile={setProfile} />
          </motion.div>

          {/* Metrics + Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

            {/* Metric cards + exposure bars */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {METRIC_CARDS.map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                    className="glass-card rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                        <card.icon size={16} className={card.iconColor} />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 font-serif mb-0.5">{card.value}</p>
                    <p className="text-xs text-slate-500">{card.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Exposure bars */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="glass-card rounded-2xl p-5"
              >
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <IconRadar size={12} className="text-[#C9A84C]" />
                  Exposure Map — {profile}
                </p>
                <div className="space-y-3">
                  {[
                    { label: 'Privacy & GDPR', val: 88 },
                    { label: 'Fiscale', val: 72 },
                    { label: 'Diritto del Lavoro', val: 65 },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>{item.label}</span>
                        <span className="font-mono font-bold text-[#9C7A2A]">{item.val}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.val}%` }}
                          transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-[#C9A84C]/60 to-[#C9A84C]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Radar Chart */}
            <div className="lg:col-span-1">
              <GuardianRadarChart label={`Radar — ${profile}`} />
            </div>
          </div>

          {/* Alert Feed */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-4">
              Feed Normativo · {processedAlerts.length} alert
            </p>
            <RadarTimeline loading={loading} processedAlerts={processedAlerts} profile={profile} />
          </div>

        </div>
      </main>
    </PremiumEcosystemWrapper>
  );
}
