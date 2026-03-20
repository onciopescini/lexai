'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconCheck, IconLock, IconCreditCard, IconShieldCheck, IconSparkles } from '@tabler/icons-react';

interface SubscriptionModalProps {
  onClose: () => void;
  userEmail: string;
}

const FREE_FEATURES = [
  { label: 'Chat AI con Atena (5 query/giorno)', included: true },
  { label: 'Ricerca nel Codice Civile', included: true },
  { label: 'Biblioteca Legale (sola lettura)', included: true },
  { label: 'Guardian Alerts', included: false },
  { label: 'Analisi AI X-Ray documenti', included: false },
  { label: 'Command Palette ⌘K', included: false },
  { label: 'TTS Audio Lezioni', included: false },
  { label: 'Export Google Drive', included: false },
];

const PREMIUM_FEATURES = [
  'Query AI illimitate',
  'Tutti i codici (Penale, Fiscale, Lavoro…)',
  'Guardian Radar — Alert normativi real-time',
  'AI X-Ray — Analisi profonda documenti',
  'Audio Lezioni (Text-to-Speech)',
  'Export PDF / Google Drive',
  'Accesso anticipato alle nuove feature',
];

export default function SubscriptionModal({ onClose, userEmail }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="sub-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-900/25 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          key="sub-modal"
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          exit={{ opacity: 0, scale: 0.97,    y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          className="glass-modal rounded-[28px] w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex items-start justify-between">
            <div>
              <div className="gold-badge mb-3">Premium</div>
              <h2 className="text-2xl font-bold text-slate-900 font-serif tracking-tight">
                Dall&apos;accesso base all&apos;intelligence legale completa.
              </h2>
              <p className="text-sm text-slate-500 mt-1.5">
                Sblocca tutto l&apos;ecosistema Atena · Cancelli in qualsiasi momento.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-4 shrink-0"
            >
              <IconX size={18} />
            </button>
          </div>

          {/* 2-Column Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Left — Feature Comparison */}
            <div className="p-8 border-r border-slate-100">
              <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-5">Confronto Piano</p>
              <div className="space-y-3">
                {FREE_FEATURES.map(f => (
                  <div key={f.label} className="flex items-center gap-3">
                    {f.included ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        <IconCheck size={11} className="text-emerald-600" strokeWidth={2.5} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                        <IconLock size={10} className="text-slate-300" />
                      </div>
                    )}
                    <span className={`text-sm ${f.included ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Social proof */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['A', 'M', 'L', 'G'].map((l, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  <span className="text-slate-800 font-bold">247+ avvocati</span> già su Atena Premium
                </p>
              </div>
            </div>

            {/* Right — Pricing Card */}
            <div className="p-8 bg-[#FAFAF8] flex flex-col">
              <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-5">Piano Premium</p>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl font-black text-slate-900 font-serif">€29</span>
                  <span className="text-sm text-slate-400 mb-1.5 font-medium">/mese · + IVA</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Oppure €249/anno (risparmia il 28%)</p>
              </div>

              {/* Premium features list */}
              <div className="space-y-2.5 mb-8 flex-1">
                {PREMIUM_FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <IconSparkles size={13} className="text-[#C9A84C] shrink-0" />
                    <span className="text-sm text-slate-700">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 rounded-xl gold-btn text-sm font-bold tracking-wide disabled:opacity-60 animate-gold-pulse"
              >
                {loading ? 'Reindirizzamento…' : 'Inizia ora — Prova 7 giorni gratis ✦'}
              </button>

              {/* Trust signals */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <IconCreditCard size={12} />
                  Stripe · Pagamento Sicuro
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <IconShieldCheck size={12} />
                  Cancella quando vuoi
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
