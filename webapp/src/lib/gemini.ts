import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;
export function getGenAI() {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return _genAI;
}

// ============================================================================
// EMBEDDING CACHE: LRU in-memory cache to avoid redundant API calls
// ============================================================================
const EMBEDDING_CACHE_MAX = 100;
const embeddingCache = new Map<string, number[]>();

function cacheSet(key: string, value: number[]) {
  if (embeddingCache.size >= EMBEDDING_CACHE_MAX) {
    // Evict oldest entry (first key in Map iteration order)
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey) embeddingCache.delete(firstKey);
  }
  embeddingCache.set(key, value);
}

export const getEmbeddings = async (text: string) => {
  // Check cache first
  const cacheKey = text.trim().toLowerCase();
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    console.log('[Cache] Embedding cache HIT — skipping API call');
    return cached;
  }

  const model = getGenAI().getGenerativeModel({ model: "models/gemini-embedding-001" });

  // @ts-expect-error - The Gemini API supports outputDimensionality even if types don't show it yet
  const result = await model.embedContent({ content: { role: "user", parts: [{ text }] }, outputDimensionality: 768 });
  const embedding = result.embedding.values;
  
  // Store in cache
  cacheSet(cacheKey, embedding);
  console.log(`[Cache] Embedding cached (${embeddingCache.size}/${EMBEDDING_CACHE_MAX})`);
  
  return embedding;
};

export const generateSynthesizedAnswer = async (query: string, context: string, history: {role: string, content: string}[] = [], draftingMode: boolean = false, agentMemories: string = "") => {
  // Configurato sul modello ammiraglia più veloce.
  const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
  
  // Costruzione della memoria storica:
  const historyString = history.length > 0
    ? history.map(msg => `${msg.role === 'user' ? 'UTENTE' : 'PICOCLAW'}: ${msg.content}`).join('\n\n')
    : "Nessuna conversazione precedente.";

  const memoriesSection = agentMemories ? `\n\nMEMORIA A LUNGO TERMINE (Regole apprese dall'agente):\n${agentMemories}\nAttieniti rigidamente a queste regole e preferenze apprese nelle interazioni passate.` : '';

  const prompt = draftingMode ? `
  Sei PicoClaw, un infallibile assistente giuridico esperto nella stesura di ATTI, LETTERE E CONTRATTI (Drafting Mode).
  ${memoriesSection}
  
  CRONOLOGIA DELLA CONVERSAZIONE (MEMORIA BREVE):
  ${historyString}
  
  CONTESTO UFFICIALE (Basi giuridiche per la stesura):
  ${context}
  
  RICHIESTA DELL'UTENTE:
  ${query}
  
  Istruzioni:
  1. Usa il CONTESTO UFFICIALE come base di legittimità per stendere l'atto, il contratto o la lettera richiesta.
  2. Redigi un documento formale, completo, pronto all'uso professionale (formato Markdown con titoli e paragrafi).
  3. Adotta un tono istituzionale, verboso se necessario per la precisione, e giuridicamente rigoroso.
  4. Se mancano dettagli chiave (es. nomi, importi, date), inserisci campi segnaposto chiari come [INSERIRE NOME] o [INSERIRE DATA].
  5. Resituisci SOLO il testo del documento richiesto, senza introdurlo con frasi come "Ecco la bozza:" o simili.
  ` : `
  Sei Atena, l'epitome dell'intelligenza artificiale legale.
  ${memoriesSection}
  
  CRONOLOGIA DELLA CONVERSAZIONE (MEMORIA BREVE):
  ${historyString}
  
  CONTESTO UFFICIALE (Documenti recuperati per l'ultima domanda):
  ${context}
  
  DOMANDA ATTUALE DELL'UTENTE:
  ${query}
  
  Istruzioni per l'UX (User Experience) ed Estetica del Testo:
  1. GUIDA VERSO LA VERITÀ: Rispondi in modo FATTUALE, DIRETTO e GESTIBILE (non caricante).
  2. STRUTTURA PULITA: Usa paragrafi brevi, elenchi puntati concisi e bold solo per le parole chiave essenziali (non usare mai bold per intere frasi lunghe).
  3. CHIAREZZA ASSOLUTA: Rispondi immediatamente alla domanda, offrendo i riferimenti normativi (es. Art. 2043) senza troppi giri di parole o verbosità inutile.
  4. ACCURATEZZA ESTREMA (ANTI-ALLUCINAZIONE): Basa la tua risposta *esclusivamente* sui documenti forniti nel CONTESTO UFFICIALE. Se le informazioni presenti non sono sufficienti per rispondere in modo completo e accurato, DEVI dichiarare esplicitamente "Non ho trovato informazioni sufficienti nei documenti ufficiali per rispondere a questa domanda." Non inventare MAI risposte, leggi, numeri o articoli.
  5. Evita muri di testo: suddividi il ragionamento in 2 o 3 punti chiave facilmente assimilabili.
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const generateTenthManRebuttal = async (query: string, context: string, originalAnswer: string) => {
  // Protocollo del Decimo Uomo: Usa lo stesso modello per generare la confutazione
  const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
  SEI IL "DECIMO UOMO" (TENTH MAN PROTOCOL) DELLA PIATTAFORMA Atena.
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
  2. Cerca attivamente "allucinazioni" (affermazioni non supportate esplicitamente dal CONTESTO UFFICIALE). Se trovi affermazioni non verificate, denunciale apertamente.
  3. Spiega quali elementi normativi supportano la tesi primaria e quali elementi (eccezioni, scappatoie, interpretazioni alternative) potrebbero metterne in discussione l'applicabilità assoluta.
  4. Fornisci un quadro chiaro e bilanciato dei rischi legali associati alla tesi primaria.
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
  const prompt = `Un'illustrazione concettuale astratta, fotorealistica ad alta risoluzione, puramente simbolica e senza ALCUNA parola o lettera scritta, che rappresenta visivamente il concetto: ${topic}. Stile fotografico contemporaneo e istituzionale.`;
  
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
    SEI IL MODULO DI FACT-CHECKING AUTONOMO DI Atena.
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
      "methodology": "Verifica automatica incrociata contro fonti ufficiali nel database Atena. Ogni affermazione è stata confrontata con i documenti legali indicizzati."
    }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Clean up potential markdown wrapping
    const cleanJson = text.replace(/^```json?\s*/, '').replace(/\s*```$/, '').trim();
    
    const report: FactCheckReport = JSON.parse(cleanJson);
    
    // Validate & sanitize
    report.overall_score = Math.min(100, Math.max(0, Math.round(report.overall_score)));
    report.methodology = "Verifica automatica incrociata contro fonti ufficiali nel database Atena. Ogni affermazione è stata confrontata con i documenti legali indicizzati.";
    
    console.log(`[Fact-Check] Score: ${report.overall_score}/100 | Claims: ${report.total_claims} (✅${report.verified} ⚠️${report.partial} ❌${report.unsupported} ℹ️${report.opinion})`);
    
    return report;
  } catch (error) {
    console.error("[Fact-Check] Error:", error);
    return null;
  }
};

// ============================================================================
// SOCIAL ECHO PROTOCOL: Viral Summarization
// ============================================================================

export const generateSocialSummary = async (originalQuery: string, complexResponse: string) => {
  const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = `
  Sei Atena Social, l'anima divulgativa di LexAI. Il tuo scopo è tradurre "legalese" complesso in pillole iper-coinvolgenti per i social media (Instagram, TikTok, Twitter).
  
  L'UTENTE HA CHIESTO:
  "${originalQuery}"
  
  LA TUA RISPOSTA TECNICA COMPLETA È STATA:
  "${complexResponse}"
  
  ISTRUZIONI PER LA TRADUZIONE VIRALE:
  Crea un output testuale brevissimo (massimo 100 parole in totale), formattato ESATTAMENTE con questa struttura:
  
  1. HOOK: Una frase d'apertura (massimo una riga) scioccante, urgente o super-relatable per catturare l'attenzione (con 1-2 emoji). Es. "Attenzione: pensi che il tuo padrone di casa possa fare questo? 🚨"
  2. I FATTI (3 Bullet Points): Riduci il cuore della risposta in 3 punti elenco semplicissimi (livello terza media). Niente paroloni, dritto al sodo. Usa le spunte ✅ o le croci ❌.
  3. L'AUTORITÀ: Una riga piccolissima in corsivo che cita la legge principale (es. "*Art. 1590 Codice Civile*") per dare autorità.
  4. CALL TO ACTION: La frase finale esatta: "👉 Scopri come difenderti e analizza il tuo caso gratuito su lexai.it"
  
  NOTA BENE: Nessuna introduzione, nessuna conclusione. Solo l'HOOK, i 3 BULLET, l'AUTORITÀ e la CTA, separati da ritorni a capo puliti.
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
};
