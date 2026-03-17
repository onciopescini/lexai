-- ==============================================================================
-- Atena - Agentic Flow Resilience (Phase 2)
-- Setup Script: Database Webhook to Trigger Edge Function
-- ==============================================================================

-- Purpose: This script creates a database webhook using Supabase's pg_net
-- (or HTTP request extensions) to automatically ping the `agent_queue_worker`
-- Edge Function whenever a new row with status 'pending' is inserted into the 
-- `atena_agent_queue` table.

-- 1. Enable pg_net if not already enabled (Requires Supabase Pro/Enterprise or local setup)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.invoke_agent_worker_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_edge_function_url TEXT;
  v_anon_key TEXT;
  v_request_id BIGINT;
BEGIN
  -- We rely on the Supabase environment, fetching the URL from a secure vault
  -- or hardcoding it if using simple env vars.
  v_edge_function_url := current_setting('app.settings.edge_function_url', true);
  v_anon_key := current_setting('app.settings.anon_key', true);

  -- Fallback if settings are not defined via SQL roles (replace with real URL in production)
  IF v_edge_function_url IS NULL OR v_edge_function_url = '' THEN
     v_edge_function_url := 'https://[PROJECT_ID].supabase.co/functions/v1/agent_queue_worker';
  END IF;

  IF v_anon_key IS NULL OR v_anon_key = '' THEN
     v_anon_key := '[YOUR_ANON_KEY]'; -- Must be replaced with the actual service key in deployment
  END IF;

  -- Only trigger the worker if the newly inserted row is marked as 'pending'
  IF NEW.status = 'pending' THEN
    SELECT net.http_post(
        url := v_edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key
        ),
        body := jsonb_build_object(
            'type', 'INSERT',
            'table', 'atena_agent_queue',
            'record', row_to_json(NEW)
        )
    ) INTO v_request_id;
    
    RAISE NOTICE 'Webhook triggered for queue ID % (Request ID: %)', NEW.id, v_request_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger agent worker webhook: %', SQLERRM;
    RETURN NEW; -- Don't block the insert just because the webhook failed
END;
$$;

-- 3. Attach the Trigger to the Table
DROP TRIGGER IF EXISTS trg_ping_agent_worker ON public.atena_agent_queue;

CREATE TRIGGER trg_ping_agent_worker
AFTER INSERT ON public.atena_agent_queue
FOR EACH ROW
EXECUTE FUNCTION public.invoke_agent_worker_webhook();

-- ==============================================================================
-- FAILSAFE (pg_cron polling):
-- In case webhooks fail or we want batch processing, we can ALSO schedule
-- a cron job to wake the worker every 5 minutes to sweep 'pending' rows.
-- ==============================================================================

-- Ensure pg_cron is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule if already exists
SELECT cron.unschedule('sweep_pending_agent_queues');

-- Schedule to run every 5 minutes
SELECT cron.schedule(
    'sweep_pending_agent_queues',
    '*/5 * * * *',
    $$
    SELECT net.http_get(
        url := 'https://[PROJECT_ID].supabase.co/functions/v1/agent_queue_worker',
        headers := jsonb_build_object(
            'Authorization', 'Bearer [YOUR_ANON_KEY]'
        )
    );
    $$
);
