-- Setup Knowledge Cache Table
-- This table stores verified Perplexity responses to reduce API costs over time.

CREATE TABLE IF NOT EXISTS public.verified_knowledge (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    query_hash text UNIQUE NOT NULL, -- SHA-256 of the normalized query for exact matches
    query_text text NOT NULL,
    query_embedding vector(768), -- Gemini embedding
    perplexity_response text NOT NULL,
    base_thesis text,
    fact_check_score text, -- 'verified', 'partially_verified', 'contradicted'
    hit_count integer DEFAULT 0,
    verified_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
    created_at timestamp with time zone DEFAULT now()
);

-- Create an HNSW index for fast semantic similarity search
CREATE INDEX IF NOT EXISTS verified_knowledge_embedding_idx 
ON public.verified_knowledge USING hnsw (query_embedding vector_ip_ops);

-- RPC Function to find cached knowledge by semantic similarity
-- We use a high threshold (e.g., 0.85) to ensure we only return highly relevant cached answers.
CREATE OR REPLACE FUNCTION match_verified_knowledge(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.85,
    match_count int DEFAULT 1
)
RETURNS TABLE (
    id uuid,
    query_text text,
    perplexity_response text,
    similarity float,
    verified_at timestamp with time zone,
    expires_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        vk.id,
        vk.query_text,
        vk.perplexity_response,
        1 - (vk.query_embedding <=> match_verified_knowledge.query_embedding) AS similarity,
        vk.verified_at,
        vk.expires_at
    FROM public.verified_knowledge vk
    WHERE 
        -- Ensure it's not expired
        vk.expires_at > now()
        -- Ensure similarity is above threshold
        AND 1 - (vk.query_embedding <=> match_verified_knowledge.query_embedding) > match_threshold
    ORDER BY vk.query_embedding <=> match_verified_knowledge.query_embedding
    LIMIT match_count;
END;
$$;
