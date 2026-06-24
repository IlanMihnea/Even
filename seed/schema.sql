-- ============================================================
-- EVEN Real Estate — Supabase Schema
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── AGENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id                  TEXT PRIMARY KEY,
  nume                TEXT NOT NULL,
  rol                 TEXT,
  bio                 TEXT,
  email               TEXT UNIQUE,
  telefon             TEXT,
  foto                TEXT,
  proprietati_vandute INTEGER DEFAULT 0,
  ani                 INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROPERTIES ───────────────────────────────────────────────
-- Unified table for rezidential, comercial & terenuri.
-- categoria drives which columns are relevant.
CREATE TABLE IF NOT EXISTS properties (
  id                  TEXT PRIMARY KEY,
  categorie           TEXT NOT NULL CHECK (categorie IN ('rezidential','comercial','terenuri')),
  titlu               TEXT NOT NULL,
  regim               TEXT CHECK (regim IN ('vanzare','inchiriere')),
  tip                 TEXT,          -- apartament | vila | casa | duplex | studio | birouri | retail | depozit | showroom | industrial | intravilan-rezidential | intravilan-comercial | extravilan-agricol

  -- Pricing
  pret                NUMERIC,       -- EUR (main price; mp/month for commercial)
  pret_total          NUMERIC,       -- EUR total (commercial/land when pret is per mp)
  pret_mp             NUMERIC,       -- EUR/mp (land)
  moneda              TEXT DEFAULT 'EUR' CHECK (moneda IN ('EUR','RON')),
  pret_negociabil     BOOLEAN DEFAULT false,
  plus_tva            BOOLEAN DEFAULT false,

  -- Location
  oras                TEXT,
  cartier             TEXT,
  adresa              TEXT,
  judet               TEXT,
  localitate          TEXT,          -- for terenuri
  lat                 NUMERIC,
  lng                 NUMERIC,

  -- Residential dimensions
  camere              INTEGER,
  dormitoare          INTEGER,
  bai                 INTEGER,
  suprafata           NUMERIC,       -- mp utili (residential) / totali (commercial)
  suprafata_utila     NUMERIC,
  suprafata_totala    NUMERIC,
  etaj                INTEGER,       -- null for houses/land
  etaj_total          INTEGER,
  balcon              BOOLEAN DEFAULT false,
  balcoane            INTEGER DEFAULT 0,
  terase              INTEGER DEFAULT 0,
  parcare             BOOLEAN DEFAULT false,
  locuri_parcare      INTEGER DEFAULT 0,
  boxa                BOOLEAN DEFAULT false,

  -- Apartment classification (imobiliare.ro / storia standard)
  compartimentare     TEXT CHECK (compartimentare IN ('decomandat','semidecomandat','nedecomandat','circular','vagon','duplex','open-space')),
  confort             TEXT CHECK (confort IN ('1','2','3','lux')),
  orientare           TEXT,          -- Sud, Sud-Est, Est, Nord-Est, Nord, Nord-Vest, Vest, Sud-Vest

  -- Building info
  an_constructie      INTEGER,
  an_renovare         INTEGER,
  tip_cladire         TEXT,          -- bloc | casa | vila | duplex | ansamblu-rezidential | cladire-birouri | hala | depozit
  structura_cladire   TEXT,          -- caramida | beton | BCA | panouri | lemn | metal
  clasa_cladire       TEXT CHECK (clasa_cladire IN ('A','B','C')),  -- commercial
  etaje_cladire       INTEGER,

  -- Furnishing & heating (residential)
  mobilat             TEXT CHECK (mobilat IN ('nemobilat','partial-mobilat','mobilat','mobilat-lux')),
  tip_incalzire       TEXT CHECK (tip_incalzire IN ('centrala-proprie','centrala-bloc','termoficare','pompa-caldura','podea-radianta','semineu','aer-conditionat')),

  -- Commercial-specific
  tip_spatiu          TEXT,          -- birouri | retail | depozit | showroom | industrial | medical | hala | hotel
  suprafata_birouri   NUMERIC,
  inaltime_libera     NUMERIC,
  specificatii        JSONB,         -- electric, rampa, climatizare, pardoseala, iluminat

  -- Land-specific
  unitate             TEXT DEFAULT 'mp',
  front_stradal       NUMERIC,
  acces_drum          TEXT,          -- asfaltat | pietruit | drum-de-camp
  utilitati           TEXT[],        -- ['apa','curent','gaz','canalizare','fibra']
  zonare_pug          TEXT,
  cut                 NUMERIC,
  pot                 NUMERIC,
  vecinatati          TEXT,

  -- Media & metadata
  imagini             TEXT[],
  facilitati          TEXT[],        -- legacy list of features
  dotari              JSONB,         -- structured: { aer_conditionat, lift, interfon, paza, ... }
  descriere           TEXT,
  disponibil_din      DATE,
  exclusivitate       BOOLEAN DEFAULT false,
  activ               BOOLEAN DEFAULT true,
  banner              BOOLEAN NOT NULL DEFAULT false,  -- property currently on the physical QR banner
  agent_id            TEXT REFERENCES agents(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common searches
CREATE INDEX IF NOT EXISTS idx_properties_categorie   ON properties(categorie);
CREATE INDEX IF NOT EXISTS idx_properties_regim       ON properties(regim);
CREATE INDEX IF NOT EXISTS idx_properties_oras        ON properties(oras);
CREATE INDEX IF NOT EXISTS idx_properties_pret        ON properties(pret);
CREATE INDEX IF NOT EXISTS idx_properties_camere      ON properties(camere);
CREATE INDEX IF NOT EXISTS idx_properties_activ       ON properties(activ);
-- At most one property can be flagged as the QR-banner property.
CREATE UNIQUE INDEX IF NOT EXISTS properties_single_banner ON properties(banner) WHERE banner = true;

-- ── PROJECTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                    TEXT PRIMARY KEY,
  nume                  TEXT NOT NULL,
  dezvoltator           TEXT,
  dezvoltator_proiecte  TEXT[],
  oras                  TEXT,
  cartier               TEXT,
  adresa                TEXT,
  status                TEXT CHECK (status IN ('pre-vanzare','construire','finalizat')),
  data_livrare          DATE,
  progres               INTEGER DEFAULT 0 CHECK (progres BETWEEN 0 AND 100),
  interval_pret_min     NUMERIC,
  interval_pret_max     NUMERIC,
  tipuri_unitati        TEXT[],
  unitati_disponibile   INTEGER DEFAULT 0,
  unitati_total         INTEGER DEFAULT 0,
  descriere             TEXT,
  facilitati            TEXT[],
  imagini               TEXT[],
  plan_plata            JSONB,
  timeline              JSONB,
  activ                 BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROJECT UNITS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_units (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  numar       TEXT NOT NULL,
  tip         TEXT,
  etaj        INTEGER,
  suprafata   NUMERIC,
  pret        NUMERIC,
  moneda      TEXT DEFAULT 'EUR',
  status      TEXT DEFAULT 'disponibil' CHECK (status IN ('disponibil','rezervat','vandut')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, numar)
);

-- ── LEADS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  project_id  TEXT REFERENCES projects(id)   ON DELETE SET NULL,
  agent_id    TEXT REFERENCES agents(id)     ON DELETE SET NULL,
  nume        TEXT,
  email       TEXT NOT NULL,
  telefon     TEXT,
  mesaj       TEXT NOT NULL,
  tip         TEXT DEFAULT 'contact' CHECK (tip IN ('contact','vizionare','oferta')),
  status      TEXT DEFAULT 'nou'     CHECK (status IN ('nou','contactat','vizionare-programata','oferta-trimisa','inchis-castigat','inchis-pierdut')),
  sursa       TEXT DEFAULT 'website' CHECK (sursa IN ('website','facebook','google','referral','telefon','altele')),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id);

-- Auto-update updated_at on leads
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS — CITIRE PUBLICĂ PROIECTE ────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_public_read" ON projects;
CREATE POLICY "projects_public_read" ON projects FOR SELECT USING (activ = true);

DROP POLICY IF EXISTS "project_units_public_read" ON project_units;
CREATE POLICY "project_units_public_read" ON project_units FOR SELECT USING (true);

-- ── STORAGE ──────────────────────────────────────────────────
-- Run once in Supabase Dashboard → SQL Editor.
-- Bucket pentru imagini proprietăți (public read, write doar autentificat).

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;
CREATE POLICY "property_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

-- Authenticated write/update/delete
DROP POLICY IF EXISTS "property_images_auth_insert" ON storage.objects;
CREATE POLICY "property_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "property_images_auth_update" ON storage.objects;
CREATE POLICY "property_images_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "property_images_auth_delete" ON storage.objects;
CREATE POLICY "property_images_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');
