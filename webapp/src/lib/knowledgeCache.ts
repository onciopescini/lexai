import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

export interface CachedKnowledge {
  id: string;
  query_text: string;
  perplexity_response: string;
  similarity?: number;
  fact_check_score?: string;
  verified_at: string;
  expires_at: string;
}

/**
 * Normalizza una query per la generazione dell'hash (rimuove spazi extra, lowercase)
 */
function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Genera un hash SHA-256 univoco per la query
 */
export function generateQueryHash(query: string): string {
  const normalized = normalizeQuery(query);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Cerca una risposta verificata nella cache.
 * Usa prima l'exact match tramite hash, poi il match semantico tramite embedding.
 */
export async function findCachedKnowledge(
  query: string, 
  embedding: number[], 
  semanticThreshold = 0.85
): Promise<CachedKnowledge | null> {
  // 1. Exact Match via Hash
  const hash = generateQueryHash(query);
  const { data: exactMatch, error: exactError } = await supabaseAdmin
    .from('verified_knowledge')
    .select('*')
    .eq('query_hash', hash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!exactError && exactMatch) {
    console.log(`[KnowledgeCache] EXACT HIT for query: "${query}"`);
    // Increment hit count asynchronously
    incrementHitCount(exactMatch.id);
    return exactMatch as CachedKnowledge;
  }

  // 2. Semantic Match via Vector Search
  const { data: semanticMatches, error: semanticError } = await supabaseAdmin.rpc('match_verified_knowledge', {
    query_embedding: embedding,
    match_threshold: semanticThreshold,
    match_count: 1
  });

  if (!semanticError && semanticMatches && semanticMatches.length > 0) {
    const match = semanticMatches[0];
    console.log(`[KnowledgeCache] SEMANTIC HIT for query: "${query}" (Similarity: ${match.similarity})`);
    // Increment hit count asynchronously
    incrementHitCount(match.id);
    return match as CachedKnowledge;
  }

  return null; // Cache MISS
}

/**
 * Memorizza un nuovo risultato verificato da Perplexity nel Knowledge Cache.
 */
export async function cacheKnowledge(
  query: string,
  embedding: number[],
  perplexityResponse: string,
  baseThesis: string = '',
  factCheckScore: string = 'verified'
): Promise<void> {
  const hash = generateQueryHash(query);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Scadenza standard: 30 giorni

  const { error } = await supabaseAdmin.from('verified_knowledge').upsert({
    query_hash: hash,
    query_text: query,
    query_embedding: embedding,
    perplexity_response: perplexityResponse,
    base_thesis: baseThesis,
    fact_check_score: factCheckScore,
    verified_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    hit_count: 0
  }, { onConflict: 'query_hash' });

  if (error) {
    console.error(`[KnowledgeCache] Errore durante il salvataggio in cache:`, error);
  } else {
    console.log(`[KnowledgeCache] Nuova conoscenza memorizzata per la query: "${query}"`);
  }
}

/**
 * Incrementa il contatore di utilizzi di una determinata entry in cache.
 */
async function incrementHitCount(id: string) {
  try {
    const { data } = await supabaseAdmin.rpc('increment_cache_hit', { row_id: id });
    if (!data) {
      // Fallback manual update se la RPC non esiste
      await supabaseAdmin.from('verified_knowledge')
        .update({ hit_count: 1 }) // Simplification per evitare fetch + update se rpc manca
        .eq('id', id);
    }
  } catch {
    // Silently fail per non bloccare il flusso principale
  }
}
