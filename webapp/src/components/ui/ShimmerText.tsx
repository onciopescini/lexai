'use client';

import React from 'react';

/**
 * ShimmerText — Animated shimmer text in gold (premium) or slate (neutral).
 * Light glassmorphism variant — visible against white/ivory backgrounds.
 */
export function ShimmerText({
  children,
  variant = 'gold',
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'gold' | 'slate';
  className?: string;
}) {
  return (
    <span className={`${variant === 'gold' ? 'shimmer-gold' : 'shimmer-slate'} ${className}`}>
      {children}
    </span>
  );
}

/**
 * GoldBadge — Small premium signal badge, muted legal gold on ivory background.
 */
export function GoldBadge({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`gold-badge ${className}`}>
      {children}
    </span>
  );
}

/**
 * HoverBorderButton — Clean charcoal button with gold hover state.
 * Used for secondary CTAs alongside the primary gold-btn.
 */
export function HoverBorderButton({
  children,
  onClick,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        px-5 py-2.5 rounded-xl text-sm font-semibold
        bg-white border border-slate-200 text-slate-700
        hover:border-[#C9A84C] hover:text-[#9C7A2A]
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </button>
  );
}
