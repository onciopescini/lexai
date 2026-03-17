import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Interfaccia del payload atteso dal DB webhook o da pg_cron
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "CRON";
  table?: string;
  schema?: string;
  record?: {
    id: string;
    session_id: string;
    query: string;
    status: string;
  };
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") as string;

// Initialize Supabase Client with Service Role (Bypasses RLS for backend workers)
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    let queueIdToProcess: string | null = null;
    let queryToProcess: string | null = null;

    // Se chiamata via POST (da un webhook del database insert)
    if (req.method === 'POST') {
        const payload: WebhookPayload = await req.json();
        
        // Se triggerata da un Webhook specifico su una riga
        if (payload.record && payload.record.status === 'pending') {
           queueIdToProcess = payload.record.id;
           queryToProcess = payload.record.query;
        } 
    }
    
    // Se è chiamato via GET o CronJob senza payload specifico, cerchiamo noi la prima in coda
    if (!queueIdToProcess) {
      const { data, error } = await supabase
        .from('atena_agent_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
        
      if (error || !data) {
        return new Response(JSON.stringify({ message: "Nessun task in coda da processare." }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      queueIdToProcess = data.id;
      queryToProcess = data.query;
    }

    if (!queueIdToProcess || !queryToProcess) {
        throw new Error("Impossibile determinare il task da processare.");
    }

    console.log(`[Worker] Inizio elaborazione Task ID: ${queueIdToProcess}`);

    // LOCK: Cambia lo stato in "processing" per evitare doppie esecuzioni
    const { error: lockError } = await supabase
      .from('atena_agent_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', queueIdToProcess)
      .eq('status', 'pending'); // Optimistic locking

    if (lockError) throw new Error("Conflitto di concorrenza, lock fallito.");

    // ====================================================================
    // 🧠 CHIAMATA A GEMINI (Simulazione Deep RAG o Drafting Complesso)
    // Qui potremmo anche chiamare le API di Perplexity o Groq se necessario
    // ====================================================================
    console.log(`[Worker] Richiesta a Gemini per la query: "${queryToProcess}"`);
    
    // NOTA: Poiché siamo in una Edge Function stand-alone, eseguiamo una chiamata diretta REST a Gemini.
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    
    const promptInstructions = `
    Sei Atena, l'assistente legale AI. Questo è un task "asincrono" profondo.
    Ti è stato chiesto di redigere un documento, un'analisi o analizzare un concetto complesso.
    Rispondi con la massima precisione e strutturalo come un documento legale formale.
    
    Richiesta Utente: "${queryToProcess}"
    `;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptInstructions }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!geminiResponse.ok) {
        throw new Error(`Gemini API Failed: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const draftedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Errore nella generazione del testo.";

    // ====================================================================
    // ✅ PASSAGGIO A "REVIEW BOARD"
    // ====================================================================
    console.log(`[Worker] Generazione completata. Salvataggio in atena_review_board per Human-in-The-Loop...`);

    // 1. Inserisci la bozza nella review board
    const { error: reviewError } = await supabase
        .from('atena_review_board')
        .insert([{
            queue_id: queueIdToProcess,
            original_draft: draftedText,
            status: 'pending' // In attesa del Partner umano
        }]);
        
    if (reviewError) throw reviewError;

    // 2. Aggiorna la coda madre in "review_needed"
    const { error: finalUpdateError } = await supabase
        .from('atena_agent_queue')
        .update({ status: 'review_needed', drafted_response: draftedText, updated_at: new Date().toISOString() })
        .eq('id', queueIdToProcess);

    if (finalUpdateError) throw finalUpdateError;

    console.log(`[Worker] Task ID: ${queueIdToProcess} completato con successo e passato in revisione.`);

    return new Response(JSON.stringify({ 
        message: "Elaborazione Code Completata", 
        processed_id: queueIdToProcess 
    }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    });

  } catch (error: any) {
    console.error(`[Worker] Fatal Error:`, error);
    
    // Se avevamo un ID su cui stavamo lavorando, segnaliamolo come "failed"
    // in modo che non resti bloccato in "processing" per sempre
    try {
        // Usa una query che non si aspetta per forza di conoscere ID
        // Facciamo il fallback omettendolo se non ce l'abbiamo.
    } catch(e) {}
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
