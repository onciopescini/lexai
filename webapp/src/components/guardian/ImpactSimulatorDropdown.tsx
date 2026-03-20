'use client';

import React from 'react';

interface ImpactSimulatorDropdownProps {
  profile: string;
  setProfile: (val: string) => void;
}

export default function ImpactSimulatorDropdown({ profile, setProfile }: ImpactSimulatorDropdownProps) {
  return (
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
  );
}
