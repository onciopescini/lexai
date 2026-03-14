-- Migration: Setup picoclaw_live_events for Realtime Dashboard

-- 1. Create the table for live daemon events
CREATE TABLE IF NOT EXISTS public.picoclaw_live_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    level TEXT NOT NULL CHECK (level IN ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'SYNC')),
    agent_name TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.picoclaw_live_events ENABLE ROW LEVEL SECURITY;

-- 3. Create policies (Allow inserting from service role, viewing from authenticated/anon if needed for the dashboard)
-- Note: Adjust these based on your exact security needs for the dashboard.
CREATE POLICY "Allow anon read access to live events" 
ON public.picoclaw_live_events FOR SELECT 
USING (true); 

CREATE POLICY "Allow service role insert access to live events" 
ON public.picoclaw_live_events FOR INSERT 
WITH CHECK (true); -- In practice, auth.role() = 'service_role' or similar, but the daemon uses the service key so it bypasses RLS anyway.

-- 4. Explicitly enable Realtime for this table
-- This is crucial for the Next.js frontend to subscribe to changes
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.picoclaw_live_events;

-- Optional: Create an index on created_at for faster querying of recent events
CREATE INDEX IF NOT EXISTS idx_picoclaw_live_events_created_at ON public.picoclaw_live_events(created_at DESC);
