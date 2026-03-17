-- Setup The Guardian Cron Job
-- -------------------------------------------------------------
-- This script schedules the pg_cron job to invoke the Guardian 
-- Edge Function every day at 06:00 AM Europe/Rome time.

-- Enable extensions if not already enabled
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any existing job
select cron.unschedule('invoke-guardian-harvester');

-- Schedule the new job
select cron.schedule(
  'invoke-guardian-harvester',  -- Job Name
  '0 6 * * *',                  -- Schedule: Every day at 06:00
  $$
    select net.http_post(
        url:='https://uozrarerwahidqkmubui.supabase.co/functions/v1/guardian-harvester',
        headers:='{
            "Content-Type": "application/json", 
            "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"
        }'::jsonb,
        body:='{}'::jsonb
    );
  $$
);

/* 
MIO CAPITANO:
1. Sostituisci `YOUR_SERVICE_ROLE_KEY` con la tua vera Service Role Key di Supabase 
   (la trovi su Project Settings -> API).
2. Esegui questo script nel SQL Editor di Supabase.

Il Guardian si sveglierà ogni giorno alle 6:00, estrarrà le leggi via Perplexity, 
le sintetizzerà via Gemini e scriverà su `atena_guardian_alerts` autonomamente!
*/
