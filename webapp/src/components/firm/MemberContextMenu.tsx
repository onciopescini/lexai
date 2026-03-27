'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IconDotsVertical, IconCrown, IconUser, IconTrash } from '@tabler/icons-react';

interface FirmMember {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'active' | 'removed';
  user_id?: string;
}

interface Props {
  member: FirmMember;
  currentUserId: string;
  firmOwnerId: string;
  isAdmin: boolean;
  onUpdateRole: (memberId: string, newRole: 'admin' | 'member') => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
}

export default function MemberContextMenu({
  member,
  currentUserId,
  firmOwnerId,
  isAdmin,
  onUpdateRole,
  onRemove,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isAdmin) return null;

  const isSelf = member.id === 'self' || member.user_id === currentUserId;
  const isOwnerTarget = member.user_id === firmOwnerId;
  const targetIsAdmin = member.role === 'admin';
  const currentUserIsOwner = currentUserId === firmOwnerId;

  const canModifyRole = currentUserIsOwner || (!isOwnerTarget && !targetIsAdmin && !isSelf);
  const canRemove = currentUserIsOwner || (!isOwnerTarget && !targetIsAdmin && !isSelf);

  if (!canModifyRole && !canRemove) return null;

  return (
    <div className="relative flex items-center" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2"
        title="Opzioni Membro"
      >
        <IconDotsVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[110%] mt-1 w-48 bg-white border border-slate-100 shadow-xl rounded-xl overflow-hidden z-20 origin-top-right animate-fade-in-up">
          <div className="p-1">
            {canModifyRole && (
              <>
                {member.role === 'member' ? (
                  <button 
                    onClick={() => { setIsOpen(false); onUpdateRole(member.id, 'admin'); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-lg"
                  >
                    <IconCrown size={14} className="text-[#C9A84C]" />
                    Promuovi ad Admin
                  </button>
                ) : (
                  <button 
                    onClick={() => { setIsOpen(false); onUpdateRole(member.id, 'member'); }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 rounded-lg"
                  >
                    <IconUser size={14} />
                    Rendi Membro
                  </button>
                )}
                <div className="h-px bg-slate-100 my-1"></div>
              </>
            )}

            {canRemove && (
              <button 
                onClick={() => { 
                  if (confirm('Sei sicuro di voler rimuovere questo membro dallo Studio? Perderà accesso a tutti i documenti.')) {
                    setIsOpen(false);
                    onRemove(member.id);
                  }
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg"
              >
                <IconTrash size={14} />
                Rimuovi dallo Studio
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
