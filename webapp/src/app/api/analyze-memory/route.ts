import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getEmbeddings } from '@/lib/gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch unanalyzed chat sessions (limit to 10 at a time to avoid timeout/rate limits)
    const { data: sessions, error: fetchError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('analyzed', false)
      .limit(10);

    if (fetchError) throw fetchError;
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ message: 'Nessuna nuova sessione da analizzare.' });
    }

    console.log(`[*] Trovate ${sessions.length} sessioni non analizzate. Avvio sintesi LTM...`);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const insertedMemories = [];

    // 2. Synthesize each session into insights
    for (const session of sessions) {
      const memoryPrompt = `
      Sei il Sottosistema per la Memoria Cognitiva a Lungo Termine dell'IA Atena.
      Analizza questa singola interazione tra l'Utente e Atena.

      QUERY UTENTE:
      "${session.user_query}"

      RISPOSTA ATENA:
      "${session.ai_response}"

      SINTETIZZA ESTRAENDO REGOLE/PREFERENZE:
      Se la conversazione rivela preferenze dell'utente, errori fatti dall'IA da non ripetere, o concetti chiave ricorrenti, estrai UNO o DUE 'insight' (memorie).
      Se è una normale Q&A senza particolarità, potresti non estrarre nulla.
      Formula ogni memory come una chiara e concisa istruzione direttiva (max 2 frasi). Ad esempio: "L'utente preferisce risposte focalizzate solo sul Codice Civile senza divagazioni storiche."
      Rispondi SOLO con la lista degli insight (uno per riga, iniziando con un trattino), oppure scrivi "NESSUN_INSIGHT".
      `;

      const result = await model.generateContent(memoryPrompt);
      const output = result.response.text().trim();

      if (output && !output.includes('NESSUN_INSIGHT')) {
        const insights = output.split('\n').filter(line => line.trim().startsWith('-'));
        
        for (const rawInsight of insights) {
          const cleanInsight = rawInsight.replace(/^-\s*/, '').trim();
          if (cleanInsight.length > 5) {
            // Get embedding for semantic search later
            const insightEmbedding = await getEmbeddings(cleanInsight);

            // Save to agent_memories
            const { error: insertError } = await supabase.from('agent_memories').insert([{
              memory_text: cleanInsight,
              embedding: insightEmbedding,
              importance_score: 1.0,
              source_session_id: session.id
            }]);

            if (insertError) {
              console.error(`Errore salvataggio memoria: ${insertError.message}`);
            } else {
              insertedMemories.push(cleanInsight);
            }
          }
        }
      }

      // Mark session as analyzed
      await supabase
        .from('chat_sessions')
        .update({ analyzed: true })
        .eq('id', session.id);
    }

    return NextResponse.json({
      message: 'Analisi Memoria Completata.',
      sessionsProcessed: sessions.length,
      memoriesExtracted: insertedMemories.length,
      insights: insertedMemories
    });

  } catch (error: unknown) {
    console.error('Memory Analysis Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errMessage }, { status: 500 });
  }
}
