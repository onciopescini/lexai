'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  /** Aggiunge il bordo ambra al hover */
  amberHover?: boolean;
  /** Aggiunge un glow ambra fisso */
  amberGlow?: boolean;
  /** Padding interno */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Anima l'apparizione con blur-fade */
  animate?: boolean;
  children: React.ReactNode;
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

/**
 * GlassCard — Dark Glassmorphism 2026
 * Componente base per card con backdrop-blur e bordo luminoso sottile.
 * Ispirato al design di Ironclad e Stripe Atlas.
 */
export function GlassCard({
  amberHover = true,
  amberGlow = false,
  padding = 'md',
  animate = true,
  className,
  children,
  ...props
}: GlassCardProps) {
  const Comp = animate ? motion.div : 'div' as unknown as typeof motion.div;

  return (
    <Comp
      initial={animate ? { opacity: 0, y: 8, filter: 'blur(6px)' } : undefined}
      animate={animate ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
      transition={animate ? { duration: 0.4, ease: [0.16, 1, 0.3, 1] } : undefined}
      className={clsx(
        'glass-card rounded-2xl',
        paddingMap[padding],
        amberHover && 'hover:border-amber-legal/30',
        amberGlow && 'amber-glow',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

/**
 * GlassCardHeader — Intestazione con separatore sottile
 */
export function GlassCardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('pb-3 mb-3 border-b border-white/5', className)}>
      {children}
    </div>
  );
}

/**
 * GlassCardTitle — Titolo con stile tipografico legale
 */
export function GlassCardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('text-sm font-semibold text-white/90 tracking-wide uppercase', className)}>
      {children}
    </h3>
  );
}
