'use client';

import { clsx } from 'clsx';

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  /** Usa il gradiente ambra legale (default) o bianco */
  variant?: 'amber' | 'white';
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}

/**
 * ShimmerText — Testo con effetto shimmer animato
 * Ispirato a Magic UI AnimatedShinyText.
 * Usato per CTA premium, titoli hero, badge.
 */
export function ShimmerText({
  children,
  className,
  variant = 'amber',
  as: Tag = 'span',
}: ShimmerTextProps) {
  return (
    <Tag
      className={clsx(
        'inline-block font-semibold',
        variant === 'amber'
          ? 'shimmer-text'
          : 'bg-gradient-to-r from-white/60 via-white to-white/60 bg-[length:300%_100%] bg-clip-text text-transparent animate-shiny-text',
        className
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * AmberBadge — Pill badge con accento ambra e glow
 */
export function AmberBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
        'bg-amber-legal-glow text-amber-legal border border-amber-legal/20',
        'shadow-[0_0_12px_rgba(212,168,83,0.15)]',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * HoverBorderButton — Pulsante con bordo animato shimmer ispirato ad Aceternity UI
 */
export function HoverBorderButton({
  children,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'relative inline-flex items-center justify-center px-6 py-3 rounded-xl',
        'font-semibold text-sm text-white',
        'bg-gradient-to-b from-white/10 to-white/5',
        'border border-white/10 hover:border-amber-legal/40',
        'shadow-lg hover:shadow-amber-legal/10',
        'transition-all duration-300',
        'before:absolute before:inset-0 before:rounded-xl before:opacity-0 hover:before:opacity-100',
        'before:bg-gradient-to-r before:from-amber-legal/10 before:via-transparent before:to-amber-legal/10',
        'before:transition-opacity before:duration-500',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}
