import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-20 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <ShieldCheck className="h-8 w-8 text-red-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500">
            Disclaimer Legale
          </h1>
        </div>
        
        <div className="prose prose-invert prose-red max-w-none">
          <p className="text-slate-400">Avviso Importante</p>
          
          <div className="mt-8 p-6 bg-red-950/30 border border-red-500/30 rounded-[24px]">
            <h2 className="text-xl font-semibold text-red-400 mb-4 mt-0">Nessun Rapporto Avvocato-Cliente</h2>
            <p className="text-slate-200">
              L&apos;utilizzo di Atena, l&apos;invio di quesiti o la generazione di documenti **non** instaura alcun rapporto avvocato-cliente tra l&apos;utente e gli sviluppatori della piattaforma.
            </p>
            <p className="text-slate-300 text-sm mt-4">
              L&apos;IA elabora risposte su base probabilistica partendo da un vasto corpus documentale, ma non possiede la qualifica, l&apos;abilitazione, né la capacità umana di valutare sottigliezze socio-giuridiche irripetibili di un caso specifico in Tribunale.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-white mt-12 mb-4">Consulenza Obbligatoria</h2>
          <p>
            Prima di sottoscrivere qualsiasi atto generato, depositare istanze, avviare o resistere a una lite in sede penale o civile, è un dovere categorico dell&apos;utente farsi revisionare il tutto ed essere rappresentato da un legale iscritto all&apos;albo.
          </p>
        </div>
      </div>
    </div>
  );
}

