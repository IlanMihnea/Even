-- ============================================================
-- EVEN CMA — Migration 2026-06: Rapoarte CMA partajabile
-- Tabel pentru rapoarte de analiză comparativă de piață
-- generate de skill-ul `comparabile` și publicate din admin.
-- RLS: citire publică pe token activ; scriere doar auth.
-- Run once in: Supabase Dashboard → SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS rapoarte_cma (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Link partajabil
  token       TEXT UNIQUE NOT NULL,   -- token neghicibil (hex 20 chars), cf. /r/:token

  -- Metadata
  titlu       TEXT NOT NULL,          -- ex: "Apartament 2 camere · Lujerului"
  branded     BOOLEAN DEFAULT TRUE,   -- true = cu branding EVEN; false = neutru

  -- Date CMA (JSON canonic din skill `comparabile`)
  subiect     JSONB NOT NULL,         -- {zona, camere, mp_util, etaj, an, segment, stare, pret_cerut}
  comps       JSONB NOT NULL,         -- array de comparabile cu adj_val, incredere etc.
  banda       JSONB NOT NULL,         -- {eur_mp_jos, eur_mp_median, eur_mp_sus, val_jos, val_sus, pozitionare, pozitionare_motiv}
  voce        TEXT,                   -- citire în vocea EVEN pentru proprietar

  -- Stare
  activ       BOOLEAN DEFAULT TRUE,
  expires_at  TIMESTAMPTZ,            -- null = nu expiră
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rapoarte_cma_token     ON rapoarte_cma(token);
CREATE INDEX IF NOT EXISTS idx_rapoarte_cma_activ     ON rapoarte_cma(activ, created_at DESC);

-- RLS
ALTER TABLE rapoarte_cma ENABLE ROW LEVEL SECURITY;

-- Citire publică: token activ și neexpirat
DROP POLICY IF EXISTS "rapoarte_cma_public_read" ON rapoarte_cma;
CREATE POLICY "rapoarte_cma_public_read" ON rapoarte_cma
  FOR SELECT USING (
    activ = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Scriere: doar utilizator autentificat (admin)
DROP POLICY IF EXISTS "rapoarte_cma_auth_write" ON rapoarte_cma;
CREATE POLICY "rapoarte_cma_auth_write" ON rapoarte_cma
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
