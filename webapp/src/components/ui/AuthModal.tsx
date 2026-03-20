'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { IconX, IconMail, IconLock, IconEye, IconEyeOff, IconCheck } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (user: any) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && !acceptedTerms) {
      setError('È obbligatorio accettare i Termini di Servizio e la Privacy Policy per registrarsi.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (data.user) onSuccess(data.user);
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.user && data.session) {
          onSuccess(data.user);
        } else {
          setError('Controlla la tua email per il link di conferma.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Si è verificato un errore. Riprova.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="auth-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          key="auth-modal"
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          exit={{ opacity: 0, scale: 0.97,    y: 8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
          className="glass-modal rounded-[28px] w-full max-w-[420px] overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F0E9D6] border border-[#C9A84C]/25 flex items-center justify-center mb-4">
                <span className="text-[#9C7A2A] font-black font-serif text-lg">A</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-serif">
                {isLogin ? 'Accedi ad Atena' : 'Crea il tuo account'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isLogin ? 'Intelligence legale al tuo servizio.' : 'Inizia gratis, aggiorna quando vuoi.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <IconX size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="px-8 py-6 space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <div className="relative">
                <IconMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="nome@studio.it"
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <IconLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimo 6 caratteri"
                  className="w-full pl-10 pr-12 py-3 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                </button>
              </div>
            </div>

            {/* Terms (registration only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <button
                      type="button"
                      onClick={() => setAcceptedTerms(v => !v)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        acceptedTerms
                          ? 'bg-[#C9A84C] border-[#C9A84C]'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {acceptedTerms && <IconCheck size={11} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className="text-xs text-slate-500 leading-relaxed">
                      Accetto i{' '}
                      <Link href="/legal/terms" className="text-[#9C7A2A] underline hover:text-[#C9A84C]" target="_blank">Termini di Servizio</Link>
                      {' '}e la{' '}
                      <Link href="/legal/privacy" className="text-[#9C7A2A] underline hover:text-[#C9A84C]" target="_blank">Privacy Policy</Link>
                    </span>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 leading-relaxed">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl gold-btn text-sm font-bold tracking-wide disabled:opacity-60 transition-all"
            >
              {loading
                ? 'Accesso in corso…'
                : isLogin ? 'Accedi' : 'Crea account gratuitamente'}
            </button>

            {/* Switch mode */}
            <p className="text-center text-xs text-slate-500">
              {isLogin ? 'Non hai un account?' : 'Hai già un account?'}{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(v => !v); setError(null); }}
                className="text-[#9C7A2A] font-semibold hover:text-[#C9A84C] transition-colors"
              >
                {isLogin ? 'Registrati gratis' : 'Accedi'}
              </button>
            </p>
          </form>

          {/* Social proof footer */}
          <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-medium">
              🔒 Powered by Supabase · Dati in Europa
            </p>
            <p className="text-[10px] text-slate-400">247+ avvocati attivi</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
