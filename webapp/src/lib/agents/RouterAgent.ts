import { BaseAgent } from './BaseAgent';
import { AgentInput, AgentPolicy } from './types';
import { callGroq, IntentAnalysis } from '../groq';

export class RouterAgent extends BaseAgent {
  name = 'RouterAgent';
  description = 'Agentic Intent Classifier. Decides if a query requires RAG Research, Legal Drafting, Historical comparison, or is just general chat.';
  
  policy: AgentPolicy = {
    name: 'IntentRouterPolicy_v1',
    permissions: {
      network: 'RESTRICTED', // Groq API access only
      fileSystem: 'NO_ACCESS' // The router doesn't need file access
    },
    resourceLimits: {
      maxTokens: 150, // Intent classification is very short
      timeoutMs: 5000 // Requires ultra-fast response
    }
  };

  protected async performExecution(input: AgentInput): Promise<object> {
    const { query } = input;
    
    try {
      const prompt = `You are the brain of "Atena", an advanced AI legal assistant.
Analyze the user's query and classify their intent into exactly ONE of the following categories:
- "research": The user is asking a legal question, looking for laws, jurisprudence, or general legal information.
- "drafting": The user is asking you to write, draft, or create a legal document, contract, clause, or letter.
- "history": The user is explicitly asking to compare old versions of a law, asking how a law changed over time, or referring to the historical archive.
- "general_chat": The user is just saying hello, asking who you are, or making non-legal small talk.

User Query: "${query}"

Return ONLY a valid JSON object in this format, with no markdown formatting or other text:
{
  "intent": "research" | "drafting" | "history" | "general_chat",
  "confidence": <float between 0.0 and 1.0>,
  "reasoning": "<brief explanation>"
}`;

      const response = await callGroq([
        { role: 'system', content: 'You are an intent classification engine. You output only raw, valid JSON.' },
        { role: 'user', content: prompt }
      ], { temperature: 0, max_tokens: 150 });

      const cleanJson = response.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson) as IntentAnalysis;
      
      if (['research', 'drafting', 'history', 'general_chat'].includes(parsed.intent)) {
        console.log(`[RouterAgent] Intent classified as '${parsed.intent}' (Confidence: ${parsed.confidence})`);
        return parsed;
      }
    } catch (error) {
      console.error(`[RouterAgent] Intent classification failed:`, error);
    }

    return { intent: 'research', confidence: 0.5, reasoning: 'Fallback due to error in Agent reasoning.' };
  }
}
