import { BaseAgent } from './BaseAgent';
import { AgentInput, AgentPolicy } from './types';
import { getGenAI } from '../gemini'; 

export class PicoClawAgent extends BaseAgent {
  name = 'PicoClawAgent';
  description = 'Specialized legal drafting agent for formal acts, contracts, and letters based on official legal context.';
  
  policy: AgentPolicy = {
    name: 'PicoClawDraftingPolicy_v1',
    permissions: {
      network: 'RESTRICTED', // Only allows calls to Gemini API
      fileSystem: 'READ_ONLY'
    },
    resourceLimits: {
      maxTokens: 8000, // Drafting requires more tokens
      timeoutMs: 30000
    }
  };

  protected async performExecution(input: AgentInput): Promise<string> {
    const { query, context } = input;
    const history = context?.history || [];
    const docs = context?.documents || '';
    const memories = context?.systemMemories || '';

    const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const historyString = history.length > 0
      ? history.map((msg: {role: string, content: string}) => `${msg.role === 'user' ? 'UTENTE' : 'PICOCLAW'}: ${msg.content}`).join('\n\n')
      : "Nessuna conversazione precedente.";

    const memoriesSection = memories ? `\n\nMEMORIA A LUNGO TERMINE (Regole apprese dall'agente):\n${memories}\nAttieniti rigidamente a queste regole e preferenze apprese nelle interazioni passate.` : '';

    const prompt = `
    Sei PicoClaw, un infallibile assistente giuridico esperto nella stesura di ATTI, LETTERE E CONTRATTI (Drafting Mode).
    ${memoriesSection}
    
    CRONOLOGIA DELLA CONVERSAZIONE (MEMORIA BREVE):
    ${historyString}
    
    CONTESTO UFFICIALE (Basi giuridiche per la stesura):
    ${docs}
    
    RICHIESTA DELL'UTENTE:
    ${query}
    
    Istruzioni:
    1. Usa il CONTESTO UFFICIALE come base di legittimità per stendere l'atto, il contratto o la lettera richiesta.
    2. Redigi un documento formale, completo, pronto all'uso professionale (formato Markdown con titoli e paragrafi).
    3. Adotta un tono istituzionale, verboso se necessario per la precisione, e giuridicamente rigoroso.
    4. Se mancano dettagli chiave (es. nomi, importi, date), inserisci campi segnaposto chiari come [INSERIRE NOME] o [INSERIRE DATA].
    5. Resituisci SOLO il testo del documento richiesto, senza introdurlo con frasi come "Ecco la bozza:" o simili.
    6. NON GESTIRE ESPORTAZIONI: Non chiedere MAI all'utente se desidera ricevere il documento via email o su cloud. L'interfaccia utente ha già dei pulsanti dedicati per questo. Fornisci solo il testo e fermati.
    `;
    
    const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [prompt];
    if (context?.inlineData) {
      parts.push({ inlineData: context.inlineData });
    }
    
    const result = await model.generateContent(parts);
    return result.response.text();
  }
}
