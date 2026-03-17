import { env } from 'process';

/**
 * Funzione per eseguire ricerche Live Web tramite l'API di Perplexity.
 * Utilizza il modello sonar (online) per recuperare le ultime novità, ma ora opera come Fact-Checker (Data-Clash Protocol).
 */
export async function searchPerplexity(query: string, baseThesis: string) {
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
        model: "sonar", // Modello connesso al web
        messages: [
          { 
            role: "system", 
            content: "Sei un revisore legale incaricato di Fact-Checking (Data-Clash Protocol). Cerca sul web le sentenze o le notizie legali più recenti possibili (specialmente della Corte di Cassazione Italiana) per CONTRADDIRE o CONFERMARE la Tesi Legale fornita. Se la tesi è inesatta o superata da una nuova sentenza, citala esplicitamente con i link." 
          },
          { 
            role: "user", 
            content: `DOMANDA ORIGINALE DELL'UTENTE: ${query}\n\nTESI LEGALE DA VERIFICARE SUL WEB:\n${baseThesis}` 
          }
        ],
        temperature: 0.1, // Bassissima creatività, massima aderenza ai fatti web
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
