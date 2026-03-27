-- ============================================================
-- Phase 14: B2B SaaS — Studi Legali (Law Firms Schema)
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. LAW FIRMS TABLE
CREATE TABLE IF NOT EXISTS public.law_firms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drive_folder_id   TEXT,
  drive_folder_name TEXT,
  documents_synced  INT DEFAULT 0,
  last_synced_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 2. FIRM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.firm_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id    UUID NOT NULL REFERENCES public.law_firms(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at  TIMESTAMPTZ,
  UNIQUE(firm_id, email)
);

-- 3. RLS POLICIES — law_firms
ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;

-- Owners: full access to their own firm
CREATE POLICY "Owners manage their firm"
  ON public.law_firms
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Members: read-only access to firms they belong to
CREATE POLICY "Members read their firm"
  ON public.law_firms
  FOR SELECT
  USING (
    id IN (
      SELECT firm_id FROM public.firm_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 4. RLS POLICIES — firm_members
ALTER TABLE public.firm_members ENABLE ROW LEVEL SECURITY;

-- Firm owners can manage all members of their firm
CREATE POLICY "Owners manage firm members"
  ON public.firm_members
  FOR ALL
  USING (
    firm_id IN (
      SELECT id FROM public.law_firms WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    firm_id IN (
      SELECT id FROM public.law_firms WHERE owner_id = auth.uid()
    )
  );

-- Members can see each other in the same firm
CREATE POLICY "Members see firm roster"
  ON public.firm_members
  FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.firm_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Users can accept their own invitation (update their own row)
CREATE POLICY "Members accept own invite"
  ON public.firm_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_firm_members_firm_id ON public.firm_members(firm_id);
CREATE INDEX IF NOT EXISTS idx_firm_members_user_id ON public.firm_members(user_id);
CREATE INDEX IF NOT EXISTS idx_firm_members_email ON public.firm_members(email);
CREATE INDEX IF NOT EXISTS idx_law_firms_owner_id ON public.law_firms(owner_id);
