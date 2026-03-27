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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore Google Login');
      setLoading(false);
    }
  };

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
            
            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 mb-1 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold tracking-wide hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continua con Google
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] text-slate-400 font-bold tracking-widest uppercase">Oppure con Email</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

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
