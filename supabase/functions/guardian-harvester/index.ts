import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY") ?? "";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // 1. Fetch from Perplexity
    const pplxRes = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
         "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
            {
                "role": "system",
                "content": "Sei un analista legale. Cerca esclusivamente novità legislative italiane degli ultimi 7 giorni (leggi, decreti, circolari, sentenze Cassazione rilevanti). Elencale in modo fattuale."
            },
            {
                "role": "user",
                "content": "Quali sono le novità legislative, decreti legge, bonus o sentenze importanti uscite in Italia nell'ultima settimana? Fornisci fonti se possibile."
            }
        ],
        temperature: 0.2
      })
    });
    
    if (!pplxRes.ok) {
        throw new Error(`Perplexity API Error: ${await pplxRes.text()}`);
    }
    
    const pplxData = await pplxRes.json();
    const rawNews = pplxData.choices[0].message.content;
    const citations = pplxData.citations || [];

    // 2. Synthesize with Gemini
    const prompt = `Sei Atena, l'IA Legale Suprema.
Ecco un riassunto delle ultime novità legali in Italia (tratto dal web):

NEWS:
${rawNews}

FONTi CITATE:
${JSON.stringify(citations)}

Il tuo compito è analizzare queste novità e dividerle in singoli "Alert".
Restituisci ESCLUSIVAMENTE un JSON array valido. 
Ogni oggetto JSON deve avere il seguente formato esatto:
[
  {
    "title": "Titolo breve e accattivante della novità (max 60 char)",
    "summary": "Riassunto pratico: cosa cambia? (2-3 frasi)",
    "impact_level": "High", "Medium", o "Low",
    "target_audience": "A chi si rivolge? Es. 'Aziende E-commerce', 'Lavoratori', 'Tutti i cittadini'",
    "source_url": "La URL della fonte (scegli una delle FONTi CITATE in alto se pertinente)"
  }
]`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    });
    
    if (!geminiRes.ok) {
       throw new Error(`Gemini API Error: ${await geminiRes.text()}`);
    }
    
    const geminiData = await geminiRes.json();
    let responseText = geminiData.candidates[0].content.parts[0].text;
    
    // Clean JSON
    if (responseText.startsWith("```json")) responseText = responseText.substring(7);
    if (responseText.startsWith("```")) responseText = responseText.substring(3);
    if (responseText.endsWith("```")) responseText = responseText.substring(0, responseText.length - 3);
    
    const alerts = JSON.parse(responseText.trim());
    if (alerts.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No alerts generated." }));
    }
    
    // 3. Insert to Supabase
    const today = new Date().toISOString().split('T')[0];
    const alertsToInsert = alerts.map((a: any) => ({
      ...a,
      date_published: today,
      source_url: a.source_url || "https://gazzettaufficiale.it"
    }));
    
    const { error } = await supabase.table("atena_guardian_alerts").insert(alertsToInsert);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, inserted: alertsToInsert.length }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
