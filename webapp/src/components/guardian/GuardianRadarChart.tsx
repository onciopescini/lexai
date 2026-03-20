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
  { subject: 'Lavoro',  value: 65, fullMark: 100 },
  { subject: 'Contratti', value: 91, fullMark: 100 },
  { subject: 'GDPR',   value: 83, fullMark: 100 },
  { subject: 'Penale', value: 45, fullMark: 100 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl px-3 py-2 text-xs shadow-lg">
        <p className="text-slate-500 font-mono">{payload[0]?.payload?.subject}</p>
        <p className="text-[#9C7A2A] font-black text-sm">{payload[0]?.value}%</p>
      </div>
    );
  }
  return null;
};

/**
 * GuardianRadarChart — Light Glassmorphism Recharts radar chart.
 * Gold stroke and fill, slate axis labels, white/82 glass card container.
 */
export function GuardianRadarChart({ data = DEFAULT_DATA, label = 'Esposizione Normativa' }: GuardianRadarChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-2xl p-6 flex flex-col items-center h-full"
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-4">{label}</p>

      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
            <PolarGrid stroke="rgba(0,0,0,0.06)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'DM Mono, monospace' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Esposizione"
              dataKey="value"
              stroke="#C9A84C"
              fill="#C9A84C"
              fillOpacity={0.12}
              strokeWidth={1.5}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {data.map(d => {
          const cls = d.value >= 80 ? 'text-red-500' : d.value >= 60 ? 'text-[#9C7A2A]' : 'text-emerald-600';
          return (
            <div key={d.subject} className={`flex items-center gap-1.5 text-[10px] font-mono ${cls}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {d.subject} {d.value}%
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
