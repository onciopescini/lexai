'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  IconSearch,
  IconBook,
  IconShield,
  IconBrain,
  IconLibrary,
  IconX,
} from '@tabler/icons-react';

const COMMANDS = [
  { id: 'library',  label: 'Biblioteca Legale',    icon: IconLibrary, href: '/library',  shortcut: 'L' },
  { id: 'guardian', label: 'Guardian — Alert',      icon: IconShield,  href: '/guardian', shortcut: 'G' },
  { id: 'lessons',  label: 'Lezioni Legali',        icon: IconBook,    href: '/lessons',  shortcut: 'I' },
  { id: 'atena',    label: 'Chat con Atena AI',     icon: IconBrain,   href: '/atena',    shortcut: 'A' },
];

/**
 * CommandPalette — Light Glassmorphism ⌘K palette.
 * Triggered by Cmd+K / Ctrl+K. White/90 glass, slate text, gold selected state.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const toggle = useCallback(() => setOpen(o => !o), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggle]);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[999] bg-slate-900/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="palette"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{ opacity: 0, scale: 0.97,    y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[1000] w-full max-w-[520px] px-4"
          >
            <Command
              className="glass-modal rounded-2xl overflow-hidden"
              label="Navigazione rapida"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                <IconSearch size={16} className="text-slate-400 shrink-0" />
                <Command.Input
                  placeholder="Cerca una sezione…"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                  autoFocus
                />
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <IconX size={15} />
                </button>
              </div>

              {/* Commands */}
              <Command.List className="max-h-64 overflow-y-auto py-2">
                <Command.Empty className="px-4 py-6 text-center text-sm text-slate-400">
                  Nessun risultato trovato.
                </Command.Empty>

                <Command.Group heading="Navigazione" className="px-2">
                  {COMMANDS.map(cmd => (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.label}
                      onSelect={() => navigate(cmd.href)}
                      className="
                        flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-sm text-slate-700 cursor-pointer
                        data-[selected=true]:bg-[#F0E9D6] data-[selected=true]:text-[#9C7A2A]
                        transition-colors
                      "
                    >
                      <cmd.icon size={16} className="shrink-0" />
                      <span className="flex-1">{cmd.label}</span>
                      <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {cmd.shortcut}
                      </kbd>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4">
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">↑↓</kbd> naviga
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">↵</kbd> apri
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Esc</kbd> chiudi
                </span>
              </div>
            </Command>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
