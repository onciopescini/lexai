'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBrandGoogleDrive, IconRefresh, IconCheck, IconAlertTriangle, IconFolder } from '@tabler/icons-react';

interface Props {
  firmId: string;
  currentFolderId?: string;
  currentFolderName?: string;
  documentsSynced?: number;
  lastSyncedAt?: string;
  onSyncComplete: (data: { documents_synced: number }) => void;
}

interface DriveFolder {
  id: string;
  name: string;
  modifiedTime: string;
}

export default function FirmDriveSyncCard({
  currentFolderId,
  currentFolderName,
  documentsSynced = 0,
  lastSyncedAt,
  onSyncComplete,
}: Props) {
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState(false);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [folderError, setFolderError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [pendingFolder, setPendingFolder] = useState<DriveFolder | null>(null);

  const openFolderPicker = async () => {
    setIsFolderPickerOpen(true);
    setLoadingFolders(true);
    setFolderError('');
    try {
      const res = await fetch('/api/firm/drive-sync/list-folders');
      const data = await res.json();
      if (!res.ok) {
        setFolderError(data.message || data.error || 'Errore di connessione a Google Drive.');
      } else {
        setFolders(data.folders || []);
      }
    } catch {
      setFolderError('Errore di rete.');
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleSelectFolder = (folder: DriveFolder) => {
    setPendingFolder(folder);
    setIsFolderPickerOpen(false);
  };

  const handleSync = async () => {
    const folder = pendingFolder ?? (currentFolderId ? { id: currentFolderId, name: currentFolderName || '', modifiedTime: '' } : null);
    if (!folder) return;

    setSyncing(true);
    setSyncError('');
    setSyncDone(false);

    try {
      const res = await fetch('/api/firm/drive-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folder.id, folderName: folder.name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncError(data.message || data.error || 'Errore durante la sincronizzazione.');
      } else {
        setSyncDone(true);
        setPendingFolder(null);
        onSyncComplete({ documents_synced: data.documents_synced });
        setTimeout(() => setSyncDone(false), 3000);
      }
    } catch {
      setSyncError('Errore di rete durante la sincronizzazione.');
    } finally {
      setSyncing(false);
    }
  };

  const displayFolder = pendingFolder ?? (currentFolderId ? { id: currentFolderId, name: currentFolderName || 'Cartella collegata' } : null);

  return (
    <>
      <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-[#E8F5E9] text-[#1FA463] rounded-2xl flex items-center justify-center">
            <IconBrandGoogleDrive size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Cartella Drive dello Studio</h3>
            <p className="text-xs text-slate-500">Sincronizza automaticamente i documenti del tuo studio.</p>
          </div>
        </div>

        {/* Folder Status */}
        {displayFolder ? (
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 mb-4 border border-slate-100">
            <IconFolder size={18} className="text-[#C9A84C] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{displayFolder.name}</p>
              {documentsSynced > 0 && (
                <p className="text-xs text-slate-400">{documentsSynced} documento/i indicizzati</p>
              )}
            </div>
            <button
              onClick={openFolderPicker}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium underline underline-offset-2"
            >
              Cambia
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center mb-4">
            <p className="text-sm text-slate-500 mb-3">Nessuna cartella collegata</p>
            <button
              onClick={openFolderPicker}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Seleziona Cartella Drive
            </button>
          </div>
        )}

        {/* Sync Info */}
        {lastSyncedAt && (
          <p className="text-[11px] text-slate-400 mb-3">
            Ultima sync: {new Date(lastSyncedAt).toLocaleString('it-IT')}
          </p>
        )}

        {/* Error */}
        {syncError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs mb-3">
            <IconAlertTriangle size={14} />
            {syncError}
          </div>
        )}

        {/* Sync Button */}
        {displayFolder && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 bg-slate-900 text-white hover:bg-slate-800"
          >
            <AnimatePresence mode="wait">
              {syncDone ? (
                <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-emerald-400">
                  <IconCheck size={16} /> Sincronizzato!
                </motion.span>
              ) : syncing ? (
                <motion.span key="syncing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <IconRefresh size={16} className="animate-spin" /> Sincronizzazione in corso...
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <IconRefresh size={16} />
                  {pendingFolder ? 'Connetti e Sincronizza' : 'Sincronizza ora'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>

      {/* Folder Picker Modal */}
      <AnimatePresence>
        {isFolderPickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setIsFolderPickerOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-md h-min max-h-[75vh] bg-white rounded-[28px] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center text-[#1FA463]">
                    <IconBrandGoogleDrive size={18} />
                  </div>
                  <h2 className="font-bold text-slate-900">Seleziona Cartella Drive</h2>
                </div>
                <button onClick={() => setIsFolderPickerOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full p-1.5 transition-colors">✕</button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                {loadingFolders ? (
                  <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-400">
                    <svg className="animate-spin w-8 h-8 mb-3 text-[#C9A84C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-semibold">Lettura cartelle Google Drive...</span>
                  </div>
                ) : folderError ? (
                  <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6">
                    <IconAlertTriangle size={32} className="text-amber-500 mb-3" />
                    <p className="font-semibold text-slate-800 mb-1">Accesso negato</p>
                    <p className="text-sm text-slate-500">{folderError}</p>
                  </div>
                ) : folders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-500 text-center">
                    <p className="font-semibold text-slate-700">Nessuna cartella trovata.</p>
                    <p className="text-xs mt-1">Crea una cartella su Google Drive e riprova.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 py-1 mb-1">Cartelle Recenti</p>
                    {folders.map(folder => (
                      <button
                        key={folder.id}
                        onClick={() => handleSelectFolder(folder)}
                        className="w-full flex items-center text-left gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group"
                      >
                        <IconFolder size={18} className="text-[#C9A84C] flex-shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#C9A84C] transition-colors">{folder.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {new Date(folder.modifiedTime).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 text-xs font-bold text-[#C9A84C] bg-[#F0E9D6]/50 px-3 py-1.5 rounded-lg transition-all">Seleziona</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
