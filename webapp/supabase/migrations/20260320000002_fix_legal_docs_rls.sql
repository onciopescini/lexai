-- ==============================================
-- FIX: Secure legal_documents RLS Policy
-- ==============================================
-- Previously: CREATE POLICY "Public Read Access on legal_documents" ON legal_documents FOR SELECT TO public USING (true);
-- This allowed unauthenticated scraping.
-- Now: Restrict to authenticated users.

-- Drop the old insecure policy
DROP POLICY IF EXISTS "Public Read Access on legal_documents" ON public.legal_documents;

-- Create the new secure policy requiring authenticated role
CREATE POLICY "Authenticated Read Access on legal_documents" 
ON public.legal_documents 
FOR SELECT 
TO authenticated 
USING (true);

-- Ensure RLS is active
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
