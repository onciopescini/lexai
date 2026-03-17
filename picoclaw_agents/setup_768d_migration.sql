-- ATTENZIONE: LA VIA DEL CONQUISTATORE
-- Questo script elimina la vecchia colonna vettoriale a 3072 dimensioni
-- e la ricrea a 768 dimensioni (formato ottimizzato per Gemini).
-- Questo comporterà l'azzeramento dei vettori per le 3852 righe esistenti,
-- ma ottimizzerà lo spazio e i costi per i milioni di articoli futuri.

-- 1. Eliminiamo i vecchi indici vettoriali (evita conflitti)
DROP INDEX IF EXISTS legal_documents_embedding_idx;
DROP INDEX IF EXISTS legal_documents_embedding_hnsw_idx;

-- 2. Eliminiamo la colonna vettoriale pesante a 3072 dimensioni
ALTER TABLE legal_documents DROP COLUMN IF EXISTS embedding;

-- 3. Ricreiamo la colonna "leggera" a 768 dimensioni
ALTER TABLE legal_documents ADD COLUMN embedding vector(768);

-- 4. Ricreiamo l'indice HNSW per la ricerca ultra-rapida
CREATE INDEX IF NOT EXISTS legal_documents_embedding_idx 
ON legal_documents USING hnsw (embedding vector_ip_ops)
WITH (m = 16, ef_construction = 64);

-- 5. Per sicurezza, ri-compiliamo la funzione di ricerca ibrida
-- in modo che PostgreSQL referenzi la nuova colonna correttamente.
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(3072), text, jsonb, int, float, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(3072), text, jsonb, int, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(3072), text, int, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(768), text, jsonb, int, float, float);
DROP FUNCTION IF EXISTS hybrid_search_legal_docs(vector(768), text, jsonb, int, float);

CREATE OR REPLACE FUNCTION hybrid_search_legal_docs(
    query_embedding vector(768),
    query_text text,
    filter jsonb DEFAULT '{}'::jsonb,
    match_count int DEFAULT 10,
    full_text_weight float DEFAULT 1.0, 
    semantic_weight float DEFAULT 1.0   
)
RETURNS TABLE (
    id bigint,
    title text,
    content text,
    source_url text,
    metadata jsonb,
    similarity float, 
    ts_rank float       
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
        LIMIT match_count * 2 
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
    combined_results AS (
        SELECT
            COALESCE(ss.id, ks.id)::bigint as id,
            COALESCE(ss.title, ld.title) as title,
            COALESCE(ss.content, ld.content) as content,
            COALESCE(ss.source_url, ld.source_url) as source_url,
            COALESCE(ss.metadata, ld.metadata) as metadata,
            COALESCE(ss.similarity, 0.0)::float as similarity,
            COALESCE(ks.ts_rank, 0.0)::float as ts_rank,
            (COALESCE(semantic_weight / (60 + ss.semantic_rank), 0.0))::float + 
            (COALESCE(full_text_weight / (60 + ks.keyword_rank), 0.0))::float as rrf_score
        FROM semantic_search ss
        FULL OUTER JOIN keyword_search ks ON ss.id = ks.id
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
