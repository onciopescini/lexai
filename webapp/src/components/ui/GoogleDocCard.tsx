'use client';

import React from 'react';

interface GoogleDocCardProps {
  url: string;
  title?: string;
}

/**
 * Extracts a Google Doc link from a message string.
 * Returns the URL if found, null otherwise.
 */
export function extractGoogleDocUrl(text: string): string | null {
  const match = text.match(
    /https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9_-]+\/edit/
  );
  return match ? match[0] : null;
}

export default function GoogleDocCard({ url, title }: GoogleDocCardProps) {
  return (
    <div className="mt-6 animate-fade-in-up">
      <div className="relative group p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-blue-100 shadow-[0_8px_30px_rgba(66,133,244,0.08)] hover:shadow-[0_12px_40px_rgba(66,133,244,0.15)] hover:border-blue-200 transition-all duration-500 overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full filter blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="relative z-10 flex items-center gap-5">
          {/* Google Docs Icon */}
          <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="2" width="16" height="20" rx="2" fill="#4285F4" />
              <rect x="4" y="2" width="16" height="20" rx="2" fill="url(#docGrad)" />
              <path d="M14 2v5a1 1 0 001 1h5" fill="#1A73E8" />
              <rect x="8" y="11" width="8" height="1.5" rx="0.75" fill="white" opacity="0.9" />
              <rect x="8" y="14" width="6" height="1.5" rx="0.75" fill="white" opacity="0.7" />
              <rect x="8" y="17" width="7" height="1.5" rx="0.75" fill="white" opacity="0.5" />
              <defs>
                <linearGradient id="docGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4285F4" />
                  <stop offset="1" stopColor="#1A73E8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">
                Google Docs
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                Creato
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 truncate">
              {title || 'Documento Legale Atena'}
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
              {url}
            </p>
          </div>

          {/* Action Button */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-5 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-600 hover:shadow-blue-500/25 transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Apri in Docs
          </a>
        </div>
      </div>
    </div>
  );
}
