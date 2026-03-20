'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';

/**
 * NumberTicker — Conta da 0 al valore target quando entra in viewport.
 * Ispirato a Magic UI NumberTicker.
 */
export function NumberTicker({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 1.5,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -50px 0px' });

  const springValue = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 20,
  });

  const display = useTransform(springValue, (latest) =>
    `${prefix}${latest.toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    if (inView) {
      // Small delay so user notices the animation
      setTimeout(() => springValue.set(value), 150);
    }
  }, [inView, value, springValue, duration]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}

/**
 * BlurFadeIn — Fade in con blur, per entrare in viewport
 * Ispirato a Magic UI BlurFade.
 */
export function BlurFadeIn({
  children,
  delay = 0,
  duration = 0.4,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * TypewriterLoop — Testo che si riscrive in loop con un cursore lampeggiante
 */
export function TypewriterLoop({
  phrases,
  className,
  speed = 60,
  deleteSpeed = 30,
  pauseMs = 1800,
}: {
  phrases: string[];
  className?: string;
  speed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
}) {
  const [text, setText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && text === currentPhrase) {
      timeout = setTimeout(() => setIsDeleting(true), pauseMs);
    } else if (isDeleting && text === '') {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIdx((i) => (i + 1) % phrases.length);
      }, 100);
    } else {
      timeout = setTimeout(
        () => {
          setText(isDeleting
            ? currentPhrase.slice(0, text.length - 1)
            : currentPhrase.slice(0, text.length + 1)
          );
        },
        isDeleting ? deleteSpeed : speed
      );
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIdx, phrases, speed, deleteSpeed, pauseMs]);

  return (
    <span className={className}>
      {text}
      <span className="animate-cursor-blink">|</span>
    </span>
  );
}
