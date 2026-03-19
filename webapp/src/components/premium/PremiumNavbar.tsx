'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Library, Radar, GraduationCap, LayoutDashboard } from 'lucide-react';

export default function PremiumNavbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Workspace', path: '/', icon: LayoutDashboard },
    { name: 'Biblioteca', path: '/library', icon: Library },
    { name: 'Guardian Radar', path: '/guardian', icon: Radar },
    { name: 'Civic Lessons', path: '/lessons', icon: GraduationCap },
  ];

  return (
    <nav className="w-full flex items-center justify-between p-4 px-6 max-w-6xl mx-auto bg-white/60 backdrop-blur-2xl border-b border-black/5 rounded-b-[32px] md:rounded-full md:mt-4 md:border shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-0 md:top-4 z-50">
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="flex items-center justify-center w-10 h-10 rounded-[20px] bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 border border-indigo-100 shadow-sm">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        </div>
        <div className="flex flex-col hidden sm:flex">
           <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">Atena</span>
           <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Premium Ecosystem</span>
        </div>
      </Link>
      
      <div className="flex items-center gap-1 sm:gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-[16px] text-sm font-semibold transition-all duration-300 ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="hidden md:inline">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200/50 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-amber-700 tracking-wide uppercase">Premium</span>
        </div>
      </div>
    </nav>
  );
}
