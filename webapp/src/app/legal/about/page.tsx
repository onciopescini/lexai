import React from 'react';
import { FileText } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-20 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <FileText className="h-8 w-8 text-purple-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Il Progetto Atena
          </h1>
        </div>
        
        <div className="prose prose-invert prose-purple max-w-none">
          <p className="text-lg text-slate-300 leading-relaxed">
            Atena non è un semplice &quot;chatbot&quot;. È un motore di intelligenza artificiale orchestrato per scalare l&apos;assimilazione di tutto il codice legislativo italiano ed europeo.
          </p>
          
          <h2 className="text-xl font-semibold text-white mt-12 mb-4">La Nostra Missione</h2>
          <p>
            Siamo nati con un solo scopo: rendere la conoscenza giuridica inequivocabile, chirurgica e accessibile, distruggendo l&apos;asimmetria informativa formale. Tramite workflow iterativi &quot;LangGraph&quot; e meccanismi di fact-checking spietati (&quot;Protocollo Data-Clash&quot;), Atena non produce sentenze, produce **certezze analitiche**.
          </p>

          <div className="my-10 p-6 bg-slate-900/50 border border-purple-500/20 rounded-[24px]">
            <h3 className="text-lg font-medium text-purple-300 mb-2">L&apos;Architettura Omnisciente</h3>
            <p className="text-sm text-slate-400">
              Atena unisce vettori HNSW ad alta dimensionalità (768d) con la potenza logica di LangChain. Se non sa una cosa, esplora la Gazzetta Ufficiale via Perplexity. Se allucina una legge, il suo &quot;Check Validator&quot; auto-distrugge la risposta e forza un nuovo ciclo logico prima di mostrartela.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-white mt-12 mb-4">Crediti</h2>
          <p>
            Progettata e sviluppata per spingere al limite i paradigmi Agentic AI. Powered by Next.js, FastAPI, Supabase, Google Gemini e Perplexity Sonar.
          </p>
        </div>
      </div>
    </div>
  );
}

