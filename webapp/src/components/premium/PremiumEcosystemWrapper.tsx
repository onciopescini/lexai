'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PremiumNavbar from './PremiumNavbar';
import { Sparkles, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const supabase = createClient();
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
      const response = await fetch('/api/checkout', { method: 'POST' });
      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      if (stripe) {
        stripe.redirectToCheckout({ sessionId });
      }
    } catch (err) {
      console.error(err);
      alert('Network Error during Checkout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-[100dvh] bg-[#fbfbfd] flex flex-col font-sans selection:bg-indigo-500/20 items-center justify-center p-6 relative overflow-hidden">
        {/* Background Aurora */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
           <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-200 blur-[130px] rounded-full mix-blend-multiply opacity-50"></div>
           <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-200 blur-[130px] rounded-full mix-blend-multiply opacity-50"></div>
        </div>
        
        <div className="max-w-md w-full bg-white/60 backdrop-blur-2xl border border-black/5 rounded-[40px] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative z-10 text-center">
          <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 shadow-sm flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Area Esclusiva Premium</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            Sblocca la potenza del Guardian Radar, la Biblioteca Legale Completa e le Civic Lessons passando ad Atena Premium.
          </p>
          <button 
            onClick={handleUpgrade}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full py-4 text-[15px] font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Esegui l&apos;Upgrade Ora
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full mt-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full py-3.5 text-sm font-semibold transition-all"
          >
            Torna al Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#fbfbfd] flex flex-col font-sans selection:bg-indigo-500/20 relative">
      <PremiumNavbar />
      <div className="flex-1 w-full pb-20">
        {children}
      </div>
    </div>
  );
}
