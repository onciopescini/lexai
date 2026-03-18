import { env } from 'process';
import { BaseAgent } from './BaseAgent';
import { AgentInput, AgentPolicy } from './types';

export interface LiveWebInput extends AgentInput {
  baseThesis: string;
}

export class LiveWebAgent extends BaseAgent {
  name = 'LiveWebAgent';
  description = 'Executes real-time Fact-Checking and jurisprudence retrieval using Perplexity Sonar.';
  
  policy: AgentPolicy = {
    name: 'LiveWebFactCheckPolicy_v1',
    permissions: {
      network: 'OUTBOUND_ALLOWED', // Requires external internet access via Perplexity
      fileSystem: 'NO_ACCESS'     // No local disk writes allowed
    },
    resourceLimits: {
      maxTokens: 1000,
      timeoutMs: 25000
    }
  };

  protected async performExecution(input: AgentInput): Promise<string | null> {
    const { query } = input;
    const liveWebInput = input as LiveWebInput;
    const baseThesis = liveWebInput.baseThesis || input.context?.documents || '';

    const apiKey = env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      console.warn(`[Agent ${this.name}] PERPLEXITY_API_KEY not found. Search skipped.`);
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
          model: "sonar", // Web-connected model
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
          temperature: 0.1, // Minimum creativity, maximum factuality
          max_tokens: this.policy.resourceLimits.maxTokens
        })
      });

      if (!response.ok) {
        console.error(`[Agent ${this.name}] API Error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error(`[Agent ${this.name}] Execution Exception:`, error);
      return null;
    }
  }
}
