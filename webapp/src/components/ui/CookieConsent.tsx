'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Cookie, X } from 'lucide-react';
import Link from 'next/link';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('atena_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('atena_cookie_consent', 'all');
    setIsVisible(false);
    // In a real scenario, you would trigger Analytics/Tag Manager here
  };

  const handleRejectAll = () => {
    localStorage.setItem('atena_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[480px] z-[9999] animate-fade-in-up">
      <div className="bg-obsidian-900/90 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
        
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-obsidian-800 to-obsidian-950 border border-gold-500/20 flex flex-shrink-0 items-center justify-center shadow-inner">
            <Cookie className="w-5 h-5 text-gold-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-playfair font-bold text-slate-100 flex items-center gap-2 mb-1">
              Informativa sui Cookie
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-light mb-4">
              Atena utilizza cookie tecnici essenziali per il funzionamento della piattaforma e, con il tuo consenso, cookie analitici per migliorare l&apos;esperienza e offrirti un servizio personalizzato. 
              <Link href="/privacy" className="text-gold-400/80 hover:text-gold-400 underline decoration-white/20 underline-offset-2 ml-1 transition-colors">
                Termini e Privacy
              </Link>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gold-500 text-obsidian-950 text-xs font-bold hover:bg-gold-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                Accetta Tutti
              </button>
              <button 
                onClick={handleRejectAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-obsidian-800/80 text-slate-300 text-xs font-medium border border-white/5 hover:bg-obsidian-800 hover:text-white transition-all"
              >
                Solo Essenziali
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleRejectAll}
            className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-300 bg-obsidian-950/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
