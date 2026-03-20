'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';
import ImpactSimulatorDropdown from '@/components/guardian/ImpactSimulatorDropdown';
import RadarTimeline, { GuardianAlert } from '@/components/guardian/RadarTimeline';
import { GuardianRadarChart } from '@/components/guardian/GuardianRadarChart';
import { motion } from 'framer-motion';
import { IconAlertTriangle, IconShieldCheck, IconRadar, IconTrendingUp } from '@tabler/icons-react';

const supabase = createClient();

const METRIC_CARDS = [
  {
    icon: IconAlertTriangle,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-400/10',
    label: 'Alto Impatto',
    badge: '+2 Oggi',
    valueKey: 'high' as const,
    sublabel: 'Alert critici',
  },
  {
    icon: IconTrendingUp,
    iconColor: 'text-amber-legal',
    iconBg: 'bg-amber-legal/10',
    label: 'Settore Più Colpito',
    badge: 'Ultima settimana',
    valueKey: 'sector' as const,
    sublabel: 'Privacy & Dati',
  },
  {
    icon: IconShieldCheck,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-400/10',
    label: 'Status Protezione',
    badge: 'Richiede Audit',
    valueKey: 'audit' as const,
    sublabel: '1 normativa pendente',
  },
];

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
    .map(alert => {
      const dbImpact = alert.dynamic_impacts?.[profile];
      return { ...alert, dynamicImpact: dbImpact || alert.impact_level };
    })
    .filter(alert => alert.dynamicImpact !== 'Low' || profile === 'Studio Legale')
    .sort((a, b) => {
      const w = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return (w[b.dynamicImpact as keyof typeof w] || 0) - (w[a.dynamicImpact as keyof typeof w] || 0);
    });

  const highCount = processedAlerts.filter(a => a.dynamicImpact === 'High').length;

  return (
    <PremiumEcosystemWrapper>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[600px] h-[400px] bg-red-500/4 blur-[200px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-amber-legal/4 blur-[180px] rounded-full" />
      </div>

      <main className="flex-1 relative z-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 pb-24">

          {/* ── Page Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-400/20 bg-red-400/8 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase">Radar Legislativo Attivo</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                The Guardian
              </h1>
              <p className="text-white/40 max-w-xl font-medium mt-2 leading-relaxed text-sm">
                Mappatura continua del tessuto giurisprudenziale. Analisi predittiva dell&apos;impatto normativo sul tuo business.
              </p>
            </div>
            <ImpactSimulatorDropdown profile={profile} setProfile={setProfile} />
          </motion.div>

          {/* ── 2-column: metrics + radar ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

            {/* Metric cards — col 1-2 */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {METRIC_CARDS.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                      <card.icon size={18} className={card.iconColor} />
                    </div>
                    <span className="text-[9px] font-mono text-white/25 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                      {card.badge}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white mb-0.5">
                    {card.valueKey === 'high' ? highCount : card.valueKey === 'sector' ? 'Privacy' : '1 Audit'}
                  </p>
                  <p className="text-xs text-white/35 font-medium">{card.sublabel}</p>
                </motion.div>
              ))}

              {/* Radar Live Status Bar */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.35 }}
                className="sm:col-span-3 glass-card rounded-2xl p-5"
              >
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-3 flex items-center gap-2">
                  <IconRadar size={12} className="text-amber-legal" />
                  Exposure Map — {profile}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Privacy & GDPR', val: 88 },
                    { label: 'Fiscale', val: 72 },
                    { label: 'Lavoro', val: 65 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[10px] text-white/40 mb-1.5">
                        <span>{item.label}</span>
                        <span className="font-mono text-amber-legal">{item.val}%</span>
                      </div>
                      <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.val}%` }}
                          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-amber-legal/60 to-amber-legal"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Radar Chart — col 3 */}
            <div className="lg:col-span-1">
              <GuardianRadarChart label={`Radar — ${profile}`} />
            </div>
          </div>

          {/* ── Alert Feed ── */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-4">
              Feed Normativo · {processedAlerts.length} alert
            </p>
            <RadarTimeline loading={loading} processedAlerts={processedAlerts} profile={profile} />
          </div>

        </div>
      </main>
    </PremiumEcosystemWrapper>
  );
}
