'use client';

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';

interface RadarDataPoint {
  subject: string;
  value: number;
  fullMark?: number;
}

interface GuardianRadarChartProps {
  data?: RadarDataPoint[];
  label?: string;
}

const DEFAULT_DATA: RadarDataPoint[] = [
  { subject: 'Privacy', value: 88, fullMark: 100 },
  { subject: 'Fiscale', value: 72, fullMark: 100 },
  { subject: 'Lavoro', value: 65, fullMark: 100 },
  { subject: 'Contratti', value: 91, fullMark: 100 },
  { subject: 'GDPR', value: 83, fullMark: 100 },
  { subject: 'Penale', value: 45, fullMark: 100 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl px-3 py-2 text-xs">
        <p className="text-white/60 font-mono">{payload[0]?.payload?.subject}</p>
        <p className="text-amber-legal font-black text-sm">{payload[0]?.value}%</p>
      </div>
    );
  }
  return null;
};

/**
 * GuardianRadarChart — Radar animato con tema Dark Glassmorphism
 * Usa Recharts + Framer Motion fade-in.
 */
export function GuardianRadarChart({ data = DEFAULT_DATA, label = 'Esposizione Normativa' }: GuardianRadarChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-2xl p-6 flex flex-col items-center"
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-4">{label}</p>

      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 12 }}>
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Esposizione"
              dataKey="value"
              stroke="hsl(38 60% 57%)"
              fill="hsl(38 60% 57%)"
              fillOpacity={0.15}
              strokeWidth={1.5}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend dots */}
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {data.map((d) => {
          const level = d.value >= 80 ? 'high' : d.value >= 60 ? 'mid' : 'low';
          const color = level === 'high' ? 'text-red-400' : level === 'mid' ? 'text-amber-legal' : 'text-emerald-400';
          return (
            <div key={d.subject} className={`flex items-center gap-1.5 text-[10px] font-mono ${color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {d.subject} {d.value}%
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
