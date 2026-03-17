-- ==============================================================================
-- Atena - Agentic Flow Resilience (Phase 2 & 3)
-- Setup Script for Async Research Queues & Human Review Board
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PHASE 2: Asynchronous Research Queue
-- ------------------------------------------------------------------------------
-- Purpose: Offload long-running tasks (e.g., Deep RAG, Drafting complex contracts)
-- from the Next.js synchronous API to background Edge Functions or Python workers.
-- This prevents Vercel timeouts and improves user experience during spikes.

CREATE TABLE IF NOT EXISTS public.atena_agent_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,          -- Identifies the user or chat session
    query TEXT NOT NULL,               -- The heavy processing task requested
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'review_needed', 'completed', 'failed')) DEFAULT 'pending',
    drafted_response TEXT,             -- The AI's generated draft (populated when review_needed or completed)
    sources_used JSONB,                -- Store references to used DB docs / web links
    error_message TEXT,                -- Any trace if the agent failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for background workers to quickly find pending tasks
CREATE INDEX IF NOT EXISTS idx_atena_queue_status ON public.atena_agent_queue(status);

-- ------------------------------------------------------------------------------
-- PHASE 3: The Review Board (Human-in-the-loop Governance)
-- ------------------------------------------------------------------------------
-- Purpose: Ensures high-stakes drafts or outputs from background agents are 
-- reviewed by a qualified human "Partner" before reaching the end user.

CREATE TABLE IF NOT EXISTS public.atena_review_board (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES public.atena_agent_queue(id) ON DELETE CASCADE,
    reviewer_id TEXT,                  -- Optional: ID of the human reviewer who claimed it
    original_draft TEXT NOT NULL,      -- The output produced by the background agent
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'revising')) DEFAULT 'pending',
    human_feedback TEXT,               -- Rebuttal or notes left by the human reviewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for the UI dashboard to show pending reviews
CREATE INDEX IF NOT EXISTS idx_atena_review_status ON public.atena_review_board(status);

-- ------------------------------------------------------------------------------
-- Triggers for automatic updated_at timestamp management
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_agentic_flow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_queue_updated ON public.atena_agent_queue;
CREATE TRIGGER trg_queue_updated
BEFORE UPDATE ON public.atena_agent_queue
FOR EACH ROW EXECUTE FUNCTION update_agentic_flow_timestamp();

DROP TRIGGER IF EXISTS trg_review_updated ON public.atena_review_board;
CREATE TRIGGER trg_review_updated
BEFORE UPDATE ON public.atena_review_board
FOR EACH ROW EXECUTE FUNCTION update_agentic_flow_timestamp();

-- ==============================================================================
-- Integration Path Documentation (Phase 2 & 3):
-- 1. Front-end detects severe 'drafting' intent -> Creates row in `atena_agent_queue`.
-- 2. Front-end returns immediate 202 Accepted: "Ricerca approfondita avviata..."
-- 3. Edge Function (or Python worker) triggered manually or via pg_cron picks 'pending' tasks.
-- 4. Worker executes Deep RAG, Perplexity, and Fact-Check.
-- 5. Worker updates queue row to 'review_needed' and creates row in `atena_review_board`.
-- 6. Human Reviewer logs into Atena Admin Panel -> Reads draft -> Approves/Rejects.
-- 7. If Approved, queue status -> 'completed'. Front-end (via Realtime) alerts user.
-- ==============================================================================
