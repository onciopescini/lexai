import React from 'react';
import { Scale } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#fbfbfd] text-slate-800 py-20 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Scale className="h-8 w-8 text-amber-600" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
            Terms of Service
          </h1>
        </div>
        
        <div className="prose prose-slate max-w-none bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-8 sm:p-12 shadow-sm">
          <p className="text-slate-500 font-medium">Ultimo aggiornamento: 15 Marzo 2026</p>
          
          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">1. Natura del Servizio</h2>
          <p className="text-slate-700 leading-relaxed">
            Atena AI Legal Systems (la &quot;Piattaforma&quot;) è uno strumento software avanzato potenziato dall&apos;Intelligenza Artificiale, sviluppato per fungere da supporto cognitivo e gestionale per i professionisti del diritto italiano ed europeo, e non solo. La piattaforma viene fornita all&apos;utente nello stato di fatto e di diritto in cui si trova (&quot;as-is&quot;).
          </p>

          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">2. Esclusione Critica di Consulenza Legale</h2>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 my-6">
            <p className="text-red-800 font-semibold mb-2">
              L&apos;utente riconosce e accetta inconfutabilmente che Atena non è un avvocato e non opera come studio legale.
            </p>
            <p className="text-red-700/90 text-sm">
              Nessun output, risposta, riassunto, documento generato o estratto fornito da Atena costituisce né può essere validamente interpretato come consulenza, parere o raccomandazione legale volta a sostituire l&apos;opera intellettuale inderogabile di un professionista abilitato (avvocato) iscritto al relativo Albo Professionale. Le informazioni erogate hanno scopo informativo, analitico ed esplorativo. Le responsabilità per le azioni legali intraprese o per la documentazione depositata o utilizzata rimangono interamente in capo all&apos;utente, sollevando integralmente la Piattaforma.
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">3. Limitazioni Totali di Responsabilità Estesa</h2>
          <p className="text-slate-700 leading-relaxed">
            Nella misura massima consentita dalla legge vigente in materia civile e penale, Atena AI Legal Systems, le agenzie madri, i partner, gli ingegneri e i fornitori di foundation model associati, DECLINANO e REPUDIANO integralmente qualsiasi responsabilità concernente:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-700">
            <li>Danni diretti, indiretti, contingenti o consequenziali derivanti da azioni basate in tutto o in parte sul sistema.</li>
            <li>Errori, inesattezze giuridiche, richiami di norme abrogate o interpretazioni fallaci del modello (cc.dd. &quot;Allucinazioni Algoritmiche&quot;).</li>
            <li>Mancati incassi, pregiudizio d&apos;opera, o sconfitte giudiziali derivanti da documenti bozzati parzialmente tramite le architetture Atena.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-slate-900 mt-8 mb-4">4. Destinazione d&apos;Uso e Restrizioni Operative</h2>
          <p className="text-slate-700 leading-relaxed">
            I servizi dell&apos;Ecosistema Premium (Library, Guardian, Civic Lessons) così come la Workspace centrale sono accessibili previo possesso di un Piano in abbonamento abilitato. Qualsiasi abuso è severamente vietato. È fatto assoluto divieto all&apos;utente di:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-700">
            <li>Inibire infrastrutturalmente la Piattaforma ricorrendo ad attacchi coordinati (DoS, DdoS) limitando il fair use.</li>
            <li>Adoperare la Piattaforma per automatizzare o concorrere consapevolmente alla finalizzazione di attività dolose, truffaldine o illecite.</li>
            <li>Effettuare il reverse-engineering o il jailbreaking strutturale delle protezioni di RLHF e di sicurezza delle chain di Atena.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
