-- ============================================================
-- EVEN CMA — Migration 2026-06-22: Tranzacții vândute
-- Tabel privat cu vânzările reale (ancora 🟢 pentru skill comparabile).
-- RLS: auth-only. Nu e vizibil public.
-- Run once in: Supabase Dashboard → SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS tranzactii (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Când
  data_vanzare     DATE NOT NULL,

  -- Unde
  oras             TEXT NOT NULL DEFAULT 'București',
  cartier          TEXT,          -- sub-zonă / reper (ex: Virtuții, Como Park)
  adresa           TEXT,

  -- Ce
  tip              TEXT NOT NULL DEFAULT 'apartament',
  camere           INTEGER,
  suprafata_utila  NUMERIC NOT NULL,
  suprafata_totala NUMERIC,
  etaj             INTEGER,
  etaj_total       INTEGER,
  an_constructie   INTEGER,
  compartimentare  TEXT CHECK (compartimentare IN
                     ('decomandat','semidecomandat','nedecomandat','circular','open-space')),
  stare            TEXT CHECK (stare IN ('nefinisat','locuibil','renovat','lux')),
  mobilat          TEXT CHECK (mobilat IN
                     ('nemobilat','partial-mobilat','mobilat','mobilat-lux')),
  parcare          BOOLEAN DEFAULT false,
  locuri_parcare   INTEGER DEFAULT 0,
  balcon           BOOLEAN DEFAULT false,
  vedere           TEXT,          -- lac | oras | interior | curte | parc | ...
  orientare        TEXT,
  dotari           JSONB,         -- { centrala: true, ac: true, lift: true, ... }

  -- Prețuri (ancora)
  pret_cerut       NUMERIC,       -- EUR cerut inițial (net)
  pret_vandut      NUMERIC NOT NULL, -- EUR obținut (net) — câmpul-cheie pentru CMA
  tva_inclus       BOOLEAN,       -- false = net (+TVA); true = gross (TVA inclus); null = necunoscut
  cota_tva         NUMERIC DEFAULT 0.21,
  moneda           TEXT DEFAULT 'EUR',
  zile_pe_piata    INTEGER,
  nr_vizionari     INTEGER,
  finantare        TEXT,          -- cash | credit | mixt

  -- FK opțional cu proprietatea EVEN
  property_id      TEXT REFERENCES properties(id) ON DELETE SET NULL,

  observatii       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tranzactii_data    ON tranzactii(data_vanzare DESC);
CREATE INDEX IF NOT EXISTS idx_tranzactii_cartier ON tranzactii(cartier);
CREATE INDEX IF NOT EXISTS idx_tranzactii_camere  ON tranzactii(camere);

-- Funcția update_updated_at e deja definită în schema.sql; CREATE OR REPLACE e sigur.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tranzactii_updated_at ON tranzactii;
CREATE TRIGGER tranzactii_updated_at
  BEFORE UPDATE ON tranzactii
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: privat
ALTER TABLE tranzactii ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tranzactii_auth_all" ON tranzactii;
CREATE POLICY "tranzactii_auth_all" ON tranzactii
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── Prima intrare: Como Park (vânzare reală 11.06.2026) ──────
-- offer_id 275556490 pe imobiliare.ro
INSERT INTO tranzactii (
  data_vanzare, oras, cartier, tip, camere,
  suprafata_utila, suprafata_totala, etaj, etaj_total,
  an_constructie, stare, mobilat, parcare, balcon,
  vedere, pret_cerut, pret_vandut, tva_inclus, cota_tva,
  zile_pe_piata, observatii
) VALUES (
  '2026-06-11', 'București', 'Virtuții / Como Park (Lacul Morii)', 'apartament', 2,
  59, 67, 10, 11,
  2024, 'lux', 'nemobilat', false, true,
  'lac', 160000, 155000, false, 0.21,
  NULL, 'vedere modestă la lac; offer_id 275556490; ~3% sub cerut; AC, centrală, pardoseală, balcon'
)
ON CONFLICT DO NOTHING;
