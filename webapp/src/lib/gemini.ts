import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;
function getGenAI() {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return _genAI;
}

export const getEmbeddings = async (text: string) => {
  // L'utente ha l'API abilitata per "gemini-embedding-001"
  const model = getGenAI().getGenerativeModel({ model: "models/gemini-embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

export const generateSynthesizedAnswer = async (query: string, context: string, history: {role: string, content: string}[] = []) => {
  // Configurato sul modello ammiraglia più veloce.
  const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
  
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
  const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
  
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

// ============================================================================
// FACT-CHECKER ENGINE: Auto-Validation & Independence Protocol
// ============================================================================

export interface FactCheckClaim {
  claim: string;
  verdict: 'verified' | 'partial' | 'unsupported' | 'opinion';
  source_ref: string;
  explanation: string;
}

export interface FactCheckReport {
  overall_score: number; // 0-100
  total_claims: number;
  verified: number;
  partial: number;
  unsupported: number;
  opinion: number;
  claims: FactCheckClaim[];
  methodology: string;
}

export const factCheckResponse = async (
  query: string,
  aiResponse: string,
  sourceContext: string
): Promise<FactCheckReport | null> => {
  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    SEI IL MODULO DI FACT-CHECKING AUTONOMO DI LEXAI.
    Il tuo compito è verificare OGNI affermazione fattuale nella risposta dell'IA confrontandola con le FONTI UFFICIALI fornite.
    Devi essere IMPARZIALE, INDIPENDENTE e RIGOROSO. Non favorire né la risposta dell'IA né il tuo giudizio: basa tutto e solo sulle fonti.

    DOMANDA DELL'UTENTE:
    ${query}

    RISPOSTA GENERATA DALL'IA:
    ${aiResponse}

    FONTI UFFICIALI (CONTESTO DATABASE):
    ${sourceContext}

    ISTRUZIONI RIGOROSE:
    1. ESTRAI ogni singola affermazione fattuale/normativa dalla risposta dell'IA (ignora frasi di cortesia, connettivi, opinioni esplicite).
    2. Per OGNI affermazione, verificala contro le FONTI UFFICIALI fornite.
    3. Classifica ogni affermazione con uno di questi verdetti:
       - "verified": L'affermazione è direttamente supportata dalle fonti ufficiali (citazione esatta o parafrasi fedele)
       - "partial": L'affermazione è parzialmente corretta ma imprecisa, incompleta o semplificata
       - "unsupported": L'affermazione NON trova riscontro nelle fonti fornite (potenziale allucinazione)
       - "opinion": L'affermazione è un'interpretazione soggettiva, non verificabile oggettivamente
    4. Per ogni claim, indica la fonte di riferimento (titolo documento, articolo citato) o "Nessuna fonte trovata".
    5. Calcola un punteggio di affidabilità globale: (verified * 1.0 + partial * 0.5 + opinion * 0.3) / total_claims * 100

    RISPONDI ESCLUSIVAMENTE con un JSON valido (senza markdown, senza backtick, solo JSON puro) con questa struttura:
    {
      "overall_score": <numero 0-100>,
      "total_claims": <numero>,
      "verified": <numero>,
      "partial": <numero>,
      "unsupported": <numero>,
      "opinion": <numero>,
      "claims": [
        {
          "claim": "<testo dell'affermazione>",
          "verdict": "<verified|partial|unsupported|opinion>",
          "source_ref": "<riferimento alla fonte o 'Nessuna fonte trovata'>",
          "explanation": "<breve spiegazione del verdetto>"
        }
      ],
      "methodology": "Verifica automatica incrociata contro fonti ufficiali nel database LEXAI. Ogni affermazione è stata confrontata con i documenti legali indicizzati."
    }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Clean up potential markdown wrapping
    const cleanJson = text.replace(/^```json?\s*/, '').replace(/\s*```$/, '').trim();
    
    const report: FactCheckReport = JSON.parse(cleanJson);
    
    // Validate & sanitize
    report.overall_score = Math.min(100, Math.max(0, Math.round(report.overall_score)));
    report.methodology = "Verifica automatica incrociata contro fonti ufficiali nel database LEXAI. Ogni affermazione è stata confrontata con i documenti legali indicizzati.";
    
    console.log(`[Fact-Check] Score: ${report.overall_score}/100 | Claims: ${report.total_claims} (✅${report.verified} ⚠️${report.partial} ❌${report.unsupported} ℹ️${report.opinion})`);
    
    return report;
  } catch (error) {
    console.error("[Fact-Check] Error:", error);
    return null;
  }
};

