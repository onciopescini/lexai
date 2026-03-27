'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Scale, BrainCircuit, Sparkles, Globe, ShieldAlert, GitCompare, ArrowRight, ChevronRight, Zap } from 'lucide-react';
import AuthModal from '../components/ui/AuthModal';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
         setShowAuthModal(false);
         router.push('/workspace');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white font-sans overflow-x-hidden selection:bg-[#007AFF]/30 selection:text-white">
      
      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#007AFF] flex items-center justify-center shadow-[0_0_15px_rgba(0,122,255,0.4)]">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">LexAI</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#98989D]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link href="/library" className="hover:text-white transition-colors">Archivio Storico</Link>
            <Link href="/guardian" className="flex items-center gap-2 hover:text-[#5AC8FA] transition-colors">
               <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" /> Guardian
            </Link>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <button onClick={() => router.push('/workspace')} className="px-5 py-2.5 rounded-full bg-[#007AFF] text-white text-sm font-semibold hover:bg-[#006CE6] transition-colors shadow-[0_0_20px_rgba(0,122,255,0.3)]">
                Vai al Workspace
              </button>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="px-5 py-2.5 text-sm font-semibold bg-white/10 hover:bg-white/15 text-white rounded-full backdrop-blur-md transition-all border border-white/5">
                Accedi
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-6">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#007AFF]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#5AC8FA]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-4xl mx-auto flex flex-col items-center"
        >
          <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20 text-[#5AC8FA] text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> LexAI Agentic Engine 2.0
          </motion.div>
          
          <motion.div variants={fadeUp}>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight">
              L'intelligenza legale.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] to-[#5AC8FA]">
                Oltre il documento.
              </span>
            </h1>
          </motion.div>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-[#98989D] max-w-2xl mb-12 font-medium leading-relaxed">
            Il primo compagno di trincea progettato per avvocati e professionisti.
            Analizza codici, atti e giurisprudenza in millisecondi. Rigorosamente validato dal protocollo anti-allucinazioni <i>Decimo Uomo</i>.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button onClick={() => setShowAuthModal(true)} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#007AFF] text-white font-bold text-lg hover:bg-[#006CE6] transition-all shadow-[0_0_30px_rgba(0,122,255,0.4)] hover:shadow-[0_0_40px_rgba(0,122,255,0.6)] flex items-center justify-center gap-2 group hover:-translate-y-1">
              Inizia Gratuitamente <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => router.push('/guardian')} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              Scopri il Guardian
            </button>
          </motion.div>
        </motion.div>

        {/* App Mockup Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-24 w-full max-w-6xl relative z-10"
        >
          <div className="rounded-2xl md:rounded-[32px] overflow-hidden border border-white/10 bg-[#2C2C2E] shadow-[0_20px_80px_rgba(0,0,0,0.8)] relative">
            <div className="absolute inset-0 bg-gradient-to-b from-[#007AFF]/5 to-transparent pointer-events-none" />
            <div className="h-12 border-b border-white/5 flex items-center px-4 bg-[#1C1C1E]">
              <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                 <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                 <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
            </div>
            <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-[#1C1C1E] p-8 flex">
              {/* Mockup UI Inner */}
              <div className="w-1/3 border-r border-white/5 pr-6 hidden md:flex flex-col gap-4">
                <div className="h-8 w-1/2 bg-white/5 rounded-lg" />
                <div className="h-24 w-full bg-white/5 rounded-xl border border-white/5 p-4">
                   <div className="h-4 w-1/3 bg-[#007AFF] rounded mb-2" />
                   <div className="h-2 w-full bg-white/10 rounded mb-1" />
                   <div className="h-2 w-2/3 bg-white/10 rounded" />
                </div>
                <div className="h-24 w-full bg-white/5 rounded-xl border border-white/5 p-4 opacity-50">
                   <div className="h-4 w-1/4 bg-white/10 rounded mb-2" />
                   <div className="h-2 w-full bg-white/5 rounded mb-1" />
                </div>
              </div>
              <div className="flex-1 md:pl-8 flex flex-col justify-end gap-6">
                 <div className="p-6 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/20 self-start max-w-md">
                    <div className="h-3 w-1/4 bg-[#007AFF] rounded mb-3" />
                    <div className="h-2 w-full bg-white/20 rounded mb-2" />
                    <div className="h-2 w-5/6 bg-white/20 rounded" />
                 </div>
                 <div className="p-6 rounded-2xl bg-white/5 border border-white/10 self-end max-w-lg">
                    <div className="h-3 w-1/3 bg-[#5AC8FA] rounded mb-3" />
                    <div className="h-2 w-full bg-white/20 rounded mb-2" />
                    <div className="h-2 w-full bg-white/20 rounded mb-2" />
                    <div className="h-2 w-4/5 bg-white/20 rounded" />
                 </div>
                 <div className="h-14 w-full bg-white/5 rounded-2xl border border-white/10 flex items-center px-4 mt-8">
                   <div className="h-4 w-1/3 bg-white/10 rounded" />
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">Armi letali per la tua professione.</h2>
          <p className="text-lg text-[#98989D] max-w-2xl mx-auto font-medium">
            Ogni strumento in LexAI è ingegnerizzato per ridurre le ore di ricerca da giorni a millisecondi, con un'interfaccia invisibile che non si mette mai in mezzo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-3xl bg-[#2C2C2E]/50 border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center mb-6">
              <BrainCircuit className="w-6 h-6 text-[#5AC8FA]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Cross-RAG Search</h3>
            <p className="text-[#98989D] leading-relaxed">
              Interroga simultaneamente codici pubblici e il tuo archivio privato su Google Drive. Una sola query, conoscenza infinita.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-[#2C2C2E]/50 border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center mb-6">
              <Scale className="w-6 h-6 text-[#5AC8FA]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Il Decimo Uomo</h3>
            <p className="text-[#98989D] leading-relaxed">
              Un agente autonomo verifica rigidamente le risposte per stroncare sul nascere ogni allucinazione giuridica. Ti fiderai ciecamente.
            </p>
          </div>
          <div className="p-8 rounded-3xl bg-[#2C2C2E]/50 border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#007AFF]/10 flex items-center justify-center mb-6">
              <ShieldAlert className="w-6 h-6 text-[#5AC8FA]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Guardian Radar</h3>
            <p className="text-[#98989D] leading-relaxed">
              Avvisi tempestivi su DDL, sentenze e direttive europee. Arriva in studio già preparato sulle novità che impattano i tuoi clienti.
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#98989D]" />
            <span className="font-bold text-[#98989D]">LexAI</span>
          </div>
          <p className="text-sm text-[#636366]">
            Esclusivamente a scopo di ricerca. L'IA non sostituisce il parere di un legale professionista.
          </p>
          <div className="flex gap-6 text-sm font-medium text-[#98989D]">
             <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
             <Link href="/legal/terms" className="hover:text-white transition-colors">Termini</Link>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u: User) => {
             setUser(u);
             router.push('/workspace');
          }}
        />
      )}
    </div>
  );
}
