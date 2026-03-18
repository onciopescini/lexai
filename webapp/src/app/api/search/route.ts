import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getEmbeddings, generateLegalIllustration, factCheckResponse } from '@/lib/gemini';
import { rerankDocuments } from '@/lib/groq';
import { RouterAgent } from '@/lib/agents/RouterAgent';
import { AtenaSearchAgent } from '@/lib/agents/AtenaSearchAgent';
import { PicoClawAgent } from '@/lib/agents/PicoClawAgent';
import { TenthManAgent, TenthManInput } from '@/lib/agents/TenthManAgent';
import { LiveWebAgent, LiveWebInput } from '@/lib/agents/LiveWebAgent';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Consenti fino a 60 secondi per l'esecuzione del pipeline RAG complesso su Vercel

// Semplice Rate Limiter in-memory (per istanza serverless) per prevenire abusi base
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    // Estrazione IP per Rate Limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'anonymous';
    
    if (!checkRateLimit(ip)) {
      console.warn(`[RATE LIMIT] Richiesta bloccata per l'IP: ${ip}`);
      return NextResponse.json({ error: 'Troppe richieste. Riprova tra un minuto.' }, { status: 429 });
    }

    const { query, sourceFilter, history, draftingMode } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Nessuna query fornita' }, { status: 400 });
    }

    // --- PHASE 7: Log della query utente per il Trend Analyzer (Citizen Guardian) ---
    supabaseAdmin
      .from('user_queries')
      .insert([{ query: query }])
      .then(({ error: logError }) => {
        if (logError) console.error("Errore durante il salvataggio log query:", logError);
      });

    console.log(`[*] Ricerca Semantica per: "${query}" (Filtro: ${sourceFilter || 'Nessuno'})`);

    // --- PHASE 14: Agentic RAG Router ---
    console.log(`[*] Esecuzione Agentic Router per classificazione intento...`);
    const routerAgent = new RouterAgent();
    const routerOutput = await routerAgent.execute({ query });
    const { intent, confidence } = routerOutput.data as { intent: string, confidence: number };
    console.log(`[*] Intento Rilevato: ${intent.toUpperCase()} (Sicurezza: ${Math.round(confidence * 100)}%)`);

    if (intent === 'general_chat') {
      return NextResponse.json({ 
        response: `Ciao! Sono Atena, il tuo assistente legale AI. Posso aiutarti a ricercare leggi nel database ufficiale, redigere contratti, o analizzare casi giuridici. Come posso esserti utile oggi?`,
        sources: [] 
      });
    }

    if (intent === 'history') {
      return NextResponse.json({ 
        response: `Hai chiesto informazioni storiche o confronti tra vecchie versioni di una legge. Ti invito a utilizzare lo strumento avanzato "Libreria e Storico" che ti permette di visualizzare il "Diff" esatto (le parole aggiunte o rimosse) tra le varie edizioni storiche del codice. Dimmi se vuoi che cerchi comunque il testo attualmente in vigore.`,
        sources: [] 
      });
    }

    const effectiveDraftingMode = draftingMode || intent === 'drafting';
    if (effectiveDraftingMode) {
      console.log(`[*] Modalità Drafting (Redazione) attivata dal Router o dall'Utente.`);
    }

    const embedding = await getEmbeddings(query);

    let filterCondition = {};
    if (sourceFilter && sourceFilter !== 'Tutte le Fonti') {
        filterCondition = { 'source': sourceFilter };
    }

    // 1. Cercare prima solo nel database e agent memories
    console.log(`[*] Avvio ricerca database (Supabase Hybrid + Agent Memories)...`);
    const [supabaseResult, memoryResult] = await Promise.all([
      supabaseAdmin.rpc('hybrid_search_legal_docs', {
        query_embedding: embedding,
        query_text: query,
        filter: filterCondition,
        match_count: 5,
        full_text_weight: 1.0,
        semantic_weight: 1.0
      }),
      supabaseAdmin.rpc('match_agent_memories', {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: 3
      })
    ]);

    const { data: documents, error } = supabaseResult;

    if (error) {
      console.error('Supabase Vector Search Error:', error);
      return NextResponse.json({ error: 'Errore durante la ricerca nel database legale.' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ response: 'Non ho trovato nessuna corrispondenza legale ufficiale nel database.', sources: [] });
    }

    // 2. Semantic Reranking via Groq
    let rankedDocs = documents;
    try {
      rankedDocs = await rerankDocuments(query, documents);
      console.log('[*] Groq reranking completato.');
    } catch {
      console.log('[*] Reranking skipped (Groq unavailable), using vector similarity order.');
    }

    const contextText = rankedDocs.map(
      (doc: {title: string; source_url: string; content: string}) => `FONTE UFFICIALE DB: ${doc.title} \nURL: ${doc.source_url}\nTESTO:\n${doc.content}\n---`
    ).join('\n');

    let agentMemoriesText = "";
    if (memoryResult && memoryResult.data && memoryResult.data.length > 0) {
      agentMemoriesText = memoryResult.data.map((m: { memory_text: string }) => `- ${m.memory_text}`).join('\n');
    }

    // 3. Generare la Base Thesis (Primary AI) usando SOLO fonti interne
    console.log('[*] Generazione Tesi Base AI (Internal Knowledge Only)...');
    const conversationHistory = history || [];
    let baseThesis = "";
    
    if (effectiveDraftingMode) {
      const draftingAgent = new PicoClawAgent();
      const draftOutput = await draftingAgent.execute({ 
        query, 
        context: { history: conversationHistory, documents: contextText, systemMemories: agentMemoriesText } 
      });
      baseThesis = draftOutput.data as string;
    } else {
      const searchAgent = new AtenaSearchAgent();
      const searchOutput = await searchAgent.execute({ 
        query, 
        context: { history: conversationHistory, documents: contextText, systemMemories: agentMemoriesText } 
      });
      baseThesis = searchOutput.data as string;
    }

    // 4. DATA-CLASH PROTOCOL (Se non siamo in drafting)
    let perplexityValidation = null;
    let tenthManAnswer = "*(Il Protocollo Decimo Uomo è disattivato in modalità Drafting. Rivedere attentamente prima dell'uso).*";
    let factCheckReport = null;

    console.log('[*] Avvio Operazioni Parallele (Data-Clash, Imagen 4, Fact-Check Engine)...');
    const imageTopicPrompt = `Concetto legale da illustrare: "${query}"`;
    
    // Generiamo l'immagine in parallelo a prescindere dal routing
    const legalIllustrationPromise = generateLegalIllustration(imageTopicPrompt);

    if (!effectiveDraftingMode) {
      // 4a. Perplexity esegue l'adversarial web check contro la tesi base
      console.log('[*] Esecuzione Perplexity Data-Clash contro la Tesi Base...');
      const liveWebAgent = new LiveWebAgent();
      const webOutput = await liveWebAgent.execute({ query, baseThesis } as LiveWebInput);
      perplexityValidation = webOutput.data as string;
      
      const tenthManContext = `CONTESTO UFFICIALE DB:\n${contextText}\n\n=== CONTRO-ANALISI WEB (PERPLEXITY DATA-CLASH) ===\n${perplexityValidation || "Nessun aggiornamento web."}`;
      
      // 4b. Il Decimo Uomo valuta sia il DB sia l'attacco di Perplexity
      console.log('[*] Esecuzione Protocollo Decimo Uomo...');
      
      const tenthManAgent = new TenthManAgent();
      const tenthManOutputPromise = tenthManAgent.execute({ 
        query, 
        context: { documents: tenthManContext }, 
        originalAnswer: baseThesis 
      } as TenthManInput);
      
      const [tenthManOutput, factCheckRes] = await Promise.all([
        tenthManOutputPromise,
        factCheckResponse(query, baseThesis, contextText)
      ]);
      
      tenthManAnswer = tenthManOutput.data as string;
      factCheckReport = factCheckRes;
    } else {
      // Drafting mode
      factCheckReport = { classification: "verified", justification: "Modalità Drafting (Stesura) attiva dal router. Modulo Fact-Check automatizzato bypassato." };
    }

    const legalIllustration = await legalIllustrationPromise;

    // Salvataggio della sessione in DB
    supabaseAdmin.from('chat_sessions').insert([{ 
      session_id: 'default_user', 
      user_query: query, 
      ai_response: baseThesis 
    }]).then(({ error: sessionError }) => {
      if (sessionError) console.error("Errore salvataggio sessione di chat:", sessionError);
    });

    supabaseAdmin.from('atena_truth_telemetry').insert([{
      session_id: 'default_user',
      query_text: query,
      tenth_man_triggered: !effectiveDraftingMode,
      primary_ai_model: 'gemini-2.5-flash',
      sources_count: rankedDocs ? rankedDocs.length : 0
    }]).then(({ error: telemetryError }) => {
      if (telemetryError) console.error("Errore salvataggio Telemetria della Verità:", telemetryError);
    });

    // 5. Ritornare all'interfaccia UI utente
    return NextResponse.json({
      response: baseThesis,
      contra_analysis: tenthManAnswer,
      sources: rankedDocs,
      web_updates: perplexityValidation,
      legal_illustration: legalIllustration,
      fact_check: factCheckReport
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errMessage }, { status: 500 });
  }
}
