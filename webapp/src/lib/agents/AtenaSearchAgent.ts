import { BaseAgent } from './BaseAgent';
import { AgentInput, AgentPolicy } from './types';
import { getGenAI } from '../gemini'; // You may need to export getGenAI from gemini.ts or relocate it

export class AtenaSearchAgent extends BaseAgent {
  name = 'AtenaSearchAgent';
  description = 'Agent responsible for standard legal RAG synthesis and factual answering based strictly on official retrieved documents.';
  
  policy: AgentPolicy = {
    name: 'AtenaSearchPolicy_v1',
    permissions: {
      network: 'RESTRICTED', // Only allows calls to Gemini API
      fileSystem: 'READ_ONLY'
    },
    resourceLimits: {
      maxTokens: 4000,
      timeoutMs: 15000
    }
  };

  protected async performExecution(input: AgentInput): Promise<string> {
    const { query, context } = input;
    const history = context?.history || [];
    const docs = context?.documents || '';
    const memories = context?.systemMemories || '';

    // Model Setup
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Build short-term memory
    const historyString = history.length > 0
      ? history.map((msg: {role: string, content: string}) => `${msg.role === 'user' ? 'UTENTE' : 'ATENA'}: ${msg.content}`).join('\n\n')
      : "Nessuna conversazione precedente.";

    const memoriesSection = memories ? `\n\nMEMORIA A LUNGO TERMINE (Regole apprese dall'agente):\n${memories}\nAttieniti rigidamente a queste regole e preferenze apprese nelle interazioni passate.` : '';

    const prompt = `
    Sei Atena, l'epitome dell'intelligenza artificiale legale.
    ${memoriesSection}
    
    CRONOLOGIA DELLA CONVERSAZIONE (MEMORIA BREVE):
    ${historyString}
    
    CONTESTO UFFICIALE (Documenti recuperati per l'ultima domanda):
    ${docs}
    
    DOMANDA ATTUALE DELL'UTENTE:
    ${query}
    
    Istruzioni per l'UX (User Experience) ed Estetica del Testo:
    1. GUIDA VERSO LA VERITÀ: Rispondi in modo FATTUALE, DIRETTO e GESTIBILE (non caricante).
    2. STRUTTURA PULITA: Usa paragrafi brevi, elenchi puntati concisi e bold solo per le parole chiave essenziali (non usare mai bold per intere frasi lunghe).
    3. CHIAREZZA ASSOLUTA: Rispondi immediatamente alla domanda, offrendo i riferimenti normativi (es. Art. 2043) senza troppi giri di parole o verbosità inutile.
    4. ACCURATEZZA ESTREMA (ANTI-ALLUCINAZIONE): Basa la tua risposta *esclusivamente* sui documenti forniti nel CONTESTO UFFICIALE. Se le informazioni presenti non sono sufficienti per rispondere in modo completo e accurato, DEVI dichiarare esplicitamente "Non ho trovato informazioni sufficienti nei documenti ufficiali per rispondere a questa domanda." Non inventare MAI risposte, leggi, numeri o articoli.
    5. Evita muri di testo: suddividi il ragionamento in 2 o 3 punti chiave facilmente assimilabili.
    6. MAI GESTIRE L'ESPORTAZIONE: NON chiedere MAI all'utente se desidera ricevere il file via email o su cloud, né chiedere conferme finali. L'esportazione è gestita automaticamente dai pulsanti dell'interfaccia. Fornisci semplicemente la risposta giuridica e fermati.
    `;
    
    const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [prompt];
    if (context?.inlineData) {
      parts.push({ inlineData: context.inlineData });
    }
    
    const result = await model.generateContent(parts);
    return result.response.text();
  }
}
