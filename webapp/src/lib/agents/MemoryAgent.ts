import { BaseAgent } from './BaseAgent';
import { AgentInput, AgentOutput, AgentPolicy } from './types';
import { getGenAI, getEmbeddings } from '../gemini';
import { supabaseAdmin } from '../supabase';

interface ChatSession {
  id: string;
  user_query: string;
  ai_response: string;
  analyzed: boolean;
}

export interface MemoryInput extends AgentInput {
  maxSessions?: number;
}

export class MemoryAgent extends BaseAgent {
  name = 'MemoryAgent';
  description = 'Analyzes unprocessed chat sessions to extract long-term memory insights and user preferences';
  policy: AgentPolicy = {
    allowedModels: ['gemini-2.5-flash'],
    maxTokens: 2048,
    networkAccess: false,
    sandboxLevel: 'relaxed', // Needs DB write access
  };

  protected async performExecution(input: MemoryInput): Promise<AgentOutput> {
    const limit = input.maxSessions || 10;

    // 1. Fetch unanalyzed chat sessions
    const { data: sessions, error: fetchError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('analyzed', false)
      .limit(limit);

    if (fetchError) {
      return { success: false, data: null, error: fetchError.message };
    }

    if (!sessions || sessions.length === 0) {
      return { success: true, data: { message: 'Nessuna nuova sessione da analizzare.', memoriesExtracted: 0 } };
    }

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const insertedMemories: string[] = [];

    // 2. Synthesize each session into insights
    for (const session of sessions as ChatSession[]) {
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
      Formula ogni memory come una chiara e concisa istruzione direttiva (max 2 frasi).
      Rispondi SOLO con la lista degli insight (uno per riga, iniziando con un trattino), oppure scrivi "NESSUN_INSIGHT".
      `;

      const result = await model.generateContent(memoryPrompt);
      const output = result.response.text().trim();

      if (output && !output.includes('NESSUN_INSIGHT')) {
        const insights = output.split('\n').filter(line => line.trim().startsWith('-'));

        for (const rawInsight of insights) {
          const cleanInsight = rawInsight.replace(/^-\s*/, '').trim();
          if (cleanInsight.length > 5) {
            const insightEmbedding = await getEmbeddings(cleanInsight);

            const { error: insertError } = await supabaseAdmin.from('agent_memories').insert([{
              memory_text: cleanInsight,
              embedding: insightEmbedding,
              importance_score: 1.0,
              source_session_id: session.id
            }]);

            if (!insertError) {
              insertedMemories.push(cleanInsight);
            }
          }
        }
      }

      // Mark session as analyzed
      await supabaseAdmin
        .from('chat_sessions')
        .update({ analyzed: true })
        .eq('id', session.id);
    }

    return {
      success: true,
      data: {
        sessionsProcessed: sessions.length,
        memoriesExtracted: insertedMemories.length,
        insights: insertedMemories
      }
    };
  }
}
