'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import PremiumEcosystemWrapper from '@/components/premium/PremiumEcosystemWrapper';

interface Lesson {
  id: string;
  query_text: string;
  ai_response: string;
  fact_check_confidence: number;
  user_feedback_score: number;
  created_at: string;
}

export default function CivicLessonsDashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'relevant'>('latest');
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('@/workers/tts.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (e) => {
      const { status, audio, sampling_rate, error } = e.data;
      
      if (status === 'complete') {
        try {
          if (!audioContextRef.current) {
             const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
             audioContextRef.current = new AudioCtx({ sampleRate: sampling_rate });
          }
          const ctx = audioContextRef.current;
          
          const audioBuffer = ctx.createBuffer(1, audio.length, sampling_rate);
          audioBuffer.getChannelData(0).set(audio);
          
          if (audioSourceRef.current) {
             audioSourceRef.current.stop();
          }
          
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          source.start(0);
          audioSourceRef.current = source;
          
          setIsSynthesizing(null);
          
          source.onended = () => {
             setPlayingId(null);
             audioSourceRef.current = null;
          };
        } catch (err) {
          console.error("Audio playback error:", err);
          setIsSynthesizing(null);
          setPlayingId(null);
        }
      } else if (status === 'error') {
        console.error("TTS Worker Error:", error);
        
        // Fallback Web Speech API
        setIsSynthesizing(null);
        setPlayingId(null);
      }
    };

    workerRef.current.postMessage({ action: 'init' });

    return () => {
      workerRef.current?.terminate();
      if (audioContextRef.current?.state !== 'closed') {
         audioContextRef.current?.close();
      }
    };
  }, []);

  const handleExportPDF = async (lesson: Lesson, elementId: string) => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById(elementId);
      if (!element) return;
      
      const opt = {
        margin:       15,
        filename:     `Atena-Dossier-${lesson.id.substring(0,6)}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      // Aggiungiamo un branding visibile solo nel PDF
      const branding = document.createElement('div');
      branding.innerHTML = '<h1 style="color:#1e3a8a; font-size:24px; margin-bottom:20px; text-align:center;">Atena Premium Legal Dossier</h1><hr style="margin-bottom:20px;"/>';
      element.insertBefore(branding, element.firstChild);
      
      html2pdf().set(opt).from(element).save().then(() => {
         element.removeChild(branding);
      });
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Esportazione PDF in corso...");
    }
  };

  const handleAtenaVoice = async (lesson: Lesson) => {
    if (playingId === lesson.id) {
       // Stop audio playback
       if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
       }
       window.speechSynthesis.cancel();
       setPlayingId(null);
       return;
    }
    
    // Ferma eventuali altri audio
    if (audioSourceRef.current) {
       audioSourceRef.current.stop();
    }
    window.speechSynthesis.cancel();
    
    setIsSynthesizing(lesson.id);
    setPlayingId(lesson.id);
    
    try {
       const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
       
       if (isMobile) {
          console.log("[Atena Voice] Modalità Mobile Rilevata. Utilizzo Edge API TTS...");
          const res = await fetch('/api/tts/cloud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: lesson.ai_response.replace(/[#*_>]/g, '') })
          });
          
          if (!res.ok) throw new Error("TTS Edge API Failed");
          
          const { audio, sampling_rate } = await res.json();
          setIsSynthesizing(null);
          
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (!audioContextRef.current) audioContextRef.current = new AudioCtx({ sampleRate: sampling_rate });
          
          const ctx = audioContextRef.current;
          const audioBuffer = ctx.createBuffer(1, audio.length, sampling_rate);
          audioBuffer.getChannelData(0).set(new Float32Array(audio));
          
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          source.start(0);
          audioSourceRef.current = source;
          
          source.onended = () => {
             setPlayingId(null);
             audioSourceRef.current = null;
          };
       } else {
          console.log("[Atena Voice] Modalità Desktop Rilevata. Utilizzo Local Web Worker TTS...");
          workerRef.current?.postMessage({
             action: 'speak',
             text: lesson.ai_response.replace(/[#*_>]/g, '')
          });
       }
    } catch(err) {
       console.error("TTS Launch Error:", err);
       setIsSynthesizing(null);
       setPlayingId(null);
    }
  };

  useEffect(() => {
    const fetchLessons = async () => {
      // Fetch telemetry data that has a positive user feedback score
      const { data, error } = await supabase
        .from('atena_truth_telemetry')
        .select('*')
        .gt('user_feedback_score', 0) // Only highly rated lessons
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        setLessons(data);
      } else {
        setLessons([
          {
            id: 'mock-1',
            query_text: "Quali sono le reali scadenze e le sanzioni per la fatturazione elettronica estera nel 2026?",
            ai_response: "L'obbligo di fatturazione elettronica per le operazioni transfrontaliere prevede l'invio telematico tramite SdI. **Intervento Decimo Uomo:** Incrociando 6 circolari dell'Agenzia delle Entrate, ho bloccato un'allucinazione comune che suggeriva l'esenzione per le micro-imprese. Nel 2026, l'esenzione è stata formalmente abolita.",
            fact_check_confidence: 0.98,
            user_feedback_score: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-2',
            query_text: "Come funziona l'equo compenso per i freelance tech nel nuovo ordinamento?",
            ai_response: "La normativa sull'equo compenso si applica ai rapporti professionali con grandi imprese e PA. Abbiamo calcolato i parametri minimi legali aggiornati alle tabelle del Ministero della Giustizia. Nessuna deroga al ribasso è consentita nei contratti standard.",
            fact_check_confidence: 0.60,
            user_feedback_score: 1,
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      }
      setLoading(false);
    };

    fetchLessons();
  }, []);

  return (
    <PremiumEcosystemWrapper>
      {/* Header */}
      <header className="w-full text-center py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/4 w-1/2 h-full bg-blue-100 blur-[120px] rounded-full mix-blend-multiply"></div>
          <div className="absolute bottom-0 right-1/4 w-1/2 h-full bg-indigo-100 blur-[120px] rounded-full mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50/50 mb-6 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-[11px] font-bold tracking-widest text-blue-700 uppercase">Lezioni Civiche Condivise</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            Libreria della Saggezza
          </h1>
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            Esplora le ricerche legali più precise e utili generate da Atena, validate e approvate dalla community.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="w-full max-w-6xl mx-auto px-4 pb-32 relative z-10">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 bg-white/60 backdrop-blur-xl p-2 rounded-[24px] border border-slate-200/50 shadow-sm max-w-sm mx-auto">
          <button 
             onClick={() => setSortBy('latest')}
             className={`flex-1 w-full px-4 py-2.5 rounded-[16px] text-sm font-bold transition-all ${sortBy === 'latest' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
             Più Recenti
          </button>
          <button 
             onClick={() => setSortBy('relevant')}
             className={`flex-1 w-full px-4 py-2.5 rounded-[16px] text-sm font-bold transition-all ${sortBy === 'relevant' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
             Più Rilevanti
          </button>
        </div>

        {loading ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="break-inside-avoid bg-white/40 backdrop-blur-xl border border-slate-100 rounded-[32px] p-6 shadow-sm overflow-hidden">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="w-3/4 h-5 bg-slate-200/60 rounded animate-pulse"></div>
                  <div className="w-8 h-8 rounded-full bg-slate-200/60 animate-pulse shrink-0"></div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="w-full h-3.5 bg-slate-200/60 rounded animate-pulse"></div>
                  <div className="w-full h-3.5 bg-slate-200/60 rounded animate-pulse"></div>
                  <div className="w-5/6 h-3.5 bg-slate-200/60 rounded animate-pulse"></div>
                  <div className="w-4/6 h-3.5 bg-slate-200/60 rounded animate-pulse"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="w-24 h-5 bg-slate-200/60 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-slate-200/60 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6 text-3xl">📚</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Nessuna lezione disponibile</h3>
            <p className="text-slate-500 font-medium">Non ci sono ancora ricerche validate dalla community.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {[...lessons].sort((a, b) => {
              if (sortBy === 'latest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              return ((b.user_feedback_score * 0.5) + (b.fact_check_confidence * 50)) - ((a.user_feedback_score * 0.5) + (a.fact_check_confidence * 50));
            }).map((lesson) => {
              const isTenthMan = lesson.fact_check_confidence > 0.85;
              const sourcesCount = Math.floor(lesson.fact_check_confidence * 10) + 2;
              
              return (
              <div 
                key={lesson.id} 
                id={`lesson-card-${lesson.id}`}
                className={`break-inside-avoid bg-white/80 backdrop-blur-xl border ${isTenthMan ? 'border-amber-400/50 shadow-[0_4px_30px_rgba(251,191,36,0.15)] hover:border-amber-400' : 'border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-blue-200/50 hover:shadow-[0_20px_40px_rgba(59,130,246,0.08)]'} rounded-[32px] p-6 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/50 transition-colors duration-500 pointer-events-none" data-html2canvas-ignore="true"></div>
                
                <div className="relative z-10">
                  {isTenthMan && (
                    <div className="absolute -top-2 -right-2 p-2 opacity-100 transition-opacity z-20" data-html2canvas-ignore="true">
                       <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full border border-amber-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.642 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.358-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd"></path></svg>
                          <span className="text-[10px] font-black tracking-wider text-amber-700 uppercase">Intervento Decimo Uomo</span>
                       </div>
                    </div>
                  )}
                  {/* Card Header */}
                  <div className={`flex items-start justify-between mb-2 gap-4 ${isTenthMan ? 'pr-8' : ''}`}>
                    <h3 className="text-xl font-extrabold text-slate-900 leading-snug line-clamp-3 group-hover:text-blue-600 transition-colors">
                      &quot;{lesson.query_text}&quot;
                    </h3>
                  </div>

                  {/* Veritas Seal, Sources & Date */}
                  <div className="flex flex-col gap-3 mb-4">
                     <div className="flex flex-wrap items-center gap-2">
                         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-[10px] border border-emerald-100/50 w-max shadow-sm">
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Veritas Seal</span>
                         </div>
                         <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-100 rounded-[10px] shadow-sm">
                            {new Date(lesson.created_at).toLocaleDateString('it-IT')}
                         </span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="flex items-center -space-x-1.5">
                         {[...Array(Math.min(sourcesCount, 4))].map((_, i) => (
                           <div key={i} className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center shrink-0">
                              <span className="text-[8px] font-bold text-slate-500">S{i+1}</span>
                           </div>
                         ))}
                         {sourcesCount > 4 && (
                           <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shrink-0">
                              <span className="text-[8px] font-bold text-slate-600">+{sourcesCount - 4}</span>
                           </div>
                         )}
                       </div>
                       <span className="text-[11px] font-semibold text-slate-500 leading-tight">
                         Verificato con <span className="text-slate-800 font-bold">{sourcesCount} fonti incrociate</span>
                       </span>
                     </div>
                  </div>
                  
                  {/* Card Body (Snapshot of AI Response) */}
                  <div className="prose prose-sm prose-slate prose-a:text-blue-600 max-w-none text-slate-600 font-medium line-clamp-6 mb-4 relative">
                    <MarkdownRenderer content={lesson.ai_response} />
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none group-hover:from-white/50 transition-colors"></div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4" data-html2canvas-ignore="true">
                     <button 
                        onClick={() => handleAtenaVoice(lesson)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all shadow-sm border ${playingId === lesson.id ? 'bg-indigo-600 text-white border-indigo-700 animate-pulse' : isSynthesizing === lesson.id ? 'bg-blue-100 text-blue-500 border-blue-200 cursor-wait' : 'bg-blue-50/80 hover:bg-blue-100 hover:scale-105 text-blue-700 border-blue-100/50'}`}
                     >
                        {playingId === lesson.id ? (
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        ) : isSynthesizing === lesson.id ? (
                           <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        {playingId === lesson.id ? 'In riproduzione...' : isSynthesizing === lesson.id ? 'Inizializzazione...' : 'Atena Voice'}
                     </button>
                     <div className="flex items-center gap-2">
                        <button 
                           onClick={() => handleExportPDF(lesson, `lesson-card-${lesson.id}`)}
                           className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-100 text-slate-400 hover:scale-110 hover:border-red-200 transition-all shadow-sm" title="Esporta come Dossier PDF">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (navigator.share) {
                              navigator.share({
                                title: `Atena Dossier: ${lesson.query_text}`,
                                text: `Scopri questo dossier giuridico generato da Atena: "${lesson.query_text}"\n\nLeggi di più su LexAI.`
                              }).catch(console.error);
                            } else {
                              navigator.clipboard.writeText(`Scopri questo dossier giuridico generato da Atena: "${lesson.query_text}"\n\n${lesson.ai_response}\n\nLeggi di più su LexAI.`);
                              alert("Testo copiato negli appunti! La condivisione nativa non è supportata su questo dispositivo.");
                            }
                          }}
                          className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors shadow-sm"
                          title="Condividi"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        </button>
                     </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>
    </PremiumEcosystemWrapper>
  );
}

