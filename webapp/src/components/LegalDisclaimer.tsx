'use client';

import { useState, useEffect } from 'react';

export default function LegalDisclaimer() {
  const [visible, setVisible] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('lexai_disclaimer_accepted');
    if (!dismissed) {
      setBannerDismissed(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('lexai_disclaimer_accepted', 'true');
    setBannerDismissed(true);
  };

  return (
    <>
      {/* Sticky Legal Banner (GDPR-style, shows once until accepted) */}
      {!bannerDismissed && (
        <div className="fixed bottom-0 left-0 w-full z-[9999] animate-fade-in-up">
          <div className="bg-gradient-to-r from-[#0a0a0b] to-[#111113] border-t border-amber-500/30 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-xl mt-0.5">⚖️</span>
                <p className="text-sm text-white/70 leading-relaxed">
                  <strong className="text-amber-400">Avviso Legale Importante:</strong> Atena è uno strumento di ricerca basato su Intelligenza Artificiale. 
                  <strong className="text-white/90"> Non fornisce consulenza legale vincolante</strong> e non sostituisce un avvocato iscritto all&apos;albo. 
                  I risultati sono a scopo informativo e di ricerca.{' '}
                  <button 
                    onClick={() => setVisible(true)}
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    Leggi il disclaimer completo
                  </button>
                </p>
              </div>
              <button 
                onClick={handleAccept}
                className="shrink-0 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/30 active:scale-95"
              >
                Ho compreso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Legal Disclaimer Modal */}
      {visible && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-up" onClick={() => setVisible(false)}>
          <div className="bg-[#111113] border border-white/10 rounded-3xl max-w-2xl w-[95%] max-h-[80vh] overflow-y-auto shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">⚖️</span>
              <h2 className="text-xl font-bold text-white">Disclaimer Legale — Atena</h2>
            </div>
            
            <div className="space-y-4 text-sm text-white/70 leading-relaxed">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/15">
                <p className="font-semibold text-amber-400 mb-2">📌 Avvertenza Fondamentale</p>
                <p>Atena è una piattaforma tecnologica di <strong className="text-white/90">ricerca e analisi giuridica assistita dall&apos;Intelligenza Artificiale</strong>. 
                Il servizio NON costituisce attività di consulenza legale, patrocinio, assistenza giudiziale o stragiudiziale ai sensi della Legge n. 247/2012 (Ordinamento della professione forense).</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="font-semibold text-white/90 mb-2">🤖 Natura delle Risposte IA</p>
                <p>Le risposte generate da Atena sono prodotte tramite modelli di linguaggio (LLM) e sistemi di ricerca vettoriale. Questi strumenti possono contenere <strong className="text-white/90">imprecisioni, errori o informazioni non aggiornate</strong>. 
                L&apos;utente è tenuto a verificare autonomamente ogni informazione prima di fare affidamento su di essa per decisioni legali.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="font-semibold text-white/90 mb-2">👨‍⚖️ Consulenza Professionale</p>
                <p>Per qualsiasi questione legale effettiva, si raccomanda vivamente di <strong className="text-white/90">rivolgersi a un avvocato iscritto all&apos;albo professionale</strong>. 
                Atena non si assume alcuna responsabilità per danni diretti o indiretti derivanti dall&apos;uso improprio delle informazioni fornite dalla piattaforma.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="font-semibold text-white/90 mb-2">🔒 Privacy e Dati</p>
                <p>Le query inserite dall&apos;utente vengono elaborate in tempo reale e possono essere registrate in forma anonima a fini di miglioramento del servizio, 
                nel rispetto del <strong className="text-white/90">GDPR (Regolamento UE 2016/679)</strong>. Nessun dato personale identificativo viene raccolto senza esplicito consenso.</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/15">
                <p className="font-semibold text-blue-400 mb-2">📜 Base Giuridica</p>
                <p>Ai sensi dell&apos;Art. 2229 c.c. e della L. 247/2012, l&apos;esercizio della professione forense è riservato agli iscritti all&apos;albo. 
                Atena opera esclusivamente come <strong className="text-white/90">strumento tecnologico di supporto alla ricerca</strong>, conformemente all&apos;AI Act europeo (Regolamento UE 2024/1689).</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setVisible(false)}
                className="px-6 py-2.5 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Legal Footer (Always visible in page footer) */}
      <footer className="w-full border-t border-white/5 bg-[#050505]/90 backdrop-blur-md py-6 px-4 z-40 relative">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-white/30">
            <span>© {new Date().getFullYear()} Atena — AI Legal Intelligence Platform</span>
            <button onClick={() => setVisible(true)} className="hover:text-white/60 transition-colors underline">
              Disclaimer Legale
            </button>
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Cookie Policy</a>
          </div>
          <p className="text-[10px] text-white/20 text-center md:text-right max-w-sm">
            Atena non fornisce consulenza legale. Consultare un avvocato per ogni decisione giuridica.
          </p>
        </div>
      </footer>
    </>
  );
}
