'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCheck, IconX, IconShieldCheck, IconSparkles, IconBolt } from '@tabler/icons-react';
import { ShimmerText, AmberBadge } from './ShimmerText';

interface SubscriptionModalProps {
  onClose: () => void;
  userEmail: string;
}

const FEATURES_FREE = [
  { label: '3 query AI al giorno', included: true },
  { label: 'Costituzione e leggi base', included: true },
  { label: 'Risposte con citazioni', included: true },
  { label: 'Library normativa completa', included: false },
  { label: 'Guardian — Radar Normativo', included: false },
  { label: 'Lezioni + Voice TTS AI', included: false },
  { label: 'PDF illimitati + X-Ray AI', included: false },
  { label: 'Export Drive / Email', included: false },
];

const FEATURES_PREMIUM = [
  { label: 'Query illimitate ogni giorno', included: true },
  { label: 'Tutte le fonti normative italiane', included: true },
  { label: 'Library — Ricerca semantica + X-Ray', included: true },
  { label: 'Guardian — Alert normativi real-time', included: true },
  { label: 'Lezioni interattive + Voice TTS', included: true },
  { label: 'PDF illimitati + Analisi profonda', included: true },
  { label: 'Export Google Drive + Email', included: true },
  { label: 'Supporto prioritario dedicato', included: true },
];

export default function SubscriptionModal({ onClose, userEmail }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Errore durante la creazione del checkout: ' + (data.error || 'Sconosciuto'));
      }
    } catch (err) {
      console.error(err);
      alert('Errore di rete contattando Stripe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl glass-card rounded-[32px] overflow-hidden flex flex-col md:flex-row"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center transition-colors"
          >
            <IconX size={14} className="text-white/60" />
          </button>

          {/* ── LEFT: Feature Comparison ── */}
          <div className="flex-1 p-8 md:p-10 flex flex-col border-r border-white/5">
            {/* Header */}
            <div className="mb-8">
              <AmberBadge>
                <IconSparkles size={12} />
                Atena Premium
              </AmberBadge>
              <h2 className="mt-4 text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Il potere legale,<br />
                <ShimmerText>senza compromessi.</ShimmerText>
              </h2>
              <p className="mt-3 text-sm text-white/50 leading-relaxed">
                Accesso completo all'ecosistema Atena: Library, Guardian, Lezioni e molto altro.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="grid grid-cols-2 gap-x-6">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">Gratuito</p>
                <ul className="space-y-2">
                  {FEATURES_FREE.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-white/40">
                      {f.included
                        ? <IconCheck size={12} className="text-white/40 shrink-0" />
                        : <IconX size={12} className="text-white/20 shrink-0" />}
                      <span className={f.included ? '' : 'line-through opacity-40'}>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-legal mb-3">Premium ✦</p>
                <ul className="space-y-2">
                  {FEATURES_PREMIUM.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-white/80">
                      <div className="w-4 h-4 rounded-full bg-amber-legal/15 flex items-center justify-center shrink-0">
                        <IconCheck size={9} className="text-amber-legal" />
                      </div>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {['A', 'M', 'G', 'L'].map((initial, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-[9px] font-bold"
                    style={{ background: `hsl(${i * 60 + 200}, 60%, 40%)` }}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/40">
                <span className="text-white/70 font-semibold">247 avvocati</span> già su Premium questo mese
              </p>
            </div>
          </div>

          {/* ── RIGHT: Pricing Card ── */}
          <div className="md:w-80 p-8 md:p-10 flex flex-col justify-center bg-gradient-to-b from-white/[0.04] to-transparent">
            {/* Price */}
            <div className="text-center mb-8">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">Piano Professionale</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-6xl font-black text-white">€29</span>
                <span className="text-white/40 mb-2">/mese</span>
              </div>
              <p className="text-xs text-white/30 mt-2">
                Fatturazione mensile · Cancella quando vuoi
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="relative w-full py-4 rounded-2xl font-bold text-sm overflow-hidden
                bg-gradient-to-b from-amber-legal to-amber-legal-dim
                text-black shadow-[0_8px_32px_rgba(212,168,83,0.3)]
                hover:shadow-[0_8px_40px_rgba(212,168,83,0.45)]
                transition-all duration-300 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <IconBolt size={15} />
                  Abbonati Ora — €29/mese
                </>
              )}
            </button>

            {/* Trust signals */}
            <div className="mt-5 flex flex-col gap-2.5">
              <div className="flex items-center justify-center gap-2 text-xs text-white/30">
                <IconShieldCheck size={13} className="text-white/25" />
                Pagamento sicuro via Stripe
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-white/30">
                <IconCheck size={13} className="text-white/25" />
                Nessun vincolo — cancella online
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-white/30">
                <IconCheck size={13} className="text-white/25" />
                Fattura IVA italiana inclusa
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
