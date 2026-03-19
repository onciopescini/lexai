import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#fbfbfd] text-slate-800 py-20 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <ShieldAlert className="h-8 w-8 text-rose-600" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-600">
            Disclaimer e Manleva Assoluta
          </h1>
        </div>
        
        <div className="prose prose-slate max-w-none bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-8 sm:p-12 shadow-sm">
          <p className="text-slate-500 font-medium tracking-wide">CAVEAT EMPTOR - AVVERTENZE IRRITRATTABILI SULL&apos;UTILIZZO DELLA PIATTAFORMA</p>
          
          <div className="mt-8 p-8 bg-red-50 border border-red-200 rounded-3xl">
            <h2 className="text-2xl font-bold text-red-800 mb-4 mt-0 uppercase tracking-tight">Esclusione Radicale del Rapporto Avvocato-Cliente</h2>
            <p className="text-red-900 leading-relaxed font-semibold">
              Atena AI Legal Systems è un fornitore di innovazioni tecnologiche SaaS e NON uno Studio Legale registrato, associazione professionale, né un&apos;agenzia governativa.
            </p>
            <p className="text-red-800 leading-relaxed mt-4">
              L&apos;impiego di Atena, l&apos;abbonamento ai profili Premium, la generazione documentale, l&apos;accesso a Guardian Radar o le consultazioni in chat <strong>non comportano, causano, o implicano in qualsivoglia forma e condizione l&apos;instaurazione di un vincolo o rapporto protetto avvocato-cliente</strong> tra Lei e la Compagnia fornitrice o i suoi soci detentori. Il segreto professionale tipico forense non risulta in alcun modo legalmente esteso a tale rapporto software-utente.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 mt-12 mb-4">La Natura Predittiva e la Possibilità di &quot;Allucinazioni&quot; (LLM Hallucinations)</h2>
          <p className="text-slate-700 leading-relaxed">
            Atena si fonda su architetture algoritmiche LLM autogenerative capaci di calcolo probabilistico avanzato, le quali non possiedono comprensione logica organica umana e tantomeno le prerogative decisionali ed empatico-deduttive del Giudicante o dell&apos;Esperto del Diritto iscritto all&apos;Albo. Esiste un rischio costante ed empirico che l&apos;IA citi <strong>leggi abrogate, sentenze di Cassazione inesistenti o dottrina giuridica fallace</strong>. Lei accetta categoricamente che il software possa essere erroneo in ambiti legali complessi in cui le sfumature e i contesti non detti dettino invero lo strappo alla regola consuetudinaria.  
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-12 mb-4">Mandato Inattaccabile di Consulenza Obbligatoria ed Esegesi Umana</h2>
          <p className="text-slate-700 leading-relaxed">
            È imposta qual condizione sine qua non dell&apos;uso della presente Piattaforma e di tutti i suoi servizi (Library, Workspace, Guardian Radar) che: <strong>prima di prendere iniziative pregiudizievoli, siglare contratti redatti a base dell&apos;IA, rinegoziare rapporti, impugnare statuti, sporgere denunzie formali, o avviare contenziosi giudiziali civili, amministrativi o penali, Lei ha l&apos;inderogabile dovere intellettuale e obbligo giuridico di far validare ogni assunzione ed elaborato di Atena ad un Consulente Legale in carne ed ossa regolarmente iscritto all&apos;Ordine Degli Avvocati</strong>, il quale vaglierà insindacabilmente il da farsi.  
          </p>

          <div className="mt-12 p-6 bg-slate-900 text-slate-200 rounded-2xl">
            <p className="font-semibold">
              In assenza di tale preventiva esegesi professionale, Atena si dichiara aprioristicamente del tutto manlevata e liberata stragiudizialmente da ogni pregiudizio cagionato all&apos;utente in via extracontrattuale, contrattuale diretta o d&apos;immagine recato a sé o a terzi.  
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
