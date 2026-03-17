-- Tabelle per la Memoria Cognitiva (LTM) dell'Agente Atena

-- 1. Tabella delle Sessioni di Chat (Raw Input)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL, -- Identificativo della sessione o utente
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    analyzed BOOLEAN DEFAULT false -- Flag per indicare se il background job ha già analizzato questa chat
);

-- Indice per velocizzare la ricerca di chat non analizzate
CREATE INDEX IF NOT EXISTS idx_chat_sessions_analyzed ON public.chat_sessions(analyzed);

-- 2. Tabella delle Memorie dell'Agente (Insight Estratti)
CREATE TABLE IF NOT EXISTS public.agent_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memory_text TEXT NOT NULL, -- L'insight o istruzione estratta
    embedding vector(768), -- Vettore per la ricerca semantica (es. Nomic Embed Text)
    importance_score NUMERIC(3, 2) DEFAULT 1.0, -- Da 0.0 a 1.0 (quanto è importante questa memoria)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    source_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL -- Riferimento alla chat originale
);

-- Indice per abilitare la ricerca vettoriale rapida (HNSW) sulle memorie
CREATE INDEX IF NOT EXISTS agent_memories_embedding_idx 
ON public.agent_memories USING hnsw (embedding vector_ip_ops)
WITH (m = 16, ef_construction = 64);

-- Funzione per la ricerca di memorie rilevanti tramite RPC
CREATE OR REPLACE FUNCTION match_agent_memories(
    query_embedding vector(768),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id UUID,
    memory_text TEXT,
    importance_score NUMERIC,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        am.id,
        am.memory_text,
        am.importance_score,
        1 - (am.embedding <=> query_embedding) AS similarity
    FROM public.agent_memories am
    WHERE 1 - (am.embedding <=> query_embedding) > match_threshold
    ORDER BY am.importance_score DESC, similarity DESC
    LIMIT match_count;
END;
$$;
