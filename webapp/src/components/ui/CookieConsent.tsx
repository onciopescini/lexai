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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <div className="bg-white/70 backdrop-blur-3xl border border-marble-200 shadow-lg rounded-[32px] p-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-platinum-400/20 to-transparent"></div>
        
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-[24px] bg-gradient-to-br from-marble-50 to-marble-100 border border-marble-200 flex flex-shrink-0 items-center justify-center shadow-inner">
            <Cookie className="w-5 h-5 text-slate-700" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-playfair font-bold text-slate-900 flex items-center gap-2 mb-1">
              Informativa sui Cookie
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-light mb-4">
              Atena utilizza cookie tecnici essenziali per il funzionamento della piattaforma e, con il tuo consenso, cookie analitici per migliorare l&apos;esperienza e offrirti un servizio personalizzato. 
              <Link href="/privacy" className="text-slate-900 font-medium hover:text-slate-700 underline decoration-marble-200 underline-offset-2 ml-1 transition-colors">
                Termini e Privacy
              </Link>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2.5 rounded-[24px] bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
              >
                Accetta Tutti
              </button>
              <button 
                onClick={handleRejectAll}
                className="flex-1 px-4 py-2.5 rounded-[24px] bg-white/50 text-slate-700 text-xs font-medium border border-marble-200 hover:bg-white hover:text-slate-900 transition-all"
              >
                Solo Essenziali
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleRejectAll}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 bg-marble-100/50 rounded-[20px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

