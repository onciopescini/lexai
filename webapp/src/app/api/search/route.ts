import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { getEmbeddings, generateLegalIllustration, factCheckResponse, FactCheckReport } from '@/lib/gemini';
import { rerankDocuments } from '@/lib/groq';
import { RouterAgent } from '@/lib/agents/RouterAgent';
import { AtenaSearchAgent } from '@/lib/agents/AtenaSearchAgent';
import { PicoClawAgent } from '@/lib/agents/PicoClawAgent';
import { TenthManAgent, TenthManInput } from '@/lib/agents/TenthManAgent';
import { LiveWebAgent, LiveWebInput } from '@/lib/agents/LiveWebAgent';
import { findCachedKnowledge, cacheKnowledge } from '@/lib/knowledgeCache';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
// FIX M4: Import sanitizer for prompt injection protection
import { sanitizeInput, FILE_SIZE_LIMITS } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const redisOptions = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN }
  : null;
const redisClient = redisOptions ? new Redis(redisOptions) : null;
const upstashRateLimit = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
}) : null;

const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

async function checkRateLimit(ip: string): Promise<boolean> {
  if (upstashRateLimit) {
     try {
       const { success } = await upstashRateLimit.limit(`ratelimit_${ip}`);
       return success;
     } catch (err) {
       console.warn("[RATE LIMIT] Fallimento redis:", err);
     }
  }
  const now = Date.now();
  if (Math.random() < 0.05) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) rateLimitMap.delete(key);
    }
  }
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) return false;
  record.count += 1;
  return true;
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (type: string, payload: any) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type, payload })}\n\n`));
    } catch (e) {
      console.error("Errore scrittura stream:", e);
    }
  };
  const closeStream = async () => {
    try {
      await writer.close();
    } catch (e) {
      console.error("Errore chiusura stream:", e);
    }
  };

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON non valido' }, { status: 400 });
  }
  const { query: rawQuery, sourceFilter, history, draftingMode, workspaceScope } = body;
  if (!rawQuery || typeof rawQuery !== 'string' || rawQuery.trim().length === 0) {
    return NextResponse.json({ error: 'Nessuna query valida' }, { status: 400 });
  }
  if (rawQuery.length > FILE_SIZE_LIMITS.SEARCH_QUERY * 2) {
    return NextResponse.json({ error: 'Query troppo lunga' }, { status: 400 });
  }

  // FIX M4: Sanitize query — strip injection patterns before LLM/embedding calls
  const query = sanitizeInput(rawQuery, FILE_SIZE_LIMITS.SEARCH_QUERY);
  // Phase 16: scope for dual workspace RAG ('personal' | 'firm' | 'all')
  const docScope = ['personal', 'firm', 'all'].includes(workspaceScope) ? workspaceScope : 'all';

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';

  (async () => {
    try {
      await sendEvent('status', 'Scannerizzazione sicura della richiesta...');
      const rateLimitPromise = checkRateLimit(ip);
      const authPromise = createClient().then(client => client.auth.getUser());
      const routerPromise = new RouterAgent().execute({ query });
      const embeddingPromise = getEmbeddings(query);

      const [isAllowed, authResult] = await Promise.all([rateLimitPromise, authPromise]);
      if (!isAllowed) {
        await sendEvent('error', 'Troppe richieste. Riprova tra un minuto.');
        await closeStream(); return;
      }
      const user = authResult.data?.user;
      if (!user) {
        await sendEvent('error_auth', 'AUTHENTICATION_REQUIRED');
        await closeStream(); return;
      }
      const isPremium = user.user_metadata?.is_premium === true;
      const freeQueriesUsed = user.user_metadata?.free_queries_used || 0;
      if (!isPremium && freeQueriesUsed >= 10) {
        await sendEvent('error_quota', 'QUOTA_EXCEEDED');
        await closeStream(); return;
      }
      supabaseAdmin.from('user_queries').insert([{ query }]).then();

      await sendEvent('status', 'Agentic Router: Calcolo direzionale dell\'intento semantico...');
      const [routerOutput, embedding] = await Promise.all([routerPromise, embeddingPromise]);
      const { intent, confidence } = routerOutput.data as { intent: string, confidence: number };
      await sendEvent('status', `Intento Identificato: ${intent.toUpperCase()} (Sicurezza: ${Math.round(confidence * 100)}%)`);

      if (intent === 'general_chat') {
        await sendEvent('result', { response: `Ciao! Sono Atena. Posso aiutarti a ricercare leggi, redigere contratti o analizzare casi giuridici.` });
        await closeStream(); return;
      }
      if (intent === 'history') {
        await sendEvent('result', { response: `Per questa richiesta, utilizza lo strumento "Libreria e Storico" per visualizzare il Diff esatto tra le vecchie edizioni della legge.` });
        await closeStream(); return;
      }

      const effectiveDraftingMode = draftingMode || intent === 'drafting';
      if (effectiveDraftingMode) {
        await sendEvent('status', 'Modalità Drafting impostata. Attenzione richiesta per il carico di calcolo.');
        if (!isPremium) { await sendEvent('error_premium', 'PREMIUM_REQUIRED'); await closeStream(); return; }
      }

      await sendEvent('status', 'Cross-RAG: Ricerca vettoriale nei Codici di Legge e nel Workspace Privato...');
      let filterCondition = {};
      if (sourceFilter && sourceFilter !== 'Tutte le Fonti') filterCondition = { 'source': sourceFilter };

      const searchPromises: any[] = [
        supabaseAdmin.rpc('hybrid_search_legal_docs', { query_embedding: embedding, query_text: query, filter: filterCondition, match_count: 5, full_text_weight: 1.0, semantic_weight: 1.0 }),
        supabaseAdmin.rpc('match_agent_memories', { query_embedding: embedding, match_threshold: 0.3, match_count: 3 })
      ];
      if (isPremium) {
        // Phase 16: resolve firm_id if needed for scoped RAG
        let firmId: string | null = null;
        if (docScope === 'firm' || docScope === 'all') {
          const supabaseUser = await createClient();
          const { data: membership } = await (await supabaseUser)
            .from('firm_members')
            .select('firm_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();
          firmId = membership?.firm_id ?? null;
        }
        searchPromises.push(
          supabaseAdmin.rpc('match_user_documents', {
            query_embedding: embedding,
            match_threshold: 0.7,
            match_count: 5,
            p_user_id: user.id,
            p_scope: docScope,
            p_firm_id: firmId,
          })
        );
      }

      const results = await Promise.all(searchPromises);
      const supabaseResult = results[0];
      const memoryResult = results[1];
      const userDocsResult = isPremium ? results[2] : null;

      if (supabaseResult.error) {
        await sendEvent('error', 'Errore critico durante l\'estrazione dal Database.');
        await closeStream(); return;
      }
      const documents = supabaseResult.data;
      if (!documents || documents.length === 0) {
        await sendEvent('result', { response: 'Nessuna corrispondenza trovata.', sources: [] });
        await closeStream(); return;
      }

      let rankedDocs = documents;
      try {
        await sendEvent('status', 'Reranking Hardware: Groq Engine riordina semanticamente i documenti...');
        rankedDocs = await rerankDocuments(query, documents);
      } catch { /* skip */ }

      let contextText = rankedDocs.map((doc: any) => `FONTE DB: ${doc.title}\nURL: ${doc.source_url}\nTESTO:\n${doc.content}\n---`).join('\n');
      if (userDocsResult?.data?.length > 0) {
        await sendEvent('status', `Knowledge Base Personale inclusa: Trovati ${userDocsResult.data.length} documenti.`);
        contextText = userDocsResult.data.map((doc: any) => `📁 DOCUMENTO PRV: ${doc.title}\nTESTO:\n${doc.content}\n---`).join('\n') + '\n' + contextText;
      }
      let agentMemoriesText = "";
      if (memoryResult?.data?.length > 0) {
        agentMemoriesText = memoryResult.data.map((m: any) => `- ${m.memory_text}`).join('\n');
      }
      
      // OMNICHANNEL CHAT CONTINUITY: Fetch Telegram Memory
      const telegramChatId = process.env.TELEGRAM_CHAT_ID;
      if (telegramChatId) {
        await sendEvent('status', 'Sincronizzazione Omnichannel: Recupero contesto da Telegram...');
        const { data: teleMem } = await supabaseAdmin
          .from('telegram_memory')
          .select('role, content')
          .eq('chat_id', telegramChatId)
          .order('created_at', { ascending: false })
          .limit(6);
          
        if (teleMem && teleMem.length > 0) {
          const teleHistory = [...teleMem].reverse().map(m => `${m.role.toUpperCase()} (Telegram): ${m.content}`).join('\n');
          agentMemoriesText = `--- CONTESTO CHAT TELEGRAM ---\n${teleHistory}\n\n` + agentMemoriesText;
        }
      }

      await sendEvent('status', 'Brain Core: Generazione tesi difensiva tramite LLM...');
      let baseThesis = "";
      if (effectiveDraftingMode) {
        const draftOutput = await new PicoClawAgent().execute({ query, context: { history: history||[], documents: contextText, systemMemories: agentMemoriesText } });
        baseThesis = draftOutput.data as string;
      } else {
        const searchOutput = await new AtenaSearchAgent().execute({ query, context: { history: history||[], documents: contextText, systemMemories: agentMemoriesText } });
        baseThesis = searchOutput.data as string;
      }

      let perplexityValidation = null, tenthManAnswer = "*(Disattivato in Drafting).*", factCheckReport = null;
      const legalIllustrationPromise = generateLegalIllustration(`Concetto legale: "${query}"`);

      if (!effectiveDraftingMode) {
        await sendEvent('status', 'Controllo Cache: Verifica esistenza tesi validate pregenerate...');
        const cachedResult = await findCachedKnowledge(query, embedding, 0.85);
        if (cachedResult) {
          await sendEvent('status', 'Hit Cache Verificata! Bypass Data-Clash web.');
          perplexityValidation = cachedResult.perplexity_response;
          tenthManAnswer = "*(Risposta dalla Cache: Data-Clash bypassato).*";
          factCheckReport = {
            overall_score: 100, total_claims: 1, verified: 1, partial: 0, unsupported: 0, opinion: 0,
            claims: [{ claim: "Validata in Cache", verdict: "verified", source_ref: "Cache", explanation: "Match Semantico Cache"}],
            methodology: "Recupero da cache."
          };
        } else {
          await sendEvent('status', 'Perplexity Data-Clash: Connessione agenti Sentinel al Web...');
          const webOutput = await new LiveWebAgent().execute({ query, baseThesis } as LiveWebInput);
          perplexityValidation = webOutput.data as string;
          
          await sendEvent('status', 'Innesco Protocollo Decimo Uomo: Dibattito feroce tra Tesi (Int) e Antitesi (Web)...');
          const tenthManContext = `CONTESTO DB:\n${contextText}\n\n=== CONTRO-ANALISI WEB ===\n${perplexityValidation}`;
          const tenthManPromise = new TenthManAgent().execute({ query, context: { documents: tenthManContext }, originalAnswer: baseThesis } as TenthManInput);
          
          await sendEvent('status', 'Atena Fact-Checker: Scomposizione e calcolo oggettivo confutazioni...');
          const [tmOut, fcRes] = await Promise.all([tenthManPromise, factCheckResponse(query, baseThesis, contextText)]);
          tenthManAnswer = tmOut.data as string;
          factCheckReport = fcRes;
          if (factCheckReport && factCheckReport.overall_score >= 70) {
             await sendEvent('status', 'Consolidamento Verità nella Rete Neurale e Caching...');
             await cacheKnowledge(query, embedding, perplexityValidation, baseThesis, factCheckReport.overall_score >= 90 ? 'verified' : 'partially_verified');
          }
        }
      } else {
        factCheckReport = { overall_score: 100, total_claims: 0, verified: 0, partial: 0, unsupported: 0, opinion: 0, claims: [], methodology: "Bypass Drafting" };
      }

      await sendEvent('status', 'Generazione Illustration e confezionamento dell\'Artefatto...');
      const legalIllustration = await legalIllustrationPromise;

      if (!isPremium) supabaseAdmin.rpc('increment_free_queries', { p_user_id: user.id }).then();
      supabaseAdmin.from('chat_sessions').insert([{ session_id: user.id || 'default_user', user_query: query, ai_response: baseThesis }]).then();
      
      // OMNICHANNEL CHAT CONTINUITY: Backup WebApp chat to Telegram Memory
      if (telegramChatId) {
          supabaseAdmin.from('telegram_memory').insert([
              { chat_id: telegramChatId, role: 'user', content: query },
              { chat_id: telegramChatId, role: 'model', content: baseThesis }
          ]).then();
      }
      
      supabaseAdmin.from('atena_truth_telemetry').insert([{ session_id: 'default_user', query_text: query, tenth_man_triggered: !effectiveDraftingMode, primary_ai_model: 'gemini-2.5-flash', sources_count: rankedDocs?.length||0 }]).then();

      const isLastFreeQuery = !isPremium && (freeQueriesUsed + 1) >= 10;

      if (isLastFreeQuery) {
        await sendEvent('last_free_query', {
          message: 'Questa è la tua ultima query gratuita.',
          cta: { label: 'Prova LexAI Pro gratis per 3 giorni', href: '/checkout?trial=true' }
        });
      }

      await sendEvent('result', { response: baseThesis, contra_analysis: tenthManAnswer, sources: rankedDocs, web_updates: perplexityValidation, legal_illustration: legalIllustration, fact_check: factCheckReport });
    } catch (error: any) {
      console.error('API Error:', error);
      await sendEvent('error', `Errore tecnico profondo: ${error.message || 'Sconosciuto'}`);
    } finally {
      await closeStream();
    }
  })();

  return new Response(stream.readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
}
