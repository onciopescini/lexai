import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge Function implementation for the Heartbeat Crawler
// This function acts as the "Autonomous Librarian Agent"

console.log("Heartbeat Crawler (Librarian Agent) is alive.")

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing")

    // For the prototype heartbeat, we will simulate scraping the latest "Gazzetta Ufficiale" 
    // or picking up where the crawler left off.
    // In a full implementation, this would fetch from a live RSS feed or Wikipedia recent-changes API.
    
    console.log("[*] Heartbeat triggered. Librarian Agent checking for new legal documents...");
    
    // Simulate finding a new decree
    const newDoc = {
      title: "Decreto Legge Fittizio - Test Aggiornamento Autonomo",
      content: "Articolo 1. Le disposizioni in materia di intelligenza artificiale sono aggiornate regolarmente dal sistema heartbeat.",
      metadata: {
        source: "Aggiornamento Automatico",
        tipo: "Decreto",
        numero: "999"
      },
      source_url: "https://gazzettaufficiale.it/esempio"
    }

    // 1. Semantic Chunking (Simplified for edge function)
    const chunks = [newDoc] // Assuming the doc is already small enough

    // 2. Vectorization via Gemini
    console.log(`[*] Vectorizing ${chunks.length} new chunks...`);
    const payloadDb = [];
    for (const chunk of chunks) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/gemini-embedding-001",
                content: { parts: [{ text: chunk.content }] }
            })
        });

        if (!res.ok) {
           console.error(`Gemini API Error: ${res.statusText}`);
           continue;
        }

        const data = await res.json();
        const vector = data.embedding?.values;
        
        if (vector) {
           payloadDb.push({
               title: chunk.title,
               content: chunk.content,
               source_url: chunk.source_url,
               metadata: chunk.metadata,
               embedding: vector
           });
        }
    }

    // 3. Database Insertion
    if (payloadDb.length > 0) {
        console.log(`[*] Inserting ${payloadDb.length} vectors into legal_documents...`);
        const { error } = await supabaseClient.from('legal_documents').insert(payloadDb);
        if (error) throw error;
        console.log("[v] Ingestion successful.");
    } else {
        console.log("[!] No new documents to ingest during this heartbeat.");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Heartbeat completed", ingested: payloadDb.length }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Heartbeat failed:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})
