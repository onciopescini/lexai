-- LEXAI Phase 8: PicoClaw Agent Memory System

CREATE TABLE IF NOT EXISTS public.agent_memory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_name VARCHAR NOT NULL,
    task_type VARCHAR NOT NULL,
    last_run_timestamp TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR DEFAULT 'SUCCESS',
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the Python script (since we are not using auth currently)
CREATE POLICY "Allow anonymous insert on agent_memory" ON public.agent_memory FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous select on agent_memory" ON public.agent_memory FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous update on agent_memory" ON public.agent_memory FOR UPDATE TO anon USING (true);
