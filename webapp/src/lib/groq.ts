/**
 * Groq LLM Fallback — Ultra-fast inference as fallback for Gemini
 * Ported from GravityClaw's multi-model architecture
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Calls Groq's ultra-fast LLM (llama-3.3-70b) as a fallback when Gemini is slow or rate-limited.
 * Average response time: 200-500ms vs Gemini's 1-3s.
 */
export async function callGroq(
  messages: GroqMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'llama-3.3-70b-versatile',
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Semantic reranking: sorts retrieved documents by relevance to query 
 * using a lightweight Groq call that scores each document 1-10.
 * Inspired by GravityClaw's semantic_search.ts reranking module.
 */
export async function rerankDocuments(
  query: string,
  documents: Array<{ title: string; content: string; source_url: string; similarity: number }>
): Promise<typeof documents> {
  if (!GROQ_API_KEY || documents.length <= 1) {
    return documents; // No reranking needed or possible
  }

  try {
    const docSummaries = documents.map((doc, i) => 
      `[${i}] "${doc.title}" — ${doc.content.substring(0, 200)}...`
    ).join('\n');

    const response = await callGroq([
      {
        role: 'system',
        content: 'You are a legal document relevance scorer. Given a legal query and a list of documents, return ONLY a JSON array of document indices sorted by relevance (most relevant first). Example: [2,0,1,3]'
      },
      {
        role: 'user', 
        content: `Query: "${query}"\n\nDocuments:\n${docSummaries}\n\nReturn the indices sorted by relevance as a JSON array:`
      }
    ], { temperature: 0, max_tokens: 100 });

    // Parse the ranking
    const match = response.match(/\[[\d,\s]+\]/);
    if (match) {
      const indices: number[] = JSON.parse(match[0]);
      const reranked = indices
        .filter(i => i >= 0 && i < documents.length)
        .map(i => documents[i]);
      
      // Add any documents that weren't in the ranking
      for (const doc of documents) {
        if (!reranked.includes(doc)) {
          reranked.push(doc);
        }
      }
      
      console.log(`[Rerank] Groq reranked ${documents.length} docs: [${indices.join(',')}]`);
      return reranked;
    }
  } catch (error) {
    console.log(`[Rerank] Groq reranking failed, using original order: ${error}`);
  }

    return documents; // Fallback to original order
}

export type UserIntent = 'research' | 'drafting' | 'history' | 'general_chat';

export interface IntentAnalysis {
  intent: UserIntent;
  confidence: number;
  reasoning: string;
}

/**
 * Agentic RAG Router: Classifies the user's intent to route to the optimal workflow.
 * This saves database queries and improves response specificity.
 */
export async function analyzeIntent(query: string): Promise<IntentAnalysis> {
  if (!process.env.GROQ_API_KEY) {
    return { intent: 'research', confidence: 1.0, reasoning: 'Fallback (No API Key)' };
  }

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
      console.log(`[Router] Intent classified as '${parsed.intent}' (Confidence: ${parsed.confidence})`);
      return parsed;
    }
  } catch (error) {
    console.log(`[Router] Intent classification failed, defaulting to research: ${error}`);
  }

  return { intent: 'research', confidence: 0.5, reasoning: 'Fallback due to error' };
}
