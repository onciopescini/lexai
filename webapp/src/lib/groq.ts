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
