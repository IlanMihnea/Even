-- ============================================================
-- EVEN — Banner QR feature
-- Run ONCE in: Supabase Dashboard -> SQL Editor
-- Adds the `banner` flag so one property can be marked as
-- "currently on the physical QR banner".
-- ============================================================

-- Flag column on the existing properties table.
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS banner BOOLEAN NOT NULL DEFAULT false;

-- Safety net: at most ONE property can have banner = true.
-- (The admin panel also clears the old flag before setting a new one,
--  but this guarantees it at the database level.)
CREATE UNIQUE INDEX IF NOT EXISTS properties_single_banner
  ON properties (banner)
  WHERE banner = true;
