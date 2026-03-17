    -- Atena Enterprise RAG: Hybrid Search Index Optimization (Scale & Sublime UX)
    -- This fixes the statement timeout issues when querying thousands of vectors.

    -- Create an HNSW index on the vector column using cosine distance
    -- Note: Requires pgvector extension 0.5.0+ 
    CREATE INDEX IF NOT EXISTS legal_documents_embedding_idx 
    ON legal_documents 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

    -- Also ensure the BM25 full-text search index is updated just in case
    -- (The generated column 'fts' was created in a previous script, we verify the GIN index)
    CREATE INDEX IF NOT EXISTS legal_documents_fts_idx 
    ON legal_documents 
    USING GIN (fts);

    -- (Optional but recommended) Increase statement timeout for heavy RRF queries
    -- This allows hybrid search complex queries to finish if the DB is under heavy load
    ALTER ROLE authenticator SET statement_timeout = '60s';
