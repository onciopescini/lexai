import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { getEmbeddings, getGenAI } from '@/lib/gemini';
import { rerankDocuments } from '@/lib/groq';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const authClient = await createClient();
    const { data: authData } = await authClient.auth.getUser();
    
    // Check if the user is authenticated
    if (!authData?.user) {
      return NextResponse.json({ error: 'Devi effettuare il login per utilizzare la Giustizia Predittiva.' }, { status: 401 });
    }

    const isPremium = authData.user.user_metadata?.is_premium === true;
    if (!isPremium) {
       return NextResponse.json({ error: 'La funzione Giustizia Predittiva è riservata agli utenti LexAI Pro.' }, { status: 403 });
    }

    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Nessuna descrizione del fatto fornita.' }, { status: 400 });
    }

    // 1. Embed the query
    const searchEmbedding = await getEmbeddings(query);

    // 2. Fetch precedents from Cassazione
    const { data: documents, error } = await supabaseAdmin.rpc('hybrid_search_legal_docs', {
      query_embedding: searchEmbedding,
      query_text: query,
      filter: { source: 'Cassazione' },
      match_count: 5,
      full_text_weight: 1.0,
      semantic_weight: 1.0
    });

    if (error) {
      console.error('Database Error:', error);
      return NextResponse.json({ error: 'Errore durante la ricerca dei precedenti.' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'Nessun precedente trovato per questo caso specifico.' }, { status: 404 });
    }

    // 3. Rerank the precedents
    let rankedDocs = documents;
    try {
      rankedDocs = await rerankDocuments(query, documents);
    } catch (e) {
      console.warn('Groq rerank failed in predict route, using raw results', e);
    }

    const contextText = rankedDocs.map((doc: any) => `FONTE: ${doc.title}\nANNO: ${doc.year || 'N/D'}\nTESTO:\n${doc.content}\n---`).join('\n');

    // 4. Request Structured Evaluation from Gemini
    const model = getGenAI().getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
    Sei l'Algoritmo di Giustizia Predittiva di LexAI.
    Analizza i Fatti forniti dall'utente e confrontali con le Sentenze della Cassazione recuperate dal nostro database.
    Devi generare un output JSON strutturato rigoroso che calcola la probabilità di successo dell'utente in un eventuale giudizio.

    I FATTI DEL CASO:
    ${query}

    PRECEDENTI IN CASSAZIONE:
    ${contextText}

    ISTRUZIONI:
    1. Valuta oggettivamente quanto i precedenti supportano le pretese dell'utente.
    2. Identifica i fattori di rischio (perché l'utente potrebbe perdere).
    3. Identifica i punti a favore dell'utente.
    4. Estrai citazioni dalle sentenze a favore e a sfavore.
    5. Restituisci ESCLUSIVAMENTE un JSON valido con la seguente struttura:
    {
      "win_probability": <numero intero da 0 a 100>,
      "risk_factors": ["Rischio 1", "Rischio 2"],
      "pro_cases": [
         { "title": "Corte di Cassazione nn/aaaa", "quote": "citazione esatta", "relevance": "Perché sostiene il caso" }
      ],
      "con_cases": [
         { "title": "Corte di Cassazione nn/aaaa", "quote": "citazione esatta", "relevance": "Perché indebolisce il caso" }
      ],
      "rationale": "Sintesi del ragionamento giuridico (Max 3-4 frasi)."
    }
    `;

    const result = await model.generateContent(prompt);
    const aiResponseText = result.response.text();
    
    const predictionPayload = JSON.parse(aiResponseText);

    return NextResponse.json({ success: true, prediction: predictionPayload, sources_analyzed: rankedDocs.length });

  } catch (err: any) {
    console.error('Predictive API Unexpected Error:', err);
    return NextResponse.json({ error: 'Errore interno del server durante la stima predittiva.' }, { status: 500 });
  }
}
