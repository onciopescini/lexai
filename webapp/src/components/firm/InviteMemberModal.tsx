'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUserPlus, IconX, IconAlertTriangle, IconCheck } from '@tabler/icons-react';

interface Props {
  onInvited: (member: { email: string; role: string; status: string }) => void;
}

export default function InviteMemberModal({ onInvited }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/firm/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'SEAT_LIMIT_REACHED') {
          setError('SEAT_LIMIT_REACHED');
        } else {
          setError(data.error || 'Errore durante l\'invito.');
        }
      } else {
        setDone(true);
        onInvited({ email: email.trim(), role, status: 'pending' });
        setTimeout(() => {
          setDone(false);
          setEmail('');
          setRole('member');
          setOpen(false);
        }, 2000);
      }
    } catch {
      setError('Errore di rete.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
      >
        <IconUserPlus size={16} />
        Invita Avvocato
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-sm h-min bg-white rounded-[28px] shadow-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#F0E9D6] rounded-xl flex items-center justify-center">
                    <IconUserPlus size={18} className="text-[#9C7A2A]" />
                  </div>
                  <h2 className="font-bold text-slate-900">Invita Membro</h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full p-1.5 transition-colors">
                  <IconX size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="avvocato@studio.it"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] transition-all"
                    required
                    disabled={loading || done}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">Ruolo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['member', 'admin'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                          role === r
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {r === 'admin' ? 'Amministratore' : 'Membro'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error === 'SEAT_LIMIT_REACHED' ? (
                  <div className="flex flex-col gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <div className="flex items-start gap-2 text-orange-800 text-sm font-medium">
                      <IconAlertTriangle size={18} className="shrink-0 mt-0.5" />
                      Hai raggiunto il limite di postazioni dal tuo piano.
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        try {
                           const coutRes = await fetch('/api/firm/checkout', { method: 'POST' });
                           const coutData = await coutRes.json();
                           if (coutData.url) window.location.href = coutData.url;
                        } catch (e) { console.error(e) }
                      }}
                      className="w-full py-2.5 rounded-lg bg-orange-600 text-white font-semibold text-sm hover:bg-orange-700 transition"
                    >
                      Aggiungi un seat (+€19/mese)
                    </button>
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs">
                    <IconAlertTriangle size={14} />
                    {error}
                  </div>
                ) : null}

                {/* Submit */}
                {error !== 'SEAT_LIMIT_REACHED' && (
                  <button
                  type="submit"
                  disabled={loading || done || !email.trim()}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[#C9A84C] text-white hover:bg-[#B8953B] transition-colors disabled:opacity-60"
                >
                  {done ? (
                    <><IconCheck size={16} /> Invito inviato!</>
                  ) : loading ? (
                    'Invio in corso...'
                  ) : (
                    'Invia Invito'
                  )}
                </button>
                )}
                <p className="text-[11px] text-slate-400 text-center">
                  Il collaboratore riceverà un&apos;email con il link per unirsi allo studio.
                </p>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
