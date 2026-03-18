'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Scale, BrainCircuit, Sparkles, Globe, ShieldAlert, Palette, GitCompare } from 'lucide-react';
import AuthModal from '../components/ui/AuthModal';
import SubscriptionModal from '../components/ui/SubscriptionModal';
import WorkspaceLayout from '../components/workspace/WorkspaceLayout';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

// Stats Counter Animation
function AnimatedStat({ value, label, suffix = '' }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center group">
      <div className="text-3xl md:text-4xl font-playfair font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 group-hover:from-slate-600 group-hover:to-slate-800 transition-all drop-shadow-[0_0_10px_rgba(0,0,0,0.1)]">
        {value}{suffix}
      </div>
      <div className="text-xs text-slate-500 mt-2 uppercase tracking-widest font-bold font-playfair">{label}</div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, tag }: { icon: React.ElementType; title: string; description: string; tag?: string }) {
  return (
    <div className="group relative p-8 rounded-[32px] bg-white/60 backdrop-blur-2xl border border-marble-200 hover:border-platinum-300/50 hover:bg-white/80 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-500 overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-platinum-200/50 rounded-full filter blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-[24px] bg-white/50 border border-marble-200 group-hover:border-platinum-300 group-hover:bg-platinum-100/50 transition-colors duration-500">
            <Icon className="w-6 h-6 text-slate-700 drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]" strokeWidth={1.5} />
          </div>
          {tag && (
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-marble-200">{tag}</span>
          )}
        </div>
        <h3 className="text-xl font-playfair font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm font-light text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// 3-Step Process Component
function ProcessStep({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center group">
      <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-white to-marble-100 flex items-center justify-center text-2xl font-playfair font-black text-slate-800 shadow-[0_8px_20px_rgba(0,0,0,0.1)] border border-marble-200 group-hover:scale-110 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)] group-hover:border-platinum-300 transition-all duration-500 mb-6">
        {step}
      </div>
      <h3 className="text-xl font-playfair font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-base text-slate-500 max-w-xs leading-relaxed font-light">{description}</p>
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
      <div className="min-h-screen bg-marble-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-slate-900 font-sans selection:bg-platinum-200 overflow-x-hidden">
      
      {/* Navbar Minimal - Fixed at Top */}
      <nav className="w-full h-[80px] flex items-center justify-between px-6 max-w-[1400px] mx-auto border-b border-marble-200 shrink-0 z-50 bg-white/80 backdrop-blur-2xl sticky top-0 transition-all duration-300">
        <Link href="/" className="flex items-center gap-3 group">
          <Image src="/atena-logo-new.jpeg" alt="Atena Logo" width={110} height={35} className="object-contain drop-shadow-sm mix-blend-multiply group-hover:scale-105 transition-transform" priority style={{ width: 'auto', height: 'auto' }} />
        </Link>
        <div className="flex items-center gap-7 text-sm font-bold text-slate-500 hidden lg:flex">
          {!user && (
             <>
                <Link href="/library" className="hover:text-slate-800 transition-colors flex items-center gap-1.5 pb-1">
                   Biblioteca Legale
                </Link>
                <Link href="/diff-demo" className="hover:text-slate-800 transition-colors flex items-center gap-1.5 pb-1">
                   Version Diff
                </Link>
                <a href="#features" className="hover:text-slate-800 transition-colors">Funzionalità</a>
                <Link href="/guardian" className="text-rose-500 hover:text-rose-600 transition-colors font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_5px_rgba(244,63,94,0.4)]"></span>
                  Guardian Alerts
                </Link>
             </>
          )}
          
          <div className="w-px h-5 bg-marble-200 ml-2"></div>
          
          {user ? (
            <div className="flex items-center gap-4 ml-2">
              {user.user_metadata?.is_premium ? (
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-[14px]">
                  PREMIUM ✨
                </span>
              ) : (
                <button 
                  onClick={() => setShowSubscriptionModal(true)}
                  className="text-xs font-black text-white bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 px-4 py-2 rounded-[14px] transition-all shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95"
                >
                  Passa a Premium ✨
                </button>
              )}
              <div className="flex items-center gap-3 pl-4 border-l border-marble-200">
                 <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-800 uppercase tracking-wider">{user.email?.split('@')[0]}</span>
                    <span className="text-[10px] text-slate-500">{user.user_metadata?.is_premium ? 'PREMIUM' : 'FREE'}</span>
                 </div>
                 <button 
                   onClick={() => supabase.auth.signOut()}
                   className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white hover:bg-marble-100 px-3 py-1.5 rounded-[24px] border border-marble-200"
                 >
                   Esci
                 </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-5 py-2.5 bg-slate-800 text-white border border-slate-700 text-xs font-bold rounded-[14px] hover:bg-slate-700 transition-all shadow-md ml-2"
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
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-marble-200 bg-white/50 mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.05)]">
                    <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></span>
                    <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Esclusiva Sperimentale Privata</span>
                  </div>
                  <div className="mb-6 max-w-[280px] md:max-w-xs mx-auto md:mx-0">
                    <Image src="/atena-logo-new.jpeg" alt="Atena" width={300} height={100} priority className="object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.1)] mix-blend-multiply" style={{ width: 'auto', height: 'auto' }} />
                  </div>
                  <p className="text-xl md:text-2xl text-slate-700 max-w-xl md:mx-0 mx-auto font-light leading-relaxed mb-8">
                    L&apos;Assistente Supremo per la <strong className="text-slate-900 font-playfair font-bold">Ricerca Giuridica</strong> e l&apos;Analisi Normativa Predittiva.
                  </p>
                  <p className="text-sm text-slate-500 max-w-md md:mx-0 mx-auto font-medium mb-10">
                    Analisi semantica di Costituzione, Codici e Giurisprudenza fusa in un unico motore IA cristallino dal paradigma generativo.
                  </p>

                  <button 
                     onClick={() => setShowAuthModal(true)}
                     className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-800 text-white font-bold rounded-[24px] hover:bg-slate-700 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto"
                  >
                     <Sparkles className="w-5 h-5" />
                     Entra nel Workspace 
                  </button>
                </div>
                
                {/* 3D Visual Graphic */}
                <div className="flex-1 relative flex justify-center items-center">
                  <div className="absolute inset-0 bg-marble-200/50 blur-[100px] rounded-full scale-110"></div>
                  
                  <div className="relative z-10 animate-float">
                    <div className="rounded-[40px] overflow-hidden border border-marble-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative bg-white/80 backdrop-blur-xl p-4 squircle-lg">
                      <Image 
                        src="/atena-logo-new.jpeg" 
                        alt="Atena Legal AI - Goddess Logo" 
                        width={400} 
                        height={400}
                        className="object-cover w-full h-auto max-w-sm md:max-w-md squircle !shadow-none mix-blend-multiply"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* LIVE STATS BAR */}
              <section className="w-full max-w-5xl mx-auto mb-20 relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-marble-200/50 via-white to-transparent rounded-[32px] blur-xl opacity-50"></div>
                <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 p-6 md:p-8 rounded-[32px] bg-white/60 border border-marble-200 backdrop-blur-3xl shadow-[0_8px_40px_rgba(0,0,0,0.05)]">
                  <AnimatedStat value="8.000" label="Documenti Indicizzati" suffix="+" />
                  <AnimatedStat value="Generative" label="UI Paradigm" />
                  <AnimatedStat value="5+" label="Database Ufficiali" />
                  <AnimatedStat value="< 2s" label="Tempo di Risposta" />
                </div>
              </section>

              {/* 3-STEP PROCESS */}
              <section className="w-full max-w-4xl mx-auto mb-20">
                 {/* ... (Same layout for features as before) ... */}
                 <h3 className="text-xl font-bold mb-2 text-slate-800">Ricerca Semantica</h3>
                <p className="text-slate-500">Non limitarti alle parole chiave. Atena comprende il contesto e l&apos;intento della tua ricerca.</p>
                 <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-playfair font-black text-slate-900 tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(0,0,0,0.05)]">
                    L&apos;Evoluzione del Diritto
                  </h2>
                  <p className="text-lg text-slate-500 max-w-lg mx-auto font-light">Tre passi per ottenere risposte legali d&apos;eccellenza, verificate e aggiornate in tempo reale in una veste puramente analitica.</p>
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
                  <p className="text-lg text-slate-500 max-w-lg mx-auto font-medium">Un&apos;interfaccia spaziale che separa il flusso di pensiero (Chat) dagli artefatti complessi (Canvas).</p>
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
                <div className="p-6 md:p-10 rounded-[2rem] rounded-tl-md bg-white/60 backdrop-blur-2xl border border-marble-200 shadow-[0_8px_30px_rgba(0,0,0,0.05)] relative w-full transition-all duration-500 hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] hover:border-platinum-300 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-platinum-100/50 to-transparent opacity-50"></div>
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-platinum-200/50 blur-[100px] rounded-full mix-blend-multiply opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <h2 className="text-3xl md:text-5xl font-playfair font-black text-slate-900 tracking-tight mb-4">
                      Sperimenta il Generative Canvas
                    </h2>
                    <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto font-light">
                      L&apos;introspezione giuridica non è mai stata così profonda. Accedi per iniziare.
                    </p>
                    <button 
                       onClick={() => setShowAuthModal(true)}
                       className="inline-flex items-center gap-3 px-10 py-4 bg-slate-800 text-white font-bold rounded-[24px] hover:bg-slate-700 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:-translate-y-1 active:translate-y-0"
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
         <footer className="w-full border-t border-marble-200 bg-marble-50 py-16 relative z-10 shrink-0 mt-auto">
           {/* ... Footer Content ... */}
           <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[24px] bg-white border border-marble-200 flex items-center justify-center text-lg font-playfair font-bold text-slate-700 shadow-[0_0_15px_rgba(0,0,0,0.05)]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <Image src="/atena-logo-new.jpeg" alt="Atena Logo" width={90} height={28} className="object-contain opacity-80 mb-1 mix-blend-multiply" />
                  <p className="text-sm font-medium text-slate-500">L&apos;Intelligenza Legale Definitiva</p>
                </div>
             </div>
             <div className="flex flex-col items-center md:items-end gap-3 text-sm text-slate-500 font-medium max-w-2xl">
               <p className="text-center md:text-right text-xs leading-relaxed">
                 Le informazioni generate da Atena sono intese esclusivamente a scopo di ricerca e analisi testuale. Atena è un sistema di intelligenza artificiale sperimentale e può produrre risultati imprecisi o incompleti (allucinazioni). Nessuna risposta sostituisce il parere di un avvocato abilitato o la consultazione diretta delle gazzette ufficiali. Utilizzando questo servizio, accetti che Atena e i suoi creatori non sono responsabili per eventuali danni derivanti dall&apos;uso di queste informazioni.
               </p>
               <div className="flex gap-6 mt-1">
                  <Link href="/legal/privacy" className="hover:text-slate-800 transition-colors cursor-pointer">Privacy Policy</Link>
                  <Link href="/legal/terms" className="hover:text-slate-800 transition-colors cursor-pointer">Termini di Servizio</Link>
                  <span className="hover:text-slate-800 transition-colors cursor-pointer">Contatti</span>
                </div>
             </div>
           </div>
         </footer>
      )}
    </div>
  );
}

