-- ==============================================
-- LEXAI: Row Level Security (RLS) Lockdown
-- ==============================================
-- This script secures the core database vector table `legal_documents`
-- to allow the Next.js frontend to securely read document vectors 
-- while ONLY allowing the authorized API (Service Role) to write.

-- 1. Enable RLS on the semantic table
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing public policies if they exist
DROP POLICY IF EXISTS "Public Read Access on legal_documents" ON legal_documents;

-- 3. Create READ-ONLY policies for anonymous (frontend API) clients
--    (The chatbot needs to read chunks for RAG via the anon key)
CREATE POLICY "Public Read Access on legal_documents" 
ON legal_documents FOR SELECT 
TO public 
USING (true);

-- Success Message
SELECT 'RLS Lockdown applied to legal_documents. Security is complete.' as status;
