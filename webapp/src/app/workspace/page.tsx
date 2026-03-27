'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { IconUpload, IconFileText, IconTrash, IconCheck, IconServer2, IconBrandGoogleDrive, IconX } from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';

export default function WorkspacePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Drive Picker State
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState('');

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/workspace');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const openDrivePicker = async () => {
    setIsDriveModalOpen(true);
    setIsDriveLoading(true);
    setDriveError('');
    try {
      const res = await fetch('/api/workspace/import-drive/list');
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      } else {
        const err = await res.json();
        setDriveError(err.message || 'Errore durante la connessione a Google Drive.');
      }
    } catch (err) {
      setDriveError('Errore di connessione a Rete.');
    } finally {
      setIsDriveLoading(false);
    }
  };

  const startDriveImport = async (file: any) => {
    setIsDriveModalOpen(false);
    setIsUploading(true);
    setUploadProgress(15);
    try {
      const interval = setInterval(() => setUploadProgress(p => Math.min(p + 15, 90)), 1000);

      const res = await fetch('/api/workspace/import-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType
        })
      });

      clearInterval(interval);

      if (res.ok) {
        setUploadProgress(100);
        await fetchDocuments();
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1500);
      } else {
        const err = await res.json();
        alert(err.message || 'Errore durante l\'importazione da Drive.');
        setIsUploading(false);
        setUploadProgress(0);
      }
    } catch (err) {
      alert('Errore di connessione Rete.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    setIsUploading(true);
    setUploadProgress(10); // UI visual feedback

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Fake progress increment
      const interval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 15, 90));
      }, 800);

      const res = await fetch('/api/workspace/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (res.ok) {
        setUploadProgress(100);
        await fetchDocuments();
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1500); // give time to see 100% checkmark
      } else {
        const errorData = await res.json();
        alert(errorData.message || errorData.error || 'Errore durante l\'upload.');
        setIsUploading(false);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error(error);
      alert('Errore di connessione durante l\'upload.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxSize: 5 * 1024 * 1024, // 5 MB
    multiple: false
  });

  const handleDelete = async (id: string, fileName: string) => {
    if (!window.confirm(`Sei sicuro di voler rimuovere definitivamente dal Vault il documento "${fileName}"? I vettori AI asssociati verranno distrutti.`)) return;

    try {
      const res = await fetch(`/api/workspace?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.id !== id));
      } else {
        alert('Errore durante la cancellazione del documento dal vault.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <PremiumEcosystemWrapper>
      <div className="flex-1 overflow-y-auto bg-[#FAFAFA] text-slate-900 pb-24 relative">
        {/* Header Ivory Layout */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-black/5 px-8 pt-10 pb-8 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <IconServer2 className="text-[#C9A84C]" size={28} />
                Personal Workspace
              </h1>
              <p className="text-slate-500 mt-2 text-sm max-w-xl leading-relaxed">
                Costruisci il tuo archivio giuridico privato. Carica documenti PDF o Testo e l&apos;AI di Atena li vettorizzerà per interrogazioni RAG esclusive.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8 space-y-12">
          
          {/* UPLOAD SECTION */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-4">Ingestione Dati</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Dropzone */}
              <div 
                {...getRootProps()} 
                className={`col-span-1 md:col-span-2 relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-[24px] transition-all bg-white/60 backdrop-blur-sm cursor-pointer
                  ${isDragActive ? 'border-[#C9A84C] bg-[#F0E9D6]/30 shadow-inner' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                  ${isDragReject ? 'border-red-400 bg-red-50' : ''}
                `}
              >
                <input {...getInputProps()} />
                <AnimatePresence mode="wait">
                  {isUploading ? (
                    <motion.div 
                      key="uploading"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center text-center"
                    >
                      {uploadProgress === 100 ? (
                        <>
                          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-200 shadow-sm">
                            <IconCheck size={28} />
                          </div>
                          <p className="font-semibold text-emerald-700">Completato e indicizzato!</p>
                        </>
                      ) : (
                        <>
                          <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
                            <svg className="animate-spin text-[#C9A84C] w-14 h-14" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="absolute text-[10px] font-bold text-slate-600">{uploadProgress}%</span>
                          </div>
                          <p className="font-semibold text-slate-800">Analisi e Vettorizzazione AI in corso...</p>
                          <p className="text-xs text-slate-500 mt-1">Non chiudere la finestra.</p>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="w-14 h-14 bg-slate-50 border border-slate-100 text-[#C9A84C] rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                        <IconUpload size={28} />
                      </div>
                      <p className="font-bold text-slate-900">Trascina qui il tuo Documento</p>
                      <p className="text-sm text-slate-500 mt-1">PDF o Plain Text (.txt) fino a 5MB</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* GDrive Import Card */}
              <div className="glass-card bg-white p-6 rounded-[24px] flex flex-col justify-between items-start cursor-pointer hover:shadow-md transition-shadow group" onClick={openDrivePicker}>
                <div className="w-12 h-12 bg-[#F0F2F5] text-[#1FA463] rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#E6F4EA] transition-colors">
                  <IconBrandGoogleDrive size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Importa da Drive</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">Sincronizza direttamente i tuoi PDF o documenti Google Docs.</p>
                </div>
                <button className="bg-slate-100 text-slate-900 font-bold text-xs py-2 px-4 rounded-xl group-hover:bg-slate-200 transition-colors pointer-events-none">
                  Sfoglia Cloud
                </button>
              </div>

            </div>
          </section>

          {/* VAULT INVENTORY SECTION */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Vault Documentale ({documents.length})</h2>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center text-center bg-white/40">
                <span className="text-4xl mb-3 opacity-50">📂</span>
                <p className="font-bold text-slate-600">Archivio Vuoto</p>
                <p className="text-sm text-slate-400 mt-1">Carica un documento per sbloccare l&apos;AI conversazionale sui tuoi file.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {documents.map((doc, idx) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group glass-card bg-white p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-50 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                          <IconFileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 group-hover:text-[#C9A84C] transition-colors">{doc.file_name}</p>
                          <div className="flex gap-3 text-[11px] text-slate-400 font-mono mt-0.5">
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{formatBytes(doc.size_bytes)}</span>
                            <span>•</span>
                            <span className="text-emerald-500 font-semibold uppercase tracking-widest flex items-center gap-1">
                              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                              Indicizzato
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(doc.id, doc.file_name)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        title="Elimina Documento dal Vault"
                      >
                        <IconTrash size={18} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

        </div>

        {/* DRIVE PICKER MODAL */}
        <AnimatePresence>
          {isDriveModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm" 
                onClick={() => setIsDriveModalOpen(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 m-auto z-50 w-full max-w-lg h-min max-h-[80vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center text-[#1FA463]">
                      <IconBrandGoogleDrive size={18} />
                    </div>
                    <h2 className="font-bold text-slate-900">Seleziona da Google Drive</h2>
                  </div>
                  <button onClick={() => setIsDriveModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm rounded-full p-1.5 transition-colors">
                    <IconX size={18} />
                  </button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto">
                  {isDriveLoading ? (
                    <div className="flex flex-col flex-1 min-h-[250px] items-center justify-center text-slate-400">
                      <svg className="animate-spin text-[#C9A84C] w-8 h-8 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-semibold">Sincronizzazione Cloud in corso...</span>
                    </div>
                  ) : driveError ? (
                    <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 pb-8">
                      <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-3">
                        <IconX size={24} />
                      </div>
                      <p className="font-bold text-slate-800 mb-1">Accesso Negato</p>
                      <p className="text-sm text-slate-500">{driveError}</p>
                    </div>
                  ) : driveFiles.length === 0 ? (
                     <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 text-slate-500">
                       <p className="font-semibold text-slate-700">Nessun file compatibile trovato.</p>
                       <p className="text-xs mt-1">Sono supportati solo PDF, TXT o Documenti Google.</p>
                     </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 py-1 mb-1">File Recenti</p>
                      {driveFiles.map(file => (
                        <button 
                          key={file.id} 
                          onClick={() => startDriveImport(file)}
                          className="w-full flex items-center text-left gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group"
                        >
                          <img src={file.iconLink || 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg'} alt="" className="w-6 h-6 object-contain" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#C9A84C] transition-colors">{file.name}</p>
                            <p className="text-[10px] font-mono text-slate-400">Ultima modifica: {new Date(file.modifiedTime).toLocaleDateString()}</p>
                          </div>
                          <span className="opacity-0 group-hover:opacity-100 text-xs font-bold text-[#C9A84C] bg-[#F0E9D6]/50 px-3 py-1.5 rounded-lg transition-all">Importa</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </PremiumEcosystemWrapper>
  );
}
