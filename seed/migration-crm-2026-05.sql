-- ============================================================
-- EVEN CRM — Migration 2026-05
-- Adds: buyer profiles, property view counter, atomic view RPC.
-- Run once in: Supabase Dashboard → SQL Editor.
-- ============================================================

-- ── 1. PROPERTY VIEW COUNTER ─────────────────────────────────
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Atomic increment, callable from the anon role (read-only otherwise).
CREATE OR REPLACE FUNCTION increment_property_view(p_id TEXT)
RETURNS VOID AS $$
  UPDATE properties SET view_count = view_count + 1 WHERE id = p_id;
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_property_view(TEXT) TO anon, authenticated;

-- ── 2. BUYER PROFILES (saved searches) ───────────────────────
-- A persistent buyer brief: what they're looking for. Used to match
-- against new/existing properties and surface "3 buyers interested"
-- badges in admin.
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nume            TEXT NOT NULL,
  email           TEXT,
  telefon         TEXT,

  -- Match criteria (all optional, AND-ed; arrays mean OR within field)
  categorie       TEXT CHECK (categorie IN ('rezidential','comercial','terenuri')),
  regim           TEXT CHECK (regim IN ('vanzare','inchiriere')),
  tip             TEXT[],            -- apartament, casa, vila, birouri, retail, ...
  orase           TEXT[],
  cartiere        TEXT[],
  camere_min      INTEGER,
  camere_max      INTEGER,
  pret_min        NUMERIC,
  pret_max        NUMERIC,
  suprafata_min   NUMERIC,
  suprafata_max   NUMERIC,

  -- Workflow
  note            TEXT,
  prioritate      TEXT DEFAULT 'normal' CHECK (prioritate IN ('hot','normal','cold')),
  activ           BOOLEAN DEFAULT true,
  agent_id        TEXT REFERENCES agents(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyer_profiles_activ     ON buyer_profiles(activ);
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_categorie ON buyer_profiles(categorie);

-- Make the migration self-contained: create the shared updated_at trigger fn
-- here if it isn't already present (it normally comes from seed/schema.sql).
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS buyer_profiles_updated_at ON buyer_profiles;
CREATE TRIGGER buyer_profiles_updated_at
  BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 3. RLS (Row Level Security) ──────────────────────────────
-- buyer_profiles holds personal data — anon role must not see them.
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "buyer_profiles_auth_all" ON buyer_profiles;
CREATE POLICY "buyer_profiles_auth_all" ON buyer_profiles
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
