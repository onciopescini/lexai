'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BrainCircuit, Scale, Globe, ShieldAlert, Palette, GitCompare, Sparkles, Search, Zap, Server } from 'lucide-react';
import AuthModal from '../components/ui/AuthModal';
import SubscriptionModal from '../components/ui/SubscriptionModal';
import WorkspaceLayout from '../components/workspace/WorkspaceLayout';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

// Stats Counter Animation
function AnimatedStat({ value, label, suffix = '' }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center group">
      <div className="text-3xl md:text-4xl font-playfair font-black bg-clip-text text-transparent bg-gradient-to-r from-gold-400 to-gold-600 group-hover:from-gold-300 group-hover:to-gold-500 transition-all drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
        {value}{suffix}
      </div>
      <div className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-bold font-playfair">{label}</div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, tag }: { icon: React.ElementType; title: string; description: string; tag?: string }) {
  return (
    <div className="group relative p-8 rounded-3xl bg-obsidian-900/40 backdrop-blur-2xl border border-white/5 hover:border-gold-500/30 hover:bg-obsidian-800/60 hover:shadow-[0_8px_30px_rgba(212,175,55,0.08)] transition-all duration-500 overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-gold-500/5 rounded-full filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-obsidian-950/50 border border-white/10 group-hover:border-gold-500/50 group-hover:bg-gold-500/10 transition-colors duration-500">
            <Icon className="w-6 h-6 text-gold-400 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" strokeWidth={1.5} />
          </div>
          {tag && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-gold-300 bg-gold-900/20 px-2.5 py-1 rounded-md border border-gold-500/20">{tag}</span>
          )}
        </div>
        <h3 className="text-xl font-playfair font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-sm font-light text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// 3-Step Process Component
function ProcessStep({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center group">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-obsidian-800 to-obsidian-950 flex items-center justify-center text-2xl font-playfair font-black text-gold-400 shadow-[0_8px_20px_rgba(0,0,0,0.5)] border border-white/10 group-hover:scale-110 group-hover:shadow-[0_10px_30px_rgba(212,175,55,0.2)] group-hover:border-gold-500/40 transition-all duration-500 mb-6">
        {step}
      </div>
      <h3 className="text-xl font-playfair font-bold text-slate-100 mb-3">{title}</h3>
      <p className="text-base text-slate-400 max-w-xs leading-relaxed font-light">{description}</p>
    </div>
  );
}

export default function AtenaApp() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthChecking(false);
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowAuthModal(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gold-500/20 border-t-gold-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-slate-900 font-sans selection:bg-gold-500/20 overflow-x-hidden">
      
      {/* Navbar Minimal - Fixed at Top */}
      <nav className="w-full h-[80px] flex items-center justify-between px-6 max-w-[1400px] mx-auto border-b border-white/5 shrink-0 z-50 bg-obsidian-950/80 backdrop-blur-2xl sticky top-0 transition-all duration-300">
        <Link href="/" className="flex items-center gap-3 group">
          <Image src="/atena-lex-text.png" alt="Atena Logo" width={110} height={35} className="object-contain drop-shadow-sm mix-blend-screen group-hover:scale-105 transition-transform" priority />
        </Link>
        <div className="flex items-center gap-7 text-sm font-bold text-slate-400 hidden lg:flex">
          {!user && (
             <>
                <Link href="/library" className="hover:text-gold-400 transition-colors flex items-center gap-1.5 pb-1">
                   Biblioteca Legale
                </Link>
                <Link href="/diff-demo" className="hover:text-gold-400 transition-colors flex items-center gap-1.5 pb-1">
                   Version Diff
                </Link>
                <a href="#features" className="hover:text-gold-400 transition-colors">Funzionalità</a>
                <Link href="/guardian" className="text-rose-500 hover:text-rose-400 transition-colors font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_5px_rgba(244,63,94,0.8)]"></span>
                  Guardian Alerts
                </Link>
             </>
          )}
          
          <div className="w-px h-5 bg-white/10 ml-2"></div>
          
          {user ? (
            <div className="flex items-center gap-4 ml-2">
              <button 
                onClick={() => setShowSubscriptionModal(true)}
                className="text-xs font-black text-obsidian-950 bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 px-4 py-2 rounded-[14px] transition-all shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.5)] hover:scale-105 active:scale-95"
              >
                Passa a Premium ✨
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                 <div className="flex flex-col items-end">
                    <span className="text-xs text-white uppercase tracking-wider">{user.email?.split('@')[0]}</span>
                    <span className="text-[10px] text-gold-500">{user.user_metadata?.is_premium ? 'PREMIUM' : 'FREE'}</span>
                 </div>
                 <button 
                   onClick={() => supabase.auth.signOut()}
                   className="text-xs font-bold text-slate-300 hover:text-white transition-colors bg-obsidian-800 hover:bg-obsidian-700 px-3 py-1.5 rounded-xl border border-white/5"
                 >
                   Esci
                 </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-5 py-2.5 bg-obsidian-800 text-white border border-white/10 text-xs font-bold rounded-[14px] hover:bg-white/10 transition-all shadow-md ml-2"
            >
              Accedi / Registrati
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u: User) => {
             setUser(u);
             setShowAuthModal(false);
          }}
        />
      )}

      {/* Subscription Paywall Overlay */}
      {showSubscriptionModal && (
        <SubscriptionModal 
          onClose={() => setShowSubscriptionModal(false)}
          userEmail={user?.email || ''}
        />
      )}

      <main className="flex-1 relative z-10 w-full flex flex-col items-center">
        {user ? (
           /* ============================================ */
           /* WORKSPACE MODE (LOGGED IN)                   */
           /* ============================================ */
           <div className="w-full">
              <WorkspaceLayout 
                 user={user} 
                 onRequireAuth={() => setShowAuthModal(true)} 
                 onRequirePro={() => setShowSubscriptionModal(true)} 
              />
           </div>
        ) : (
           /* ============================================ */
           /* LANDING PAGE (NOT LOGGED IN)                 */
           /* ============================================ */
           <div className="w-full max-w-5xl px-4 flex flex-col">
              
              {/* HERO SECTION (2-Column Premium Layout) */}
              <section className="w-full max-w-6xl mx-auto mt-20 mb-20 flex flex-col md:flex-row items-center gap-12 animate-fade-in-up px-4">
                {/* Text Content */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-500/20 bg-gold-500/10 mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                    <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse"></span>
                    <span className="text-[11px] font-bold tracking-widest text-gold-300 uppercase">Esclusiva Sperimentale Privata</span>
                  </div>
                  <div className="mb-6 max-w-[280px] md:max-w-xs mx-auto md:mx-0">
                    <Image src="/atena-lex-text.png" alt="Atena" width={300} height={100} priority className="object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] mix-blend-screen" />
                  </div>
                  <p className="text-xl md:text-2xl text-slate-300 max-w-xl md:mx-0 mx-auto font-light leading-relaxed mb-8">
                    L&apos;Assistente Supremo per la <strong className="text-gold-400 font-playfair font-bold">Ricerca Giuridica</strong> e l&apos;Analisi Normativa Predittiva.
                  </p>
                  <p className="text-sm text-slate-400 max-w-md md:mx-0 mx-auto font-medium mb-10">
                    Analisi semantica di Costituzione, Codici e Giurisprudenza fusa in un unico motore IA cristallino dal paradigma generativo.
                  </p>

                  <button 
                     onClick={() => setShowAuthModal(true)}
                     className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gold-500 text-obsidian-950 font-bold rounded-2xl hover:bg-gold-400 transition-all duration-300 shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:shadow-[0_10px_40px_rgba(212,175,55,0.4)] hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                  >
                     <Sparkles className="w-5 h-5" />
                     Entra nel Workspace 
                  </button>
                </div>
                
                {/* 3D Visual Graphic */}
                <div className="flex-1 relative flex justify-center items-center">
                  <div className="absolute inset-0 bg-slate-100/50 blur-[100px] rounded-full scale-110"></div>
                  
                  <div className="relative z-10 animate-float">
                    <div className="rounded-[40px] overflow-hidden border border-gold-500/30 shadow-[0_20px_50px_rgba(212,175,55,0.1)] relative bg-obsidian-950/80 backdrop-blur-xl p-4 squircle-lg">
                      <Image 
                        src="/atena-goddess-logo.png" 
                        alt="Atena Legal AI - Goddess Logo" 
                        width={400} 
                        height={400}
                        className="object-cover w-full h-auto max-w-sm md:max-w-md squircle !shadow-none mix-blend-screen"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* LIVE STATS BAR */}
              <section className="w-full max-w-5xl mx-auto mb-20 relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-gold-500/10 via-obsidian-800 to-transparent rounded-[32px] blur-xl opacity-50"></div>
                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 p-6 md:p-8 rounded-[32px] bg-obsidian-900/60 border border-white/5 backdrop-blur-3xl shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
                  <AnimatedStat value="8.000" label="Documenti Indicizzati" suffix="+" />
                  <AnimatedStat value="Generative" label="UI Paradigm" />
                  <AnimatedStat value="5+" label="Database Ufficiali" />
                  <AnimatedStat value="< 2s" label="Tempo di Risposta" />
                </div>
              </section>

              {/* 3-STEP PROCESS */}
              <section className="w-full max-w-4xl mx-auto mb-20">
                 {/* ... (Same layout for features as before) ... */}
                 <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-playfair font-black text-slate-100 tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    L&apos;Evoluzione del Diritto
                  </h2>
                  <p className="text-lg text-slate-400 max-w-lg mx-auto font-light">Tre passi per ottenere risposte legali d&apos;eccellenza, verificate e aggiornate in tempo reale in una veste puramente analitica.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <ProcessStep step={1} title="Chiedi" description="Scrivi la tua domanda in linguaggio naturale, come parleresti con un collega. Atena capisce il contesto giuridico." />
                  <ProcessStep step={2} title="Genera" description="L'IA interroga simultaneamente 5 database ufficiali e genera documenti, contratti o insight nel tuo Canvas." />
                  <ProcessStep step={3} title="Proteggi" description="Ricevi una risposta con fonti citate, contro-analisi critica e alert in tempo reale su cambiamenti normativi." />
                </div>
              </section>

              {/* FEATURE SHOWCASE */}
              <section id="features" className="w-full max-w-6xl mx-auto mb-20 px-4">
                 {/* ... (Same Feature cards as before) ... */}
                 <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                    Architettura Split-Screen
                  </h2>
                  <p className="text-lg text-slate-500 max-w-lg mx-auto font-medium">Un'interfaccia spaziale che separa il flusso di pensiero (Chat) dagli artefatti complessi (Canvas).</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FeatureCard 
                    icon={BrainCircuit} 
                    title="Workspace Layout" 
                    description="Un Canvas interattivo per la lettura di contratti e sentenze, fianco a fianco con la chat AI, ispirato a Google Stitch 2.0."
                    tag="UX Paradigm"
                  />
                  <FeatureCard 
                    icon={Scale} 
                    title="Protocollo Decimo Uomo" 
                    description="Ogni risposta viene sottoposta a contro-analisi critica. L'IA cerca attivamente falle, eccezioni e interpretazioni alternative."
                    tag="Anti-Bias"
                  />
                  <FeatureCard 
                    icon={Globe} 
                    title="Live Web Agent" 
                    description="Integrazione con Perplexity Sonar per aggiornamenti in tempo reale da fonti web. Sentenze recenti, dottrina, news giuridiche."
                    tag="Real-Time"
                  />
                  <FeatureCard 
                    icon={ShieldAlert} 
                    title="Guardian Alerts" 
                    description="Sistema autonomo che monitora cambiamenti normativi e identifica anomalie."
                  />
                  <FeatureCard 
                    icon={Palette} 
                    title="Visual Legal Intelligence" 
                    description="Generazione visiva di mappe mentali per schematizzare concetti giuridici complessi."
                  />
                  <FeatureCard 
                    icon={GitCompare} 
                    title="Version Diff Tracker" 
                    description="Confronta versioni di articoli di legge nel tempo all'interno del tuo Canvas espanso."
                  />
                </div>
              </section>

              {/* CTA FINALE */}
              <section className="w-full max-w-4xl mx-auto mb-32 text-center px-4">
                <div className="p-6 md:p-10 rounded-[2rem] rounded-tl-md bg-obsidian-900/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative w-full transition-all duration-500 hover:shadow-[0_10px_40px_rgba(212,175,55,0.1)] hover:border-gold-500/20 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-50"></div>
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-400/10 blur-[100px] rounded-full mix-blend-screen opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <h2 className="text-3xl md:text-5xl font-playfair font-black text-slate-100 tracking-tight mb-4">
                      Sperimenta il Generative Canvas
                    </h2>
                    <p className="text-lg text-slate-400 mb-8 max-w-lg mx-auto font-light">
                      L&apos;introspezione giuridica non è mai stata così profonda. Accedi per iniziare.
                    </p>
                    <button 
                       onClick={() => setShowAuthModal(true)}
                       className="inline-flex items-center gap-3 px-10 py-4 bg-gold-500 text-obsidian-950 font-bold rounded-2xl hover:bg-gold-400 transition-all duration-300 shadow-[0_10px_30px_rgba(212,175,55,0.2)] hover:shadow-[0_10px_40px_rgba(212,175,55,0.4)] hover:-translate-y-1 active:translate-y-0"
                    >
                      <Sparkles className="w-5 h-5" strokeWidth={2.5} />
                      Accedi ad Atena
                    </button>
                  </div>
                </div>
              </section>
           </div>
        )}
      </main>

      {/* FOOTER - Solo se NON loggato (Il Workspace occulta il footer) */}
      {!user && (
         <footer className="w-full border-t border-white/5 bg-obsidian-950 py-16 relative z-10 shrink-0 mt-auto">
           {/* ... Footer Content ... */}
           <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-obsidian-800 border border-gold-500/30 flex items-center justify-center text-lg font-playfair font-bold text-gold-400 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <Image src="/atena-lex-text.png" alt="Atena Logo" width={90} height={28} className="object-contain opacity-80 mb-1 mix-blend-screen" />
                  <p className="text-sm font-medium text-slate-500">L&apos;Intelligenza Legale Definitiva</p>
                </div>
             </div>
             <div className="flex flex-col items-center md:items-end gap-3 text-sm text-slate-500 font-medium max-w-2xl">
               <p className="text-center md:text-right text-xs leading-relaxed">
                 Le informazioni generate da Atena sono intese esclusivamente a scopo di ricerca e analisi testuale. Atena è un sistema di intelligenza artificiale sperimentale e può produrre risultati imprecisi o incompleti (allucinazioni). Nessuna risposta sostituisce il parere di un avvocato abilitato o la consultazione diretta delle gazzette ufficiali. Utilizzando questo servizio, accetti che Atena e i suoi creatori non sono responsabili per eventuali danni derivanti dall&apos;uso di queste informazioni.
               </p>
               <div className="flex gap-6 mt-1">
                  <Link href="/legal/privacy" className="hover:text-gold-400 transition-colors cursor-pointer">Privacy Policy</Link>
                  <Link href="/legal/terms" className="hover:text-gold-400 transition-colors cursor-pointer">Termini di Servizio</Link>
                  <span className="hover:text-gold-400 transition-colors cursor-pointer">Contatti</span>
                </div>
             </div>
           </div>
         </footer>
      )}
    </div>
  );
}
