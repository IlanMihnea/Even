-- ============================================================
-- EVEN — Home page hero feature
-- Run ONCE in: Supabase Dashboard -> SQL Editor
-- Adds the `home_hero` flag so one property can be marked as
-- "currently featured in the homepage hero card (over the video)".
-- ============================================================

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS home_hero BOOLEAN NOT NULL DEFAULT false;

-- At most ONE property can have home_hero = true.
CREATE UNIQUE INDEX IF NOT EXISTS properties_single_home_hero
  ON properties (home_hero)
  WHERE home_hero = true;
