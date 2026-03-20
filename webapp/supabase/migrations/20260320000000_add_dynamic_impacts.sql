-- Migration: Add dynamic_impacts JSONB column to atena_guardian_alerts
-- This column will store the pre-calculated Picoclaw impacts for different user profiles.

ALTER TABLE public.atena_guardian_alerts 
ADD COLUMN IF NOT EXISTS dynamic_impacts JSONB DEFAULT '{}'::jsonb;

-- Seed some mock data for existing rows so the Impact Simulator has real DB data to show
UPDATE public.atena_guardian_alerts 
SET dynamic_impacts = jsonb_build_object(
  'Tech Startup (SaaS)', CASE WHEN title ILIKE '%IA%' OR title ILIKE '%Digitale%' THEN 'High' ELSE 'Medium' END,
  'E-commerce Retail', CASE WHEN title ILIKE '%Consumatori%' OR title ILIKE '%Mercato%' THEN 'High' ELSE 'Low' END,
  'Studio Legale', 'Medium'
) WHERE dynamic_impacts = '{}'::jsonb OR dynamic_impacts IS NULL;
