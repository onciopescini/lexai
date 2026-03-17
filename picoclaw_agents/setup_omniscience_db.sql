-- MEGA-CAMPAGNA 0: L'Occhio di Roma (Assimilazione Totale)
-- Database schema upgrades stringenti per supportare l'ingestione massiva
-- di tutta la giurisprudenza Italiana ed Europea.

-- 1. Aggiungiamo colonne strutturate alla tabella principale per filtraggio vettoriale
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS jurisdiction TEXT, -- e.g., 'IT', 'EU'
ADD COLUMN IF NOT EXISTS hierarchy TEXT,    -- e.g., 'Constitution', 'Civil Code', 'Directive'
ADD COLUMN IF NOT EXISTS law_status TEXT,   -- e.g., 'In Force', 'Repealed', 'Modified'
ADD COLUMN IF NOT EXISTS date_enacted DATE, 
ADD COLUMN IF NOT EXISTS article_number TEXT;

-- 2. Creiamo un indice B-Tree composto per accelerare i filtri meta-dati prima del calcolo vettoriale
CREATE INDEX IF NOT EXISTS idx_legal_docs_metadata 
ON legal_documents (jurisdiction, hierarchy, law_status);

-- 3. Creiamo la tabella per la CAMPAGNA 1: Il Guardiano
CREATE TABLE IF NOT EXISTS atena_guardian_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    impact_level TEXT DEFAULT 'Medium', -- High, Medium, Low
    target_audience TEXT, -- e.g., 'Aziende E-commerce', 'Lavoratori Dipendenti'
    source_url TEXT,
    date_published DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indice sulle date per le dashboard
CREATE INDEX IF NOT EXISTS idx_guardian_alerts_date ON atena_guardian_alerts(date_published DESC);

-- Abilitiamo la RLS sul Guardian
ALTER TABLE atena_guardian_alerts ENABLE ROW LEVEL SECURITY;

-- Policy di lettura pubblica (chiunque può leggere gli alert del Guardian)
CREATE POLICY "Public profiles are viewable by everyone." 
ON atena_guardian_alerts FOR SELECT USING (true);