import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getGenAI } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds limit for Vercel Hobby/Pro

/**
 * Endpoint da chiamare tramite Vercel Cron (es. ogni notte).
 * Legge le sessioni di chat più lunghe di 20 messaggi, genera un summary denso
 * per i messaggi più vecchi e cancella i record originali per risparmiare spazio e tokens.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    // Implement a basic shared secret for cron security
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Memory Consolidation] Avvio task crontab...');

    // 1. Group by session_id to find users with > 20 messages
    // Since we don't have a direct count group by in Supabase RPC by default for this,
    // we'll fetch all session IDs and then process them.
    // To be efficient, we fetch up to 1000 recent messages and group in memory.
    const { data: recentSessions, error: fetchErr } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, session_id, user_query, ai_response, created_at')
      .order('created_at', { ascending: true })
      .limit(2000);

    if (fetchErr) throw fetchErr;

    const grouped: Record<string, typeof recentSessions> = {};
    for (const row of recentSessions || []) {
       if (!grouped[row.session_id]) grouped[row.session_id] = [];
       grouped[row.session_id].push(row);
    }

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    let sessionsConsolidated = 0;
    let rowsDeleted = 0;

    // 2. Process ciascun utente
    for (const [sessionId, rows] of Object.entries(grouped)) {
       if (rows.length > 20) {
          // Keep the last 10 messages intact. Summarize the rest.
          const rowsToSummarize = rows.slice(0, rows.length - 10);
          
          if (rowsToSummarize.length < 5) continue; // nothing to summarize

          console.log(`[Memory Consolidation] Summarizzating ${rowsToSummarize.length} rows per session: ${sessionId}`);

          const historyText = rowsToSummarize.map(r => `Utente: ${r.user_query}\nAtena: ${r.ai_response}`).join('\n\n');
          
          const prompt = `
Sei il modulo di Sistema per la Compressione Vettoriale della Memoria di Atena.
Il tuo compito è prendere la seguente conversazione storica (lunga) e ridurla in un "Sommario Denso" di massimo 3 paragrafi.
Devi conservare i fatti chiave, le preferenze legali dell'utente e i contesti importanti discussi, omettendo i saluti e i dettagli inutili.

CONVERSAZIONE DA COMPRIMERE:
${historyText}

RISPONDI SOLO CON IL SOMMARIO DENSO.
          `;

          try {
             const result = await model.generateContent(prompt);
             const summary = result.response.text().trim();

             // 3. Insert the summary as a new anchor record
             await supabaseAdmin.from('chat_sessions').insert([{
                session_id: sessionId,
                user_query: 'SYSTEM_SUMMARY_COMPRESSION',
                ai_response: summary,
                analyzed: true
             }]);

             // 4. Delete the original rows
             const idsToDelete = rowsToSummarize.map(r => r.id);
             await supabaseAdmin.from('chat_sessions').delete().in('id', idsToDelete);

             sessionsConsolidated++;
             rowsDeleted += idsToDelete.length;
          } catch (modelErr) {
             console.error(`Errore LLM durante la sintesi per ${sessionId}:`, modelErr);
          }
       }
    }

    return NextResponse.json({
       success: true,
       message: 'Memory Consolidation completata',
       sessions_consolidated: sessionsConsolidated,
       rows_deleted: rowsDeleted
    });

  } catch (error: unknown) {
    console.error('[Memory Consolidation] Errore critico:', error);
    const message = error instanceof Error ? error.message : 'Internal Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
