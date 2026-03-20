'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  IconSearch,
  IconBook,
  IconShield,
  IconSchool,
  IconBolt,
  IconX,
} from '@tabler/icons-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const ITEMS = [
  {
    group: 'Navigazione',
    items: [
      { icon: IconBolt, label: 'Chat Legale', shortcut: 'G H', href: '/' },
      { icon: IconBook, label: 'Library — Normativa', shortcut: 'G L', href: '/library' },
      { icon: IconShield, label: 'Guardian Alerts', shortcut: 'G G', href: '/guardian' },
      { icon: IconSchool, label: 'Lezioni Legali', shortcut: 'G E', href: '/lessons' },
    ],
  },
];

/**
 * CommandPalette — ⌘K global shortcut
 * Ispirato a Linear.app e Vercel Dashboard.
 * Solo per utenti Premium (il wrapper genitore gestisce l'accesso).
 */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');

  // Navigazione keyboard
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Il parent gestisce il toggle
      }
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onClose]);

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 cmd-backdrop"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            key="palette"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg"
          >
            <Command
              className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-white/6">
                <IconSearch size={16} className="text-white/40 shrink-0" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Cerca una sezione..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                  autoFocus
                />
                <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
                  <IconX size={14} />
                </button>
              </div>

              {/* Results */}
              <Command.List className="max-h-72 overflow-y-auto p-2 space-y-1">
                <Command.Empty className="py-8 text-center text-sm text-white/30">
                  Nessun risultato trovato.
                </Command.Empty>

                {ITEMS.map((group) => (
                  <Command.Group
                    key={group.group}
                    heading={group.group}
                    className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-white/30 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
                  >
                    {group.items.map((item) => (
                      <Command.Item
                        key={item.href}
                        value={item.label}
                        onSelect={() => handleSelect(item.href)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                          text-sm text-white/80 hover:text-white
                          data-[selected=true]:bg-white/6 data-[selected=true]:text-white
                          transition-colors duration-150"
                      >
                        <item.icon size={16} className="text-amber-legal shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <kbd className="px-2 py-0.5 rounded text-[10px] bg-white/6 text-white/30 font-mono border border-white/5">
                          {item.shortcut}
                        </kbd>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-end gap-4 px-4 py-2.5 border-t border-white/5">
                <span className="text-[11px] text-white/25 font-mono">↵ apri &nbsp; esc chiudi</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
