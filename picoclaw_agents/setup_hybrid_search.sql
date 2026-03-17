-- Atena Enterprise RAG: Hybrid Search Implementation
-- Combines pgvector semantic search with PostgreSQL Full-Text Search (BM25 equivalent)
-- using Reciprocal Rank Fusion (RRF).

-- Step 1: Create a generated tsvector column for fast full-text search
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('italian', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(content, '')), 'B')
) STORED;

-- Step 2: Create a GIN index on the fts column to speed up text queries
CREATE INDEX IF NOT EXISTS legal_documents_fts_idx ON legal_documents USING GIN (fts);

-- Step 3: Define the Hybrid Search RPC
-- We use Reciprocal Rank Fusion to combine the vector similarity rank 
-- with the full-text search rank.
-- Drop various possible old signatures to ensure a clean slate
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector, text, jsonb, int, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector, text, jsonb, int, float, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(768), text, jsonb, int, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(768), text, int, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(768), text, jsonb, int, float, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(3072), text, jsonb, int, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(3072), text, int, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(3072), text, jsonb, int, float, float);


CREATE OR REPLACE FUNCTION hybrid_search_legal_docs(
    query_embedding vector(768),
    query_text text,
    filter jsonb DEFAULT '{}'::jsonb,
    match_count int DEFAULT 10,
    full_text_weight float DEFAULT 1.0, -- Multiplier for FTS rank importance. 1.0 is equal weight.
    semantic_weight float DEFAULT 1.0   -- Multiplier for Semantic rank importance.
)
RETURNS TABLE (
    id bigint,
    title text,
    content text,
    source_url text,
    metadata jsonb,
    similarity float, -- Semantic similarity score
    ts_rank float       -- Text search rank score
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_variable
BEGIN
    RETURN QUERY
    WITH semantic_search AS (
        SELECT 
            ld.id::bigint,
            ld.title,
            ld.content,
            ld.source_url,
            ld.metadata,
            (1 - (ld.embedding <=> query_embedding))::float as similarity,
            RANK() OVER (ORDER BY ld.embedding <=> query_embedding) as semantic_rank
        FROM legal_documents ld
        WHERE ld.metadata @> filter
        ORDER BY ld.embedding <=> query_embedding
        LIMIT match_count * 2 -- Fetch extra for better fusion
    ),
    keyword_search AS (
        SELECT 
            ld.id::bigint,
            ts_rank_cd(ld.fts, plainto_tsquery('italian', query_text))::float as ts_rank,
            RANK() OVER (ORDER BY ts_rank_cd(ld.fts, plainto_tsquery('italian', query_text)) DESC) as keyword_rank
        FROM legal_documents ld
        WHERE ld.fts @@ plainto_tsquery('italian', query_text)
          AND ld.metadata @> filter
        ORDER BY ts_rank DESC
        LIMIT match_count * 2
    ),
    -- Combine ranks using Reciprocal Rank Fusion (RRF)
    -- RRF formula: 1 / (k + rank)
    -- We use a constant k=60 which is standard in information retrieval
    combined_results AS (
        SELECT
            COALESCE(ss.id, ks.id)::bigint as id,
            COALESCE(ss.title, ld.title) as title,
            COALESCE(ss.content, ld.content) as content,
            COALESCE(ss.source_url, ld.source_url) as source_url,
            COALESCE(ss.metadata, ld.metadata) as metadata,
            COALESCE(ss.similarity, 0.0)::float as similarity,
            COALESCE(ks.ts_rank, 0.0)::float as ts_rank,
            -- Calculate RRF score. If a doc is missing from one search, its rank is treated as infinity (score 0).
            (COALESCE(semantic_weight / (60 + ss.semantic_rank), 0.0))::float + 
            (COALESCE(full_text_weight / (60 + ks.keyword_rank), 0.0))::float as rrf_score
        FROM semantic_search ss
        FULL OUTER JOIN keyword_search ks ON ss.id = ks.id
        -- We join with original table to get text fields if it only match in FTS
        LEFT JOIN legal_documents ld ON ks.id = ld.id AND ss.id IS NULL
    )
    SELECT 
        cr.id, 
        cr.title, 
        cr.content, 
        cr.source_url, 
        cr.metadata,
        cr.similarity,
        cr.ts_rank
    FROM combined_results cr
    ORDER BY cr.rrf_score DESC
    LIMIT match_count;
END;
$$;
