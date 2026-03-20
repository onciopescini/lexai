'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconLayoutDashboard,
  IconBook2,
  IconRadar,
  IconSchool,
  IconCommand,
  IconChevronLeft,
  IconChevronRight,
  IconSparkles,
} from '@tabler/icons-react';
import { CommandPalette } from '../ui/CommandPalette';
import { AmberBadge } from '../ui/ShimmerText';

const NAV_ITEMS = [
  { name: 'Workspace', path: '/', icon: IconLayoutDashboard, shortcut: 'G H' },
  { name: 'Library', path: '/library', icon: IconBook2, shortcut: 'G L', badge: null },
  { name: 'Guardian', path: '/guardian', icon: IconRadar, shortcut: 'G G', badge: '3' },
  { name: 'Lessons', path: '/lessons', icon: IconSchool, shortcut: 'G E', badge: null },
];

/**
 * PremiumNavbar 2026 — Sidebar Verticale Collassabile
 * Pattern ispirato a Clio Manage & Ironclad.
 * Desktop: sidebar fissa a sinistra con collasso.
 * Mobile: bottom tab bar.
 */
export default function PremiumNavbar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K global shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-col h-screen glass-panel border-r border-white/5 sticky top-0 shrink-0 overflow-hidden z-40"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-legal/30 to-amber-legal-dim/20 border border-amber-legal/20 flex items-center justify-center shrink-0 amber-glow">
            <IconSparkles size={14} className="text-amber-legal" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-black text-white tracking-tight">Atena</p>
                <AmberBadge>Premium</AmberBadge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                title={collapsed ? item.name : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative
                  ${isActive
                    ? 'bg-amber-legal/10 text-amber-legal border border-amber-legal/15'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
              >
                <div className="relative shrink-0">
                  <item.icon
                    size={18}
                    className={isActive ? 'text-amber-legal' : 'text-white/40 group-hover:text-white/70'}
                  />
                  {/* Badge notifica */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-legal text-black text-[8px] font-black flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 truncate"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Shortcut hint — solo expanded */}
                {!collapsed && !isActive && (
                  <kbd className="hidden group-hover:flex text-[9px] text-white/20 font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                    {item.shortcut}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ⌘K Button */}
        <div className="p-2 border-t border-white/5">
          <button
            onClick={() => setPaletteOpen(true)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all`}
            title="Command Palette (⌘K)"
          >
            <IconCommand size={16} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 text-left font-mono"
                >
                  ⌘K cerca...
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center p-3 text-white/20 hover:text-white/60 hover:bg-white/5 transition-all border-t border-white/5"
        >
          {collapsed ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}
        </button>
      </motion.aside>

      {/* ─── MOBILE BOTTOM TABS ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/6 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all
                  ${isActive ? 'text-amber-legal' : 'text-white/30'}`}
              >
                <div className="relative">
                  <item.icon size={20} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-legal text-black text-[8px] font-black flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── COMMAND PALETTE ─── */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
