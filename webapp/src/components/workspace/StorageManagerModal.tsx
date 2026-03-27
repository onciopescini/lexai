'use client';

import React, { useEffect, useState } from 'react';
import { X, Trash2, Database, AlertCircle, RefreshCw, FileText, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StorageStats {
  total_bytes: number;
  document_count: number;
  total_chunks: number;
  limit_bytes: number;
}

interface DocumentInfo {
  id: string;
  file_name: string;
  file_type: string;
  size_bytes: number;
  created_at: string;
  chunks?: [{ count: number }];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function StorageManagerModal({ isOpen, onClose }: Props) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, docsRes] = await Promise.all([
        fetch('/api/workspace/storage'),
        fetch('/api/workspace/documents?scope=personal')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const handleDeleteParams = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento e tutti i suoi dati?')) return;
    try {
      setRefreshing(true);
      const res = await fetch(`/api/workspace/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        // Remove from selection if there
        const newSel = new Set(selectedIds);
        newSel.delete(id);
        setSelectedIds(newSel);
      } else {
        alert('Errore eliminazione.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.size} documenti selezionati?`)) return;
    try {
      setRefreshing(true);
      const res = await fetch('/api/workspace/documents/batch', {
         method: 'DELETE',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      if (res.ok) {
        await fetchData();
        setSelectedIds(new Set());
      } else {
        alert('Errore eliminazione massiva.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSel = new Set(selectedIds);
    if (newSel.has(id)) newSel.delete(id);
    else newSel.add(id);
    setSelectedIds(newSel);
  };

  const toggleAll = () => {
    if (selectedIds.size === documents.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(documents.map(d => d.id)));
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Storage & Documenti</h2>
              <p className="text-sm text-slate-500 font-medium">Gestisci i file caricati nel tuo spazio personale</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={fetchData} 
               disabled={refreshing || loading}
               className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
             >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
             </button>
             <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
               <X className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {loading ? (
             <div className="h-40 flex items-center justify-center">
                <Spinner />
             </div>
          ) : (
             <div className="space-y-8">
                {/* Storage Meter */}
                {stats && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                     <div className="flex justify-between items-end">
                       <div>
                         <span className="text-3xl font-black text-slate-800">{formatBytes(stats.total_bytes)}</span>
                         <span className="text-slate-500 font-medium ml-2">usati su {formatBytes(stats.limit_bytes)}</span>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-slate-700">{stats.document_count} Documenti</p>
                          <p className="text-xs text-slate-500">{stats.total_chunks} frammenti vettoriali estrapolati</p>
                       </div>
                     </div>
                     <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${
                            (stats.total_bytes / stats.limit_bytes) > 0.9 ? 'bg-rose-500' :
                            (stats.total_bytes / stats.limit_bytes) > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (stats.total_bytes / stats.limit_bytes) * 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                     </div>
                     {(stats.total_bytes / stats.limit_bytes) > 0.9 && (
                        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
                          <AlertCircle className="w-4 h-4" /> Spazio in esaurimento. Elimina documenti vecchi per liberare spazio.
                        </div>
                     )}
                  </div>
                )}

                {/* Document List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                   <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                         <button onClick={toggleAll} className="text-slate-400 hover:text-slate-600 transition-colors">
                           {selectedIds.size === documents.length && documents.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                         </button>
                         <span className="text-sm font-bold text-slate-700">Archivio Personale</span>
                     </div>
                     {selectedIds.size > 0 && (
                        <button 
                          onClick={handleBulkDelete}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors"
                        >
                           <Trash2 className="w-3.5 h-3.5" /> Elimina Selezionati ({selectedIds.size})
                        </button>
                     )}
                   </div>
                   
                   {documents.length === 0 ? (
                      <div className="p-10 text-center text-slate-500">
                         Nessun documento caricato nel tuo spazio personale.
                      </div>
                   ) : (
                      <div className="divide-y divide-slate-100">
                         {documents.map(doc => (
                           <div key={doc.id} className={`flex items-center px-4 py-3 hover:bg-slate-50 transition-colors ${selectedIds.has(doc.id) ? 'bg-indigo-50/30' : ''}`}>
                              <button onClick={() => toggleSelection(doc.id)} className="text-slate-300 hover:text-indigo-500 mr-4 transition-colors">
                                {selectedIds.has(doc.id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                              </button>
                              
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mr-4">
                                <FileText className="w-5 h-5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold text-slate-800 truncate">{doc.file_name}</p>
                                 <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                    <span>{new Date(doc.created_at).toLocaleDateString('it-IT')}</span>
                                    <span>&bull;</span>
                                    <span>{formatBytes(doc.size_bytes)}</span>
                                 </div>
                              </div>
                              
                              <button 
                                onClick={() => handleDeleteParams(doc.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-4"
                                title="Elimina documento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  );
}
