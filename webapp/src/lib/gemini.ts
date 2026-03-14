import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const getEmbeddings = async (text: string) => {
  // L'utente ha l'API abilitata per "gemini-embedding-001"
  const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

export const generateSynthesizedAnswer = async (query: string, context: string, history: {role: string, content: string}[] = []) => {
  // Configurato sul modello ammiraglia più veloce.
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  // Costruzione della memoria storica:
  const historyString = history.length > 0
    ? history.map(msg => `${msg.role === 'user' ? 'UTENTE' : 'PICOCLAW'}: ${msg.content}`).join('\n\n')
    : "Nessuna conversazione precedente.";

  const prompt = `
  Sei PicoClaw, un infallibile assistente giuridico esperto di legge italiana ed europea.
  
  CRONOLOGIA DELLA CONVERSAZIONE (MEMORIA):
  ${historyString}
  
  CONTESTO UFFICIALE (Documenti recuperati per l'ultima domanda):
  ${context}
  
  DOMANDA ATTUALE DELL'UTENTE:
  ${query}
  
  Istruzioni:
  1. Usa esclusivamente il CONTESTO UFFICIALE e la CRONOLOGIA per rispondere alla domanda attuale.
  2. Se la risposta non è nel contesto, dillo chiaramente.
  3. Rispondi in modo professionale, citando sempre l'articolo di riferimento, e formattando la risposta in Markdown pulito.
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const generateTenthManRebuttal = async (query: string, context: string, originalAnswer: string) => {
  // Protocollo del Decimo Uomo: Usa lo stesso modello per generare la confutazione
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
  SEI IL "DECIMO UOMO" (TENTH MAN PROTOCOL) DELLA PIATTAFORMA LEXAI.
  Il tuo compito è fornire una verifica incrociata (Cross-Examination) oggettiva della risposta dell'IA primaria.
  Non usare un tono polemico o severo. Mantieni un linguaggio analitico, esplicativo e imparziale.
  
  DOMANDA ORIGINALE:
  ${query}
  
  FONTI UFFICIALI (CONTESTO):
  ${context}
  
  RISPOSTA DELL'IA PRIMARIA:
  ${originalAnswer}
  
  ISTRUZIONI PER LA VERIFICA INCROCIATA:
  1. Analizza la risposta dell'IA primaria in modo neutrale e accademico.
  2. Spiega quanti elementi fattuali o normativi (nel contesto o nel diritto generale) supportano o confermano la tesi primaria.
  3. Evidenzia quanti e quali elementi (eccezioni, scappatoie, interpretazioni alternative, giurisprudenza contraria) NON la supportano o potrebbero metterne in discussione l'applicabilità assoluta.
  4. Fornisci un quadro chiaro, bilanciato e rassicurante dei pro e dei contro legali, senza aggressività.
  5. Usa formattazione Markdown per un'esposizione chiara.
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const generateLegalIllustration = async (topic: string) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`;
  
  // Create an optimized prompt for the Imagen model
  const prompt = `Un'illustrazione istituzionale fotorealistica ad alta risoluzione, stile elegante e ministeriale, che rappresenta visivamente il seguente concetto legale: ${topic}. Nessun testo nell'immagine. Stile cinematografico.`;
  
  const payload = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "16:9" // Cinematic aspect ratio suitable for chat interfaces
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
        console.error("Imagen API Error:", res.status, res.statusText);
        return null;
    }

    const data = await res.json();
    if (data.predictions && data.predictions.length > 0) {
      // Return the base64 encoded image string (without the mime prefix)
      return data.predictions[0].bytesBase64Encoded || data.predictions[0].image?.bytesBase64Encoded || data.predictions[0];
    }
    return null;
  } catch (error) {
    console.error("Imagen Fetch failed:", error);
    return null;
  }
};
