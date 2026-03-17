-- ==============================================================================
-- Atena - Mission & Real Metrics Alignment (Phase 4)
-- Setup Script per Telemetria della Verità e Accuratezza
-- ==============================================================================

-- Purpose: Questa tabella non traccerà analytics di marketing (click, visite),
-- ma *metriche di accuratezza del motore legale*. Tracceremo quanto spesso il 
-- "Decimo Uomo" interviene, il tasso di allucinazioni bloccate e il feedback
-- degli utenti (avvocati/cittadini) sull'effettiva correttezza.

CREATE TABLE IF NOT EXISTS public.atena_truth_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,                  -- Identificatore della chat o dell'utente
    query_text TEXT NOT NULL,                  -- La domanda posta
    tenth_man_triggered BOOLEAN DEFAULT false, -- Il protocollo Decimo Uomo ha contestato l'IA primaria?
    hallucination_prevented BOOLEAN DEFAULT false, -- La risposta primaria è stata scartata/bloccata prima della UI?
    primary_ai_model TEXT,                     -- Es: 'gemini-2.5-flash'
    sources_count INTEGER DEFAULT 0,           -- Quanti documenti ufficiali sono stati trovati nel DB?
    user_feedback_score INTEGER DEFAULT NULL CHECK (user_feedback_score BETWEEN -1 AND 1), -- +1 (Corretto), 0 (Neutro), -1 (Scorretto/Allucinazione)
    user_feedback_notes TEXT,                  -- Testo opzionale se l'utente segnala un errore
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indici per le dashboard di accuratezza
CREATE INDEX IF NOT EXISTS idx_telemetry_feedback ON public.atena_truth_telemetry(user_feedback_score);
CREATE INDEX IF NOT EXISTS idx_telemetry_tenth_man ON public.atena_truth_telemetry(tenth_man_triggered);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON public.atena_truth_telemetry(created_at);

-- Policy RLS minime
ALTER TABLE public.atena_truth_telemetry ENABLE ROW LEVEL SECURITY;
-- Permetti l'inserimento anonimo dei log
CREATE POLICY "Allow anonymous inserts to truth telemetry" 
ON public.atena_truth_telemetry FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- ==============================================================================
-- Come usarlo nella UI/App:
-- 1. Nel file route.ts, dopo aver generato la risposta, fai un INSERT in questa 
--    tabella segnando se il Decimo Uomo ha trovato contraddizioni.
-- 2. Nella UI della Chat, aggiungi i pollici Su/Giù. Se un utente clicca Giù, 
--    esegui un UPDATE su questa riga impostando `user_feedback_score = -1` 
--    e chiedendo "Quale legge ho sbagliato?".
-- ==============================================================================
