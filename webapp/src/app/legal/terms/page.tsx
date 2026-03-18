import React from 'react';
import { Scale } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-20 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Scale className="h-8 w-8 text-amber-500" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">
            Terms of Service
          </h1>
        </div>
        
        <div className="prose prose-invert prose-amber max-w-none">
          <p className="text-slate-400">Ultimo aggiornamento: 15 Marzo 2026</p>
          
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Natura Sperimentale del Servizio</h2>
          <p>
            Atena (la &quot;Piattaforma&quot;) è uno strumento basato su Intelligenza Artificiale progettato per assistere la navigazione di testi normativi italiani ed europei. Il servizio è fornito &quot;così com&apos;è&quot; in fase sperimentale.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Nessuna Consulenza Legale</h2>
          <p className="font-semibold text-red-400">
            Nessun output prodotto da Atena costituisce, né deve essere interpretato, come parere o consulenza legale professionale.
          </p>
          <p>
            Le informazioni fornite non si sostituiscono mai all&apos;assistenza di un avvocato abilitato. L&apos;utente si assume la totale e completa responsabilità per qualsiasi decisione o azione presa basandosi sui contenuti generati da Atena o sui documenti draftati dal servizio.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Limitazione di Responsabilità</h2>
          <p>
            Avena AI Legal Systems, gli sviluppatori associati, e i provider dei modelli sfruttati declinano ogni responsabilità per eventuali malfunzionamenti, inesattezze (comprese allucinazioni tipiche degli LLMs), o interpretazioni fallaci derivanti dall&apos;uso del sistema, nei limiti massimi consentiti dalla legge applicabile.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Obblighi dell&apos;Utente</h2>
          <p>
            L&apos;utente non deve usare la piattaforma per:
            <ul className="list-disc pl-6 mt-2 space-y-1 text-slate-300">
              <li>Formulare domande per incoraggiare e pianificare atti illeciti o violazioni di legge.</li>
              <li>Inserire dati altamente confidenziali propri o di terzi non in accordo col Trattamento Dati.</li>
              <li>Saturare l&apos;infrastruttura provocando Denial of Service alle API interne.</li>
            </ul>
          </p>
        </div>
      </div>
    </div>
  );
}
