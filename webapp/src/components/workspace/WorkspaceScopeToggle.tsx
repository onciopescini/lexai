'use client';

/**
 * WorkspaceScopeToggle — Phase 16
 * Allows Premium/Studio users to switch between Personal, Firm, and All document scopes
 * for Atena AI search context.
 */

import React from 'react';
import { User as UserIcon, Building2, Layers } from 'lucide-react';

export type WorkspaceScope = 'personal' | 'firm' | 'all';

interface WorkspaceScopeToggleProps {
  scope: WorkspaceScope;
  onChange: (scope: WorkspaceScope) => void;
  hasFirm?: boolean;
  className?: string;
}

const SCOPE_OPTIONS: { value: WorkspaceScope; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'personal',
    label: 'Personale',
    icon: <UserIcon size={14} />,
    description: 'Solo i tuoi documenti privati',
  },
  {
    value: 'firm',
    label: 'Studio',
    icon: <Building2 size={14} />,
    description: 'Documenti condivisi dello studio',
  },
  {
    value: 'all',
    label: 'Entrambi',
    icon: <Layers size={14} />,
    description: 'Personale + Studio',
  },
];

export default function WorkspaceScopeToggle({
  scope,
  onChange,
  hasFirm = false,
  className = '',
}: WorkspaceScopeToggleProps) {
  const options = hasFirm
    ? SCOPE_OPTIONS
    : SCOPE_OPTIONS.filter((o) => o.value === 'personal');

  if (!hasFirm) return null; // Only show toggle if user is in a firm

  return (
    <div
      className={`ws-scope-toggle ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '10px',
        padding: '4px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {options.map((opt) => {
        const isActive = scope === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.description}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.18s ease',
              background: isActive
                ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.25))'
                : 'transparent',
              color: isActive ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
              boxShadow: isActive ? '0 0 0 1px rgba(139,92,246,0.4)' : 'none',
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
