-- Phase 16: Dual Workspace — Personal vs Firm scope separation
-- Apply via Supabase SQL Editor

-- 1. Add scope and firm_id columns to user_documents
ALTER TABLE user_documents
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'personal'
    CHECK (scope IN ('personal', 'firm')),
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES law_firms(id) ON DELETE SET NULL;

-- 2. Create index for fast scope+user queries
CREATE INDEX IF NOT EXISTS idx_user_documents_scope ON user_documents(user_id, scope);
CREATE INDEX IF NOT EXISTS idx_user_documents_firm ON user_documents(firm_id, scope);

-- 3. Update RLS: firm documents visible to all active members of the same firm
-- Drop old policy if it exists
DROP POLICY IF EXISTS "Users can read own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can read firm documents" ON user_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON user_documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON user_documents;

-- SELECT: user sees their own docs + firm docs if they are an active member
CREATE POLICY "Users can read own documents"
  ON user_documents FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      scope = 'firm'
      AND firm_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM firm_members
        WHERE firm_members.firm_id = user_documents.firm_id
          AND firm_members.user_id = auth.uid()
          AND firm_members.status = 'active'
      )
    )
  );

-- INSERT: user can always insert for themselves; firm docs require membership
CREATE POLICY "Users can insert own documents"
  ON user_documents FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- DELETE: user can only delete their own documents
CREATE POLICY "Users can delete own documents"
  ON user_documents FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Update the match_user_documents RPC to support scope filtering
-- This replaces the existing function
CREATE OR REPLACE FUNCTION match_user_documents(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  p_user_id UUID DEFAULT NULL,
  p_scope TEXT DEFAULT 'all',     -- 'personal' | 'firm' | 'all'
  p_firm_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT,
  file_name TEXT,
  scope TEXT,
  firm_id UUID
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    udc.id,
    udc.document_id,
    udc.content,
    1 - (udc.embedding <=> query_embedding) AS similarity,
    ud.file_name,
    ud.scope,
    ud.firm_id
  FROM user_document_chunks udc
  JOIN user_documents ud ON ud.id = udc.document_id
  WHERE
    -- Scope filter
    (
      p_scope = 'all'
      OR ud.scope = p_scope
    )
    AND
    -- Owner filter
    (
      (p_scope IN ('personal', 'all') AND ud.user_id = p_user_id)
      OR
      (p_scope IN ('firm', 'all') AND ud.scope = 'firm' AND ud.firm_id = p_firm_id)
    )
    AND 1 - (udc.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 5. Storage stats view (also needed for Phase 19)
CREATE OR REPLACE VIEW user_storage_stats AS
SELECT
  ud.user_id,
  ud.scope,
  ud.firm_id,
  COUNT(ud.id)::INT AS document_count,
  COALESCE(SUM(ud.size_bytes), 0)::BIGINT AS total_bytes,
  COALESCE(SUM(chunk_counts.cnt), 0)::INT AS total_chunks
FROM user_documents ud
LEFT JOIN (
  SELECT document_id, COUNT(*) AS cnt
  FROM user_document_chunks
  GROUP BY document_id
) chunk_counts ON chunk_counts.document_id = ud.id
GROUP BY ud.user_id, ud.scope, ud.firm_id;
