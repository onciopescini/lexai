'use client';

import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconBuilding,
  IconUsers,
  IconCheck,
  IconClock,
  IconCrown,
  IconAlertTriangle,
  IconSparkles,
  IconCreditCard,
} from '@tabler/icons-react';
import FirmDriveSyncCard from './FirmDriveSyncCard';
import InviteMemberModal from './InviteMemberModal';
import MemberContextMenu from './MemberContextMenu';

interface FirmMember {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'active' | 'removed';
  joined_at?: string;
  invited_at: string;
  user_id?: string;
}

interface Firm {
  id: string;
  name: string;
  owner_id: string;
  drive_folder_id?: string;
  drive_folder_name?: string;
  documents_synced?: number;
  last_synced_at?: string;
  created_at: string;
  seat_count?: number;
  stripe_subscription_id?: string;
  firm_members?: FirmMember[];
}

interface Props {
  user: User;
}

export default function FirmDashboard({ user }: Props) {
  const [firm, setFirm] = useState<Firm | null>(null);
  const [members, setMembers] = useState<FirmMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newFirmName, setNewFirmName] = useState('');
  const [createError, setCreateError] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'member'>('member');

  const fetchFirm = async () => {
    try {
      const res = await fetch('/api/firm');
      const data = await res.json();
      if (data.firm) {
        setFirm(data.firm);
        setUserRole(data.role);
        setMembers(data.firm.firm_members || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFirm(); }, []);

  const handleCreateFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirmName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/firm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFirmName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.message || data.error || 'Errore durante la creazione.');
      } else {
        setFirm(data.firm);
        setUserRole('admin');
        setMembers([{ id: 'self', email: user.email!, role: 'admin', status: 'active', invited_at: new Date().toISOString() }]);
      }
    } catch {
      setCreateError('Errore di rete.');
    } finally {
      setCreating(false);
    }
  };

  const handleSyncComplete = (syncData: { documents_synced: number }) => {
    if (!firm) return;
    setFirm(prev => prev ? {
      ...prev,
      documents_synced: syncData.documents_synced,
      last_synced_at: new Date().toISOString(),
    } : null);
  };

  const handleMemberInvited = (newMember: { email: string; role: string; status: string }) => {
    setMembers(prev => [...prev, {
      id: `temp-${Date.now()}`,
      email: newMember.email,
      role: newMember.role as 'member' | 'admin',
      status: 'pending',
      invited_at: new Date().toISOString(),
    }]);
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      const res = await fetch(`/api/firm/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      } else {
        alert('Errore aggiornamento ruolo.');
      }
    } catch {
       alert('Errore di rete.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/firm/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'removed' }),
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
      } else {
         alert('Errore durante la rimozione.');
      }
    } catch {
       alert('Errore di rete.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin" />
      </div>
    );
  }

  // ── ONBOARDING: nessuno studio creato ──────────────────────────────────────
  if (!firm) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#F0E9D6] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[#C9A84C]/20">
              <IconBuilding size={28} className="text-[#9C7A2A]" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-serif mb-2">Crea il tuo Studio Legale</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Collega il tuo team e una cartella Google Drive. Atena indicizzerà automaticamente tutti i documenti dello studio.
            </p>
          </div>

          <form onSubmit={handleCreateFirm} className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Nome dello Studio
              </label>
              <input
                type="text"
                value={newFirmName}
                onChange={e => setNewFirmName(e.target.value)}
                placeholder="es. Studio Legale Rossi & Associati"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] transition-all"
                required
              />
            </div>

            {createError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs">
                <IconAlertTriangle size={14} />
                {createError}
              </div>
            )}

            <button
              type="submit"
              disabled={creating || !newFirmName.trim()}
              className="w-full py-3 gold-btn rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <IconSparkles size={16} />
              {creating ? 'Creazione in corso...' : 'Crea Studio ✦'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── FIRM DASHBOARD ─────────────────────────────────────────────────────────
  const isAdmin = userRole === 'admin' || firm.owner_id === user.id;
  const activeCount = members.filter(m => m.status === 'active').length;
  const pendingCount = members.filter(m => m.status === 'pending').length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAFAFA] pb-24">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-black/5 px-8 pt-10 pb-8 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <IconBuilding className="text-[#C9A84C]" size={28} />
              {firm.name}
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              Fondato il {new Date(firm.created_at).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}
              <span className="text-emerald-600 font-medium">{activeCount} membro/i attivi</span>
              {pendingCount > 0 && <span className="text-amber-500 font-medium"> · {pendingCount} in attesa</span>}
            </p>
          </div>
          {isAdmin && <InviteMemberModal onInvited={handleMemberInvited} />}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8 space-y-10">

        {/* Billing */}
        {isAdmin && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-4">Piano & Fatturazione</h2>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <IconCreditCard size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Piano Studio</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {firm.seat_count || 1} postazioni sul piano · €{((firm.seat_count || 1) * 19).toFixed(2)}/mese
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/firm/checkout', { method: 'POST' });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-bold transition-colors shrink-0"
              >
                Gestisci piano
              </button>
            </div>
          </section>
        )}

        {/* Drive Sync */}
        {isAdmin && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-4">Knowledge Base dello Studio</h2>
            <FirmDriveSyncCard
              firmId={firm.id}
              currentFolderId={firm.drive_folder_id}
              currentFolderName={firm.drive_folder_name}
              documentsSynced={firm.documents_synced}
              lastSyncedAt={firm.last_synced_at}
              onSyncComplete={handleSyncComplete}
            />
          </section>
        )}

        {/* Team */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
            Team ({members.length})
          </h2>

          {members.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-[24px] text-center bg-white/40">
              <IconUsers size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-600">Nessun membro ancora</p>
              <p className="text-sm text-slate-400 mt-1">Invita il tuo primo collaboratore con il bottone in alto.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {members.map((member, idx) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: idx * 0.04 }}
                    className="group bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                        member.status === 'active' ? 'bg-slate-800' : 'bg-slate-300'
                      }`}>
                        {member.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-slate-900">{member.email}</p>
                          {member.role === 'admin' && (
                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#9C7A2A] bg-[#F0E9D6] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              <IconCrown size={9} /> Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {member.status === 'active'
                            ? `Attivo dal ${new Date(member.joined_at || member.invited_at).toLocaleDateString('it-IT')}`
                            : `Invitato il ${new Date(member.invited_at).toLocaleDateString('it-IT')}`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {/* Status Badge */}
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                        member.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {member.status === 'active'
                          ? <><IconCheck size={11} /> Attivo</>
                          : <><IconClock size={11} /> In attesa</>
                        }
                      </div>

                      <MemberContextMenu
                        member={member}
                        currentUserId={user.id}
                        firmOwnerId={firm.owner_id}
                        isAdmin={isAdmin}
                        onUpdateRole={handleUpdateRole}
                        onRemove={handleRemoveMember}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
