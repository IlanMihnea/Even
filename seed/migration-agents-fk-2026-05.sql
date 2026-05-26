-- ============================================================
-- EVEN — Migration: agents FK should not block deletion.
-- Run once in: Supabase Dashboard → SQL Editor.
-- ============================================================
-- Problem: deleting an agent fails because properties.agent_id
--   has a default NO ACTION foreign key.
-- Fix: replace it with ON DELETE SET NULL so deleting an agent
--   leaves the properties intact but unassigned (you can re-assign
--   later from the property edit modal).

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_agent_id_fkey;

ALTER TABLE properties
  ADD CONSTRAINT properties_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;
