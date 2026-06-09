-- ============================================================
-- EVEN — Hartă: coordonate proprietate (lat / lng)
-- Run ONCE in: Supabase Dashboard -> SQL Editor
-- Adds the map-pin coordinates so the agent can place a point
-- on the map from the admin panel when adding/editing a property.
-- ============================================================

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
