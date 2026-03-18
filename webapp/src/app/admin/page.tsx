'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminIngestionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string, data?: string }>({ type: 'idle', message: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !password) {
        setStatus({ type: 'error', message: 'Assicurati di compilare Titolo, Password e di selezionare un File.' });
        return;
    }

    setIsUploading(true);
    setStatus({ type: 'idle', message: '' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      const res = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: {
            'x-admin-password': password
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l\'ingestione multimodale');
      }

      setStatus({ 
        type: 'success', 
        message: 'Documento ingerito e indicizzato semanticamente con successo!',
        data: data.extractedData 
      });
      setFile(null);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: unknown) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans selection:bg-purple-500/30">
        
      {/* Background Ornaments */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <main className="max-w-4xl mx-auto relative z-10 pt-12">
        <div className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Hybrid Multimodal Orchestrator
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Carica file audio (udienze, intercettazioni), immagini (visure, piantine) o PDF complessi. Gemini 2.5 Flash estrarrà le nozioni giuridiche e le inserirà direttamente nel cervello vettoriale di Atena.
            </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Title Input */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Titolo Documento</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Es: Sentenza Cassazione Audio, Visura Catastale Roma..."
                    className="w-full bg-black/40 border border-white/10 rounded-[24px] px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    disabled={isUploading}
                />
            </div>

            {/* Drag & Drop Area */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">File Multimediale</label>
                <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[24px] p-12 text-center cursor-pointer transition-all duration-300 group ${
                        file ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 hover:border-purple-500/30 hover:bg-white/5'
                    }`}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        disabled={isUploading}
                    />
                    
                    {file ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <FileType className="w-8 h-8 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium text-lg">{file.name}</p>
                                <p className="text-gray-500 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Sconosciuto'}</p>
                            </div>
                            <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setFile(null); if(fileInputRef.current) fileInputRef.current.value=''; }}
                                className="text-sm text-red-400 hover:text-red-300 mt-2"
                            >
                                Rimuovi File
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/10 transition-colors">
                                <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-purple-400 transition-colors" />
                            </div>
                            <div>
                                <p className="text-gray-300 font-medium font-lg">Trascina qui il file, oppure clicca per sfogliare</p>
                                <p className="text-gray-500 text-sm mt-2">Supporta Immagini (JPG, PNG), Audio (M4A, MP3, WAV), Video base</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Messages */}
            {status.type !== 'idle' && (
                <div className={`p-4 rounded-[24px] border flex gap-3 ${
                    status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <div>
                      <p className="font-medium">{status.message}</p>
                      {status.data && (
                          <div className="mt-4 p-4 bg-black/40 rounded-[20px] border border-white/5">
                              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-bold">Trascrizione & Analisi Estratta (Vision/Audio API)</p>
                              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{status.data}</p>
                          </div>
                      )}
                    </div>
                </div>
            )}

            {/* Password Input (Security) */}
            <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-purple-300 mb-2">Admin Root Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Inserisci la password di amministrazione..."
                    className="w-full bg-black/40 border border-purple-500/30 rounded-[24px] px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                    disabled={isUploading}
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isUploading || !file || !title || !password}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-[24px] shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
            >
                {isUploading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analisi Sensoriale e Vettorizzazione in corso...</span>
                    </>
                ) : (
                    <>
                        <span>Ingerisci Cavo Dati in Atena</span>
                        <div className="absolute inset-0 h-full w-full opacity-0 group-hover:opacity-20 bg-[linear-gradient(45deg,transparent_25%,white_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_1.5s_infinite]" />
                    </>
                )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

