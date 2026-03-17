-- [ATTENZIONE] Script per Sbloccare l'Ingestione Dati

-- Questa policy permette l'inserimento di dati nella tabella legal_documents
-- da parte dei nostri Python Harvester locali che usano l'anon key.

DROP POLICY IF EXISTS "Consenti Upload Anonimo Harvester" ON legal_documents;
CREATE POLICY "Consenti Upload Anonimo Harvester" ON legal_documents FOR INSERT WITH CHECK (true);

-- Permette anche l'upload nella tabella degli allarmi (Guardian)
DROP POLICY IF EXISTS "Consenti Inserimento Guardian" ON atena_guardian_alerts;
CREATE POLICY "Consenti Inserimento Guardian" ON atena_guardian_alerts FOR INSERT WITH CHECK (true);
