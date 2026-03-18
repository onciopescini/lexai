import { BaseAgent } from './BaseAgent';
import { AgentInput, AgentPolicy } from './types';
import { getGenAI } from '../gemini'; 

export interface TenthManInput extends AgentInput {
  originalAnswer: string;
}

export class TenthManAgent extends BaseAgent {
  name = 'TenthManAgent';
  description = 'Executes the Tenth Man Protocol to provide objective cross-examination of primary AI responses.';
  
  policy: AgentPolicy = {
    name: 'TenthManProtocolPolicy_v1',
    permissions: {
      network: 'RESTRICTED',
      fileSystem: 'READ_ONLY'
    },
    resourceLimits: {
      maxTokens: 3000,
      timeoutMs: 20000
    }
  };

  protected async performExecution(input: AgentInput): Promise<string> {
    const { query, context } = input;
    // We expect the Router/Orchestrator to pass the original answer inside context.documents or via an extended input.
    // For simplicity, we cast the input to our extended interface
    const tenthManInput = input as TenthManInput;
    const originalAnswer = tenthManInput.originalAnswer || context?.documents || '';
    const docs = context?.documents || '';
    
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
    SEI IL "DECIMO UOMO" (TENTH MAN PROTOCOL) DELLA PIATTAFORMA Atena.
    Il tuo compito è fornire una verifica incrociata (Cross-Examination) oggettiva della risposta dell'IA primaria.
    Non usare un tono polemico o severo. Mantieni un linguaggio analitico, esplicativo e imparziale.
    
    DOMANDA ORIGINALE:
    ${query}
    
    FONTI UFFICIALI (CONTESTO):
    ${docs}
    
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
  }
}
