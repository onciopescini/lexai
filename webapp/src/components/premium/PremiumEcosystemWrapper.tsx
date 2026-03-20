'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PremiumNavbar from './PremiumNavbar';
import { IconLock, IconSparkles } from '@tabler/icons-react';

const supabase = createClient();

export default function PremiumEcosystemWrapper({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsPremium(user.user_metadata?.is_premium === true);
      } else {
        setIsPremium(false);
      }
      setLoading(false);
    };
    checkPremiumStatus();
  }, []);

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      alert('Errore di rete durante il Checkout.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-legal/20 border-t-amber-legal animate-spin" />
      </div>
    );
  }

  // Non-premium gate
  if (!isPremium) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0b0f] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-legal/5 blur-[160px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/5 blur-[120px] rounded-full" />
        </div>

        <div className="glass-card max-w-md w-full rounded-[32px] p-8 relative z-10 text-center animate-blur-fade-in">
          <div className="w-16 h-16 rounded-[20px] bg-amber-legal/10 border border-amber-legal/20 flex items-center justify-center mx-auto mb-6 amber-glow">
            <IconLock size={26} className="text-amber-legal" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-3">Area Esclusiva Premium</h2>
          <p className="text-white/40 font-medium mb-8 leading-relaxed text-sm">
            Sblocca Guardian Radar, Library Normativa Completa e Lezioni Interactive passando ad Atena Premium.
          </p>

          <button
            onClick={handleUpgrade}
            className="w-full py-4 rounded-2xl font-bold text-sm text-black
              bg-gradient-to-b from-amber-legal to-amber-legal-dim
              shadow-[0_8px_32px_rgba(212,168,83,0.25)]
              hover:shadow-[0_8px_40px_rgba(212,168,83,0.4)]
              transition-all duration-300 active:scale-[0.98]
              flex items-center justify-center gap-2 mb-3"
          >
            <IconSparkles size={14} />
            Esegui l&apos;Upgrade Ora
          </button>

          <button
            onClick={() => { window.location.href = '/'; }}
            className="w-full py-3 rounded-2xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            Torna al Workspace
          </button>
        </div>
      </div>
    );
  }

  // Premium layout: sidebar + content
  return (
    <div className="flex h-screen bg-[#0a0b0f] overflow-hidden">
      {/* Sidebar */}
      <PremiumNavbar />

      {/* Main content — scrollable */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}

