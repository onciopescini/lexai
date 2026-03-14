-- Creazione tabella per le lezioni di Educazione Civica Autonoma generate da PicoClaw
CREATE TABLE IF NOT EXISTS public.civic_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trend_topic TEXT NOT NULL,
    lesson_title TEXT NOT NULL,
    content_script TEXT NOT NULL,
    image_prompt TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permessi (RLS)
ALTER TABLE public.civic_lessons ENABLE ROW LEVEL SECURITY;

-- Permettiamo a tutti di leggere le lezioni (utenti anonimi e autenticati)
CREATE POLICY "Allow public read access to civic_lessons"
ON public.civic_lessons
FOR SELECT
USING (true);

-- Permettiamo al service role / agenti Python di inserire e modificare
CREATE POLICY "Allow service role insert civic_lessons"
ON public.civic_lessons
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow service role update civic_lessons"
ON public.civic_lessons
FOR UPDATE
USING (true)
WITH CHECK (true);
