'use client';

import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Scale, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, RefreshCcw, BookOpen, Quote } from 'lucide-react';

interface PredictResponse {
  win_probability: number;
  risk_factors: string[];
  pro_cases: { title: string; quote: string; relevance: string }[];
  con_cases: { title: string; quote: string; relevance: string }[];
  rationale: string;
}

export default function PredictiveJusticePanel({
  user,
  onRequireAuth,
  onRequirePro
}: {
  user: User | null;
  onRequireAuth: () => void;
  onRequirePro: () => void;
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState('');
  const [sourcesAnalyzed, setSourcesAnalyzed] = useState(0);

  const isPremium = user?.user_metadata?.is_premium === true;

  const handlePredict = async () => {
    if (!user) return onRequireAuth();
    if (!isPremium) return onRequirePro();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore di sistema');
      }

      setResult(data.prediction);
      setSourcesAnalyzed(data.sources_analyzed || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Costruisce il colore per la probabilità
  const getProbColor = (prob: number) => {
    if (prob >= 70) return 'text-emerald-400';
    if (prob >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getProbBg = (prob: number) => {
    if (prob >= 70) return 'stroke-emerald-400';
    if (prob >= 40) return 'stroke-amber-400';
    return 'stroke-rose-400';
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f18] text-slate-200 overflow-y-auto custom-scrollbar">
      {/* HEADER */}
      <div className="flex-none p-6 border-b border-white/5 bg-gradient-to-r from-cyan-950/20 to-blue-900/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-900/30 rounded-xl border border-cyan-800/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Scale className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Giustizia Predittiva
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest border border-cyan-500/20">
                Beta
              </span>
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              Stima algoritmica di successo basata su Big Data e Cassazione.
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* INPUT SECTION */}
        <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Descrizione dei Fatti
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Inserisci una descrizione chiara e neutrale del caso (es. "Inquilino moroso da 6 mesi, contratto registrato regolarmente").
          </p>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Il fatto che genera il potenziale contenzioso..."
            className="w-full h-32 bg-[#0B1120] border border-white/10 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
          />
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Richiede abbonamento <b>LexAI Pro</b>
            </div>
            <button
              onClick={handlePredict}
              disabled={loading || !query.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  Calcolo Tensoriale in corso...
                </>
              ) : (
                'Analizza Precedenti'
              )}
            </button>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* RESULTS DASHBOARD */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* TOP ROW: MAIN STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* SCORE RADIAL */}
              <div className="col-span-1 bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
                  Probabilità di Vittoria
                </h4>
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      className="stroke-slate-800"
                      strokeWidth="8"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      className={`${getProbBg(result.win_probability)} transition-all duration-1000 ease-out`}
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * result.win_probability) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-black ${getProbColor(result.win_probability)}`}>
                      {result.win_probability}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Basato sull'analisi di {sourcesAnalyzed} precedenti in Cassazione.
                </p>
              </div>

              {/* RATIONALE & RISKS */}
              <div className="col-span-1 md:col-span-2 space-y-4">
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-indigo-400 flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4" />
                    Sintesi Giuridica
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {result.rationale}
                  </p>
                </div>

                <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    Fattori di Rischio Critici
                  </h4>
                  <ul className="space-y-2">
                    {result.risk_factors.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: CASE LAW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PRO CASES */}
              <div className="bg-[#111827]/80 border border-emerald-500/20 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4" />
                  Precedenti a Favore
                </h4>
                <div className="space-y-4">
                  {result.pro_cases?.length === 0 && (
                    <p className="text-slate-500 text-sm italic">Nessun precedente favorevole esplicito rilevato.</p>
                  )}
                  {result.pro_cases?.map((c, i) => (
                    <div key={i} className="bg-[#0B1120] border border-emerald-500/10 p-4 rounded-xl">
                      <h5 className="text-slate-200 font-medium text-sm mb-1">{c.title}</h5>
                      <p className="text-emerald-400/80 text-xs mb-2 font-medium">Pertinenza: {c.relevance}</p>
                      <div className="pl-3 border-l-2 border-emerald-500/30 text-slate-400 text-xs italic">
                        <Quote className="w-3 h-3 inline mr-1 opacity-50" />{c.quote}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CON CASES */}
              <div className="bg-[#111827]/80 border border-rose-500/20 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4" />
                  Precedenti a Sfavore
                </h4>
                <div className="space-y-4">
                  {result.con_cases?.length === 0 && (
                    <p className="text-slate-500 text-sm italic">Nessun precedente sfavorevole esplicito rilevato.</p>
                  )}
                  {result.con_cases?.map((c, i) => (
                    <div key={i} className="bg-[#0B1120] border border-rose-500/10 p-4 rounded-xl">
                      <h5 className="text-slate-200 font-medium text-sm mb-1">{c.title}</h5>
                      <p className="text-rose-400/80 text-xs mb-2 font-medium">Pertinenza: {c.relevance}</p>
                      <div className="pl-3 border-l-2 border-rose-500/30 text-slate-400 text-xs italic">
                         <Quote className="w-3 h-3 inline mr-1 opacity-50" />{c.quote}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
