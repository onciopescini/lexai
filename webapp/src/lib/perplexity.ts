import { env } from 'process';

/**
 * Funzione per eseguire ricerche Live Web tramite l'API di Perplexity.
 * Utilizza il modello sonar (online) per recuperare le ultime novità.
 */
export async function searchPerplexity(query: string) {
  const apiKey = env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ PERPLEXITY_API_KEY non trovata. Ricerca Web saltata.");
    return null;
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar", // Utilizza sempre il modello entry-level per ricerche web
        messages: [
          { role: "system", content: "Sei un assistente legale. Trova sentenze, leggi o notizie giuridiche molto recenti pertinenti alla domanda. Cita le fonti." },
          { role: "user", content: query }
        ],
        temperature: 0.2, // Bassa creatività, alta precisione per il diritto
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.error(`Errore API Perplexity: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
      return null;
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("Eccezione durante la chiamata a Perplexity:", error);
    return null;
  }
}
