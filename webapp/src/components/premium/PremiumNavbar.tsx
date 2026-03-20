'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconLayoutSidebar,
  IconBrain,
  IconShield,
  IconLibrary,
  IconBook,
  IconCommand,
  IconChevronLeft,
  IconChevronRight,
  IconAlertTriangle,
} from '@tabler/icons-react';
import CommandPalette from '@/components/ui/CommandPalette';

const NAV_ITEMS = [
  { href: '/atena',   label: 'Atena AI',      icon: IconBrain,   shortcut: 'A' },
  { href: '/library', label: 'Biblioteca',    icon: IconLibrary, shortcut: 'L' },
  { href: '/guardian',label: 'Guardian',      icon: IconShield,  shortcut: 'G', badge: true },
  { href: '/lessons', label: 'Lezioni',       icon: IconBook,    shortcut: 'I' },
];

/**
 * PremiumNavbar — Light Glassmorphism collapsible sidebar.
 * Desktop: white/92 glass panel, slate nav items, gold active state.
 * Mobile: bottom tab bar with ivory active indicator.
 */
export default function PremiumNavbar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <CommandPalette />

      {/* ── Desktop sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-col h-full glass-panel border-r shrink-0 overflow-hidden"
      >
        {/* Logo / Brand */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 rounded-lg bg-[#C9A84C] flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-black font-serif">A</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-bold text-slate-800 tracking-tight font-serif"
              >
                Atena
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <div className={`sidebar-nav-item ${active ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}>
                  <div className="relative shrink-0">
                    <item.icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
                    )}
                  </div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.12 }}
                        className="flex items-center justify-between flex-1 min-w-0"
                      >
                        <span className="truncate">{item.label}</span>
                        <kbd className="text-[9px] font-mono text-slate-300 bg-slate-100 px-1 py-0.5 rounded opacity-60 ml-2">
                          {item.shortcut}
                        </kbd>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer — ⌘K + collapse */}
        <div className="px-3 pb-4 space-y-1 border-t border-slate-100 pt-3">
          {/* ⌘K shortcut hint */}
          {!collapsed && (
            <button
              className="sidebar-nav-item w-full text-[11px]"
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            >
              <IconCommand size={15} />
              <span className="flex-1 text-left">Ricerca rapida</span>
              <kbd className="text-[9px] font-mono text-slate-300 bg-slate-100 px-1 py-0.5 rounded">⌘K</kbd>
            </button>
          )}
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`sidebar-nav-item w-full ${collapsed ? 'justify-center' : ''}`}
          >
            <IconLayoutSidebar size={15} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 text-left text-[11px]"
                >
                  Comprimi
                </motion.span>
              )}
            </AnimatePresence>
            {collapsed
              ? <IconChevronRight size={13} className="text-slate-300" />
              : <IconChevronLeft size={13} className="text-slate-300" />
            }
          </button>
        </div>
      </motion.aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-slate-100 flex items-center justify-around px-2 py-2 safe-area-bottom">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-1 px-3">
              <div className={`relative p-2 rounded-xl transition-colors ${active ? 'bg-[#F0E9D6]' : ''}`}>
                <item.icon size={20} className={active ? 'text-[#9C7A2A]' : 'text-slate-400'} strokeWidth={active ? 2.2 : 1.8} />
                {item.badge && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </div>
              <span className={`text-[9px] font-semibold tracking-wide ${active ? 'text-[#9C7A2A]' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button className="flex flex-col items-center gap-1 py-1 px-3">
          <div className="p-2 rounded-xl">
            <IconAlertTriangle size={20} className="text-red-400" strokeWidth={1.8} />
          </div>
          <span className="text-[9px] font-semibold tracking-wide text-slate-400">Alert</span>
        </button>
      </nav>
    </>
  );
}
