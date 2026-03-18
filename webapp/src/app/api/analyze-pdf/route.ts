import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getEmbeddings, generateLegalIllustration, factCheckResponse } from '@/lib/gemini';
import { rerankDocuments } from '@/lib/groq';
import { AtenaSearchAgent } from '@/lib/agents/AtenaSearchAgent';
import { PicoClawAgent } from '@/lib/agents/PicoClawAgent';
import { TenthManAgent, TenthManInput } from '@/lib/agents/TenthManAgent';
import { LiveWebAgent, LiveWebInput } from '@/lib/agents/LiveWebAgent';
// Use require for pdf-parse to avoid Next.js ESM/Turbopack default export issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const draftingMode = formData.get('draftingMode') === 'true';
    const historyStr = formData.get('history');
    
    let history = [];
    if (historyStr && typeof historyStr === 'string') {
       history = JSON.parse(historyStr);
    }

    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    // 1. Leggere e parsare il PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const pdfText = pdfData.text.replace(/\s+/g, ' ').substring(0, 15000); // Limit length

    console.log(`[*] PDF Caricato: ${file.name} | Lunghezza estratto: ${pdfText.length} car.`);

    // 2. Creare una query di ricerca dal PDF
    const extractionQuery = `I need to analyze this legal document. Find the most relevant constitutional, civil, and penal laws regarding the topics covered in this document excerpt: ${pdfText.substring(0, 2000)}`;
    const embedding = await getEmbeddings(extractionQuery);

    console.log(`[*] Ricerca norme collegate al documento privato...`);
    const [supabaseResult, perplexityResult] = await Promise.all([
      supabase.rpc('match_legal_documents', {
        query_embedding: embedding,
        match_threshold: 0.1, 
        match_count: 5,
        filter: {}
      }),
      new LiveWebAgent().execute({ 
        query: `Analisi legale stringente, sentenze recenti e riferimenti giurisprudenziali.`, 
        baseThesis: `Tema trattato nell'estratto del documento: ${pdfText.substring(0, 500)}` 
      } as LiveWebInput).then((res) => res.data as string | null)
    ]);

    const { data: documents, error } = supabaseResult;
    if (error) {
      console.error('Supabase Vector Search Error:', error);
      return NextResponse.json({ error: 'Errore durante la ricerca nel database legale.' }, { status: 500 });
    }

    let rankedDocs = documents || [];
    try {
      if (rankedDocs.length > 0) {
        rankedDocs = await rerankDocuments(extractionQuery, rankedDocs);
      }
    } catch {
      // fallback
    }

    let contextText = rankedDocs.map(
      (doc: { title: string; source_url: string; content: string }) => `FONTE UFFICIALE DB: ${doc.title} \nURL: ${doc.source_url}\nTESTO:\n${doc.content}\n---`
    ).join('\n');

    if (perplexityResult) {
      contextText += `\n\n=== AGGIORNAMENTI WEB IN TEMPO REALE ===\n${perplexityResult}\n===\n`;
    }

    // 3. Istruzione specifica per l'analisi del documento
    const analysisQuery = `
      DOCUMENTO PRIVATO CARICATO DALL'UTENTE (Nome: ${file.name}):
      """
      ${pdfText}
      """

      OBIETTIVO:
      L'utente ha caricato questo documento per un'analisi legale approfondita incrociata con il database normativo.
      Usa le FONTI UFFICIALI e le sentenze dal WEB fornite nel CONTESTO per:
      1. Rilevare clausole chiave, anomalie, nullità o aspetti legali rilevanti secondo le norme del Codice Civile o Penale.
      2. Inserire i riferimenti di legge citati nei documenti di Contesto se si applicano ai paragrafi del PDF.
      3. Fornire una sintesi formale ed elegante, suddivisa per punti salienti.
    `;

    console.log('[*] Generazione Analisi RAG per il PDF...');
    let aiAnswer = "";
    if (draftingMode) {
      const picoClaw = new PicoClawAgent();
      const res = await picoClaw.execute({ query: analysisQuery, context: { history, documents: contextText } });
      aiAnswer = res.data as string;
    } else {
      const atenaSearch = new AtenaSearchAgent();
      const res = await atenaSearch.execute({ query: analysisQuery, context: { history, documents: contextText } });
      aiAnswer = res.data as string;
    }

    const imageTopicPrompt = `Analisi documentale: ${file.name}`;
    
    // 4. Protocollo Decimo Uomo & Fact Checking
    const tenthManAgent = new TenthManAgent();
    const [tenthManOutput, legalIllustration, factCheckReport] = await Promise.all([
      draftingMode 
        ? Promise.resolve({ data: "*(Il Protocollo Decimo Uomo è disattivato in modalità Drafting. Rivedere attentamente il documento generato).*" }) 
        : tenthManAgent.execute({ query: analysisQuery, context: { documents: contextText }, originalAnswer: aiAnswer } as TenthManInput),
      generateLegalIllustration(imageTopicPrompt),
      draftingMode 
        ? Promise.resolve({ classification: "verified", justification: "Modalità Drafting (Stesura) attiva." })
        : factCheckResponse(analysisQuery, aiAnswer, contextText)
    ]);
    const tenthManAnswer = tenthManOutput.data as string;

    return NextResponse.json({
      response: aiAnswer,
      contra_analysis: tenthManAnswer,
      sources: rankedDocs,
      web_updates: perplexityResult,
      legal_illustration: legalIllustration,
      fact_check: factCheckReport
    });

  } catch (error: unknown) {
    console.error('API Analyze PDF Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Errore interno (PDF processing failure)', details: errMessage }, { status: 500 });
  }
}
