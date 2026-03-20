'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  goldAccent?: boolean;   // premium-only: gold left border
  animate?: boolean;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  as?: 'div' | 'section' | 'article';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * GlassCard — Light Glassmorphism base card component.
 * Uses white/82 background + backdrop-blur-xl + subtle hairline border.
 * Gold accent variant for premium content sections only.
 */
export default function GlassCard({
  children,
  className = '',
  onClick,
  hover = true,
  goldAccent = false,
  animate = true,
  padding = 'md',
  as: Tag = 'div',
}: GlassCardProps) {
  const base =
    `glass-card rounded-2xl ${paddingMap[padding]} ${
      goldAccent ? 'border-l-2 border-l-[#C9A84C]' : ''
    } ${onClick ? 'cursor-pointer' : ''} ${className}`;

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClick}
        className={base}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Tag onClick={onClick} className={base} role={onClick ? 'button' : undefined}>
      {children}
    </Tag>
  );
}
