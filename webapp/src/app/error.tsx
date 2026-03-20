'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log dell'errore ad un servizio esterno come Sentry
    Sentry.captureException(error);
    console.error("Atena ErrorBoundary caught an error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-900 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>

      <div className="relative z-10 max-w-lg w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 md:p-12 rounded-3xl shadow-2xl text-center space-y-8">
        
        <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-inner">
          <ShieldAlert className="w-12 h-12 text-red-400" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-200 to-red-400 bg-clip-text text-transparent">
            Anomalia di Sistema
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            I parametri di sicurezza di Atena hanno intercettato un errore imprevisto. Abbiamo già registrato l'evento per il nostro team tecnico.
          </p>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 w-full sm:w-auto justify-center"
          >
            <RefreshCcw className="w-5 h-5" />
            Riavvia Processo
          </button>
          
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors border border-slate-600/50 w-full sm:w-auto justify-center"
          >
            <Home className="w-5 h-5" />
            Torna alla Base
          </Link>
        </div>
      </div>
      
      <div className="mt-8 text-slate-500 text-sm font-mono tracking-widest opacity-50 select-none">
        ERROR_CODE: {error.digest || 'ERR_UNKNOWN_STATE'}
      </div>
    </div>
  );
}
