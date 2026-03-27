-- Phase 20: Studio Per-Seat Billing

ALTER TABLE public.law_firms 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS seat_count INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
