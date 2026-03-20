'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Blocco legale in fase di registrazione
    if (!isLogin && !acceptedTerms) {
      setError("È obbligatorio accettare i Termini di Servizio e la Privacy Policy per registrarsi.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.user) onSuccess(data.user);
      } else {
        // Sign Up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
             // emailRedirectTo: `${location.origin}/auth/callback`,
          }
        });
        if (signUpError) throw signUpError;
        
        // Supabase might return a user directly if email confirmation is disabled
        if (data.user && data.session) {
          onSuccess(data.user);
        } else {
          setError("Controlla la tua email per il link di conferma.");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore di autenticazione');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setError(null);
      if (!isLogin && !acceptedTerms) {
        setError("È obbligatorio accettare i Termini di Servizio e la Privacy Policy per registrarsi.");
        return;
      }
      setLoading(true);
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'https://www.googleapis.com/auth/drive.file',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (signInError) throw signInError;
      // Il redirect avviene istantaneamente, quindi non invochiamo onSuccess
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore di autenticazione con Google');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md glass-panel rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-white/20 bg-white/70 p-8">
        
        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
             <span className="text-3xl text-white">⚖️</span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-center text-slate-800 tracking-tight mb-2">
          {isLogin ? 'Accedi ad Atena' : 'Crea il tuo Account'}
        </h2>
        <p className="text-sm text-center text-slate-500 font-medium mb-8">
          {isLogin 
            ? 'Sblocca le vere potenzialità del tuo assistente legale AI.' 
            : 'Unisciti alla rivoluzione legale. Inizia subito.'}
        </p>

        {error && (
          <div className="p-3 mb-6 bg-red-50 border border-red-200 text-red-600 rounded-[24px] text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 pl-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/50 border border-slate-200 text-slate-800 rounded-[24px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-slate-400"
              placeholder="tuonome@studio.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 pl-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/50 border border-slate-200 text-slate-800 rounded-[24px] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-slate-400"
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <div className="flex items-start gap-3 mt-2 pr-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-[10px] text-slate-500 leading-tight select-none">
                Ho letto e accetto i <a href="/legal/terms" target="_blank" className="text-indigo-600 hover:underline font-bold">Termini di Servizio</a>, la <a href="/legal/privacy" target="_blank" className="text-indigo-600 hover:underline font-bold">Privacy Policy</a> e la <a href="/legal/cookies" target="_blank" className="text-indigo-600 hover:underline font-bold">Cookie Policy</a>. 
                Dichiaro di aver compreso il <a href="/legal/disclaimer" target="_blank" className="text-indigo-600 hover:underline font-bold">Disclaimer Legale</a> limitativo di responsabilità di Atena.
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 w-full bg-slate-900 text-white font-bold py-3.5 rounded-[24px] hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 disabled:opacity-70"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (isLogin ? 'Accedi' : 'Registrati')}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Oppure</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        <button 
          onClick={handleGoogleAuth}
          type="button"
          disabled={loading}
          className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-[24px] hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-70 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continua con Google
        </button>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); setAcceptedTerms(false); }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {isLogin ? "Non hai un account? Registrati ora" : "Hai già un account? Accedi"}
          </button>
        </div>

      </div>
    </div>
  );
}

