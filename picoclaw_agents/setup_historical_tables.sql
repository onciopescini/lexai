-- Create table for historical legal articles
CREATE TABLE IF NOT EXISTS legal_historical_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codice VARCHAR(255) NOT NULL, -- es: 'Codice Civile', 'Codice Penale', 'Costituzione'
    libro VARCHAR(255), -- es: 'Libro V - Del Lavoro'
    titolo VARCHAR(255), -- es: 'Titolo II'
    capo VARCHAR(255), -- es: 'Capo I'
    articolo_num VARCHAR(50) NOT NULL, -- es: '2086'
    articolo_titolo VARCHAR(500), -- es: 'Gestione dell''impresa'
    testo TEXT NOT NULL,
    versione_nome VARCHAR(255), -- es: 'Testo Originale 1942', 'D.Lgs. 14/2019'
    data_entrata_in_vigore DATE,
    data_abrogazione DATE, -- NULL if currently active
    is_vigente BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_legal_hist_codice ON legal_historical_articles(codice);
CREATE INDEX IF NOT EXISTS idx_legal_hist_articolo ON legal_historical_articles(articolo_num);

-- Configure Row Level Security (RLS)
ALTER TABLE legal_historical_articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the webapp)
CREATE POLICY "Allow public read access" ON legal_historical_articles
    FOR SELECT USING (true);

-- Allow public insert access (for the Picoclaw crawlers)
CREATE POLICY "Allow public insert access" ON legal_historical_articles
    FOR INSERT WITH CHECK (true);

-- Allow public update access (for the Picoclaw crawlers if they need to update is_vigente)
CREATE POLICY "Allow public update access" ON legal_historical_articles
    FOR UPDATE USING (true);
