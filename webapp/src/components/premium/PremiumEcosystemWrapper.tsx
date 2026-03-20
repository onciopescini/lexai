'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PremiumNavbar from './PremiumNavbar';
import Link from 'next/link';
import { IconLock } from '@tabler/icons-react';

interface Props {
  children: React.ReactNode;
}

/**
 * PremiumEcosystemWrapper — Light glassmorphism layout.
 * Wraps premium pages with sidebar + main content area.
 * Shows a lock gate for non-premium users.
 */
export default function PremiumEcosystemWrapper({ children }: Props) {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setIsPremium(false); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();
      setIsPremium(profile?.is_premium === true || user.user_metadata?.is_premium === true);
    };
    check();
  }, [supabase]);

  // Loading state
  if (isPremium === null) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin" />
      </div>
    );
  }

  // Lock gate — non-premium users
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6">
        <div className="glass-modal rounded-[28px] p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F0E9D6] border border-[#C9A84C]/25 flex items-center justify-center mx-auto mb-6">
            <IconLock size={22} className="text-[#9C7A2A]" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-serif mb-2">
            Contenuto Premium
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Questa sezione è riservata agli utenti Atena Premium. Accedi alla piattaforma completa con un abbonamento mensile.
          </p>
          <Link
            href="/"
            className="inline-block w-full py-3 rounded-xl gold-btn text-sm font-semibold text-center"
          >
            Scopri Premium ✦
          </Link>
          <p className="text-[11px] text-slate-400 mt-4">7 giorni di prova gratuita · Cancelli quando vuoi</p>
        </div>
      </div>
    );
  }

  // Premium layout — sidebar + content
  return (
    <div className="premium-layout">
      <PremiumNavbar />
      <div className="premium-content">
        {children}
      </div>
    </div>
  );
}
