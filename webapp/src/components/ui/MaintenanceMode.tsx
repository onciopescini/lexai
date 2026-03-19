import React from 'react';
import { motion } from 'framer-motion';

interface MaintenanceModeProps {
  progress?: number; // 0 to 100
  totalChunks?: number;
  currentChunk?: number;
}

export default function MaintenanceMode({ progress = 0, totalChunks = 0, currentChunk = 0 }: MaintenanceModeProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[50vh] w-full max-w-2xl mx-auto text-center p-10 bg-white/60 backdrop-blur-2xl border border-marble-200 rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.05)] relative overflow-hidden"
    >
      
      {/* Luxury Gradient Glows */}
      <div className="absolute -inset-1 bg-gradient-to-r from-marble-200/50 via-white to-transparent rounded-[32px] blur-2xl opacity-50"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-platinum-200/50 to-transparent"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-marble-200/80 to-transparent"></div>
      
      <div className="relative z-10 flex flex-col items-center gap-8 w-full">
        {/* Animated Icon */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outer spin ring - Platinum */}
          <div className="absolute inset-0 border-[3px] border-t-slate-700/80 border-r-slate-700/20 border-b-slate-700/5 border-l-slate-700/20 rounded-full animate-[spin_4s_linear_infinite]"></div>
          {/* Inner pulse ring - Silver */}
          <div className="absolute inset-3 border-2 border-platinum-300/40 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
          {/* Core static ring */}
          <div className="absolute inset-4 border border-marble-200 rounded-full bg-white/80 backdrop-blur-md shadow-inner flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-800 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse shadow-[0_0_5px_rgba(0,0,0,0.2)]"></span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Operazione Distribuita In Corso</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
            Aggiornamento Database Ufficiale
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto leading-relaxed text-sm md:text-base font-light">
            Il motore autonomo <strong className="text-slate-800 font-medium">PicoClaw</strong> sta scansionando e vettorizzando il Codice Civile Italiano in tempo reale. Le funzionalità di ricerca sono <span className="text-slate-800 font-medium">limitate</span> per prevenire rate-limits sulle API LLM.
          </p>
        </div>

        {/* Progress Display */}
        {totalChunks > 0 && (
          <div className="w-full mt-6 flex flex-col gap-3 bg-white/80 p-5 rounded-[24px] border border-marble-200 backdrop-blur-xl shadow-sm">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 uppercase tracking-widest px-1">
              <span>Elaborazione Chunks Vettoriali</span>
              <span className="text-slate-800 font-bold">{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full h-1.5 bg-marble-100 rounded-full overflow-hidden border border-marble-200 relative shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-slate-400 via-slate-600 to-slate-800 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2 px-1">
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-slate-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-[10px] text-slate-500 tracking-wider">Sincronizzazione Supabase pgvector...</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                <span className="text-slate-700 font-bold">{currentChunk}</span> / {totalChunks} <span className="text-slate-400 text-[9px]">Articoli</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

