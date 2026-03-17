-- Enable the "pg_cron" extension
create extension if not exists pg_cron;

-- Enable the "pg_net" extension to make HTTP requests
create extension if not exists pg_net;

-- Create the Heartbeat Cron Job
-- This job runs every Sunday at 3:00 AM (server time)
-- It pings the librarian_heartbeat Edge Function to start autonomous scraping/ingestion
select
  cron.schedule(
    'librarian-weekly-heartbeat',
    '0 3 * * 0',
    $$
    select
      net.http_post(
          url:='https://uozrarerwahidqkmubui.functions.supabase.co/librarian_heartbeat',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"}'::jsonb
      )
    $$
  );

-- To unschedule:
-- select cron.unschedule('librarian-weekly-heartbeat');
