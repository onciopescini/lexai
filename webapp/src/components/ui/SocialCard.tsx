'use client';

import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import Image from 'next/image';

interface SocialCardProps {
  content: string;
  sourceTitle?: string;
  onClose: () => void;
}

export default function SocialCard({ content, sourceTitle, onClose }: SocialCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<'story' | 'post'>('story');

  const handleGenerateImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    
    try {
      // Per una migliore risoluzione, moltiplichiamo il pixel ratio
      const dataUrl = await htmlToImage.toJpeg(cardRef.current, { 
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#fbfbfd' // Sfondo di base nel caso ci siano trasparenze
      });
      setDownloadUrl(dataUrl);
    } catch (err) {
      console.error('Errore durante la generazione dell\'immagine:', err);
      alert('Impossibile generare l\'immagine.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* --- Editor / Previal Panel --- */}
        <div className="flex-1 p-8 bg-slate-50 border-r border-slate-100 flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Atena Snapshot</h2>
          <p className="text-sm text-slate-500 mb-8">Genera una card visiva pronta per essere condivisa sui social network.</p>
          
          <div className="flex gap-2 mb-6 p-1 bg-slate-200/50 rounded-xl w-max">
            <button 
              onClick={() => setFormat('story')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${format === 'story' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Story (9:16)
            </button>
            <button 
              onClick={() => setFormat('post')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${format === 'post' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Post (1:1)
            </button>
          </div>

          <div className="space-y-4 flex-1">
             {!downloadUrl ? (
                <button 
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      Generazione in corso...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Crea Immagine ad Alta Risoluzione
                    </>
                  )}
                </button>
             ) : (
                <div className="flex flex-col gap-3">
                  <a 
                    href={downloadUrl}
                    download={`atena-snapshot-${Date.now()}.jpg`}
                    className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Scarica Immagine (JPG)
                  </a>
                  <button 
                    onClick={() => setDownloadUrl(null)}
                    className="w-full py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-all"
                  >
                    Modifica formato
                  </button>
                </div>
             )}
          </div>
        </div>

        {/* --- Card Preview Area --- */}
        <div className="flex-1 bg-slate-200/50 flex items-center justify-center p-8 overflow-y-auto">
          {/* Sizing Container based on aspect ratio */}
          <div 
             className={`transition-all duration-500 origin-center scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-95 ${format === 'story' ? 'w-[400px] h-[711px]' : 'w-[500px] h-[500px]'}`}
          >
             {/* THE ACTUAL DOM ELEMENT TO BE RENDERED TO IMAGE */}
             <div 
                ref={cardRef} 
                className="w-full h-full bg-white relative overflow-hidden flex flex-col p-10 font-sans"
                style={{
                  backgroundImage: "radial-gradient(circle at top right, rgba(59, 130, 246, 0.08) 0%, transparent 60%), radial-gradient(circle at bottom left, rgba(79, 70, 229, 0.05) 0%, transparent 50%)"
                }}
             >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('/images/atena-pattern-bg.png')", backgroundSize: "150px" }}></div>

                {/* Header */}
                <div className="flex items-center gap-3 mb-8 z-10 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Image src="/images/atena-text-logo.png" alt="Atena" width={30} height={10} className="brightness-0 invert object-contain" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-slate-900 leading-none">Atena.</h1>
                    <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Intelligenza Giuridica</p>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col justify-center z-10">
                  <div className="relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-transparent rounded-full opacity-50"></div>
                    <div className="text-2xl font-bold text-slate-800 leading-tight whitespace-pre-wrap">
                      {content}
                    </div>
                  </div>
                </div>

                {/* Footer / Meta Area */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-end justify-between z-10 shrink-0 opacity-80">
                  <div className="flex flex-col gap-1 max-w-[70%]">
                    {sourceTitle && (
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        <span className="truncate">{sourceTitle}</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">Generato da IA. Nessun valore legale certificato.</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                     {/* Placeholder for a QR code - in a real app, generate this dynamically */}
                     <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center">
                       <svg className="w-full h-full text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                     </div>
                     <span className="text-[9px] font-bold text-slate-400 tracking-wider">LEXAI.IT</span>
                  </div>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
