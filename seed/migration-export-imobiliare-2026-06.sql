-- ── EXPORT IMOBILIARE.RO ─────────────────────────────────────
-- Adaugă opt-in per proprietate pentru publicarea automată pe imobiliare.ro
-- prin feed-ul XML (/api/feed-imobiliare). O proprietate apare în feed doar dacă
-- e activă ȘI marcată explicit pentru export — așa controlăm ce iese pe portal
-- (ex: ofertele exclusive / off-market rămân doar pe site).
--
-- Rulează o singură dată în Supabase SQL editor.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS export_imobiliare BOOLEAN NOT NULL DEFAULT false;

-- Referința proprietății în contul imobiliare.ro (se completează manual sau
-- automat după primul import; folosită ca <id> stabil în feed). Opțional.
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS imobiliare_ref TEXT;

-- Index pentru interogarea rapidă a feed-ului (doar ofertele exportabile active).
CREATE INDEX IF NOT EXISTS idx_properties_export_imobiliare
  ON properties(export_imobiliare) WHERE export_imobiliare = true;
