import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getEmbeddings, generateSynthesizedAnswer, generateTenthManRebuttal, generateLegalIllustration, factCheckResponse } from '@/lib/gemini';
import { searchPerplexity } from '@/lib/perplexity';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { query, sourceFilter, history } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Nessuna query fornita' }, { status: 400 });
    }

    // --- PHASE 7: Log della query utente per il Trend Analyzer (Citizen Guardian) ---
    // Fire-and-forget: non blocchiamo il pipeline per il log
    supabase
      .from('user_queries')
      .insert([{ query: query }])
      .then(({ error: logError }) => {
        if (logError) console.error("Errore durante il salvataggio log query:", logError);
      });

    console.log(`[*] Ricerca Semantica per: "${query}" (Filtro: ${sourceFilter || 'Nessuno'})`);

    const embedding = await getEmbeddings(query);

    // 2. Cercare nel DB Supabase (pgvector) in parallelo alla Ricerca Web (Perplexity)
    let filterCondition = {};
    if (sourceFilter === 'Costituzione') {
        filterCondition = { 'source': 'Costituzione Italiana' };
    } else if (sourceFilter === 'Codice Civile') {
        filterCondition = { 'source': 'Codice Civile Italiano' };
    }

    console.log(`[*] Avvio ricerca parallela (Supabase Vector + Perplexity Web Agent)...`);
    const [supabaseResult, perplexityResult] = await Promise.all([
      supabase.rpc('match_legal_documents', {
        query_embedding: embedding,
        match_threshold: 0.1, 
        match_count: 5,
        filter: filterCondition
      }),
      searchPerplexity(query)
    ]);

    const { data: documents, error } = supabaseResult;

    if (error) {
      console.error('Supabase Vector Search Error:', error);
      return NextResponse.json({ error: 'Errore durante la ricerca nel database legale.' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ response: 'Non ho trovato nessuna corrispondenza legale ufficiale nel database.', sources: [] });
    }

    // 3. Unire il testo dei documenti recuperati (LEXAI Verified) e la Live Web Search (Perplexity)
    let contextText = documents.map(
      (doc: {title: string; source_url: string; content: string}) => `FONTE UFFICIALE DB: ${doc.title} \nURL: ${doc.source_url}\nTESTO:\n${doc.content}\n---`
    ).join('\n');

    if (perplexityResult) {
      contextText += `\n\n=== AGGIORNAMENTI WEB IN TEMPO REALE (Perplexity Sonar API) ===\n${perplexityResult}\n===\n\nISTRUZIONE: Usa SIA il database ufficiale SIA le notizie/sentenze web in tempo reale per formulare la risposta più aggionata. Specifica sempre quando una cosa è legge codificata o quando è una sentenza/news web recente.`;
    }

    // 4. Passare Storico + Contesto Hibrido + Domanda al LLM Generativo (Gemini)
    console.log('[*] Generazione Sintesi AI con memoria storica e contesto ibrido...');
    const conversationHistory = history || [];
    const aiAnswer = await generateSynthesizedAnswer(query, contextText, conversationHistory);

    // 5. Fase 10/13: Protocollo Decimo Uomo, Generazione Immagine e Fact-Check (Eseguiti in Parallelo per non bloccare)
    console.log('[*] Attivazione Protocollo Decimo Uomo, Generazione Illustrazione (Imagen 4) e Fact-Check Engine...');
    
    const imageTopicPrompt = `Concetto legale da illustrare: "${query}"`;
    
    const [tenthManAnswer, legalIllustration, factCheckReport] = await Promise.all([
      generateTenthManRebuttal(query, contextText, aiAnswer),
      generateLegalIllustration(imageTopicPrompt),
      factCheckResponse(query, aiAnswer, contextText)
    ]);

    // 6. Ritornare all'interfaccia UI utente la risposta primaria, il decimo uomo, le fonti citate, news web live, l'immagine e il fact-check
    return NextResponse.json({
      response: aiAnswer,
      contra_analysis: tenthManAnswer,
      sources: documents,
      web_updates: perplexityResult,
      legal_illustration: legalIllustration,
      fact_check: factCheckReport
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message, stack: error.stack }, { status: 500 });
  }
}
