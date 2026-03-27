'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';
import PredictiveJusticePanel from '@/components/workspace/PredictiveJusticePanel';
import { useRouter } from 'next/navigation';

export default function PredictPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin" />
      </div>
    );
  }

  return (
    <PremiumEcosystemWrapper>
      <>
        {/* Auth Required Modal */}
        {showAuthModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          >
            <div
              className="bg-white rounded-[28px] p-8 max-w-sm w-full mx-4 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Accedi per Continuare</h2>
              <p className="text-sm text-slate-500 mb-6">Devi essere autenticato per usare Giustizia Predittiva.</p>
              <button
                onClick={() => router.push('/')}
                className="w-full gold-btn py-3 rounded-xl text-sm font-semibold"
              >
                Accedi / Registrati
              </button>
            </div>
          </div>
        )}

        {/* Pro Required Modal */}
        {showProModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowProModal(false)}
          >
            <div
              className="bg-white rounded-[28px] p-8 max-w-sm w-full mx-4 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Funzione Premium</h2>
              <p className="text-sm text-slate-500 mb-6">Giustizia Predittiva è disponibile esclusivamente per gli abbonati <b>LexAI Pro</b>.</p>
              <button
                onClick={() => router.push('/')}
                className="w-full gold-btn py-3 rounded-xl text-sm font-semibold"
              >
                Scopri LexAI Pro ✦
              </button>
              <p className="text-[11px] text-slate-400 mt-4">7 giorni di prova gratuita · Cancelli quando vuoi</p>
            </div>
          </div>
        )}

        {/* Main Panel — fills the premium content area */}
        <PredictiveJusticePanel
          user={user}
          onRequireAuth={() => setShowAuthModal(true)}
          onRequirePro={() => setShowProModal(true)}
        />
      </>
    </PremiumEcosystemWrapper>
  );
}
