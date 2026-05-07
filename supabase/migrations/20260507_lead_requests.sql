-- ============================================
-- EVEN · Lead requests table
-- Run this once in Supabase SQL editor.
-- ============================================

create extension if not exists "pgcrypto";

create table if not exists public.lead_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'vizionare',          -- vizionare | contact | document
  property_id uuid references public.properties(id) on delete set null,
  nume text not null,
  email text,
  telefon text,
  subiect text,
  mesaj text,
  source_url text,
  user_agent text,
  status text not null default 'new',              -- new | seen | replied | closed
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists lead_requests_created_at_idx
  on public.lead_requests (created_at desc);

create index if not exists lead_requests_status_idx
  on public.lead_requests (status);

-- RLS: anonymous users can only INSERT. Reads are admin-only.
alter table public.lead_requests enable row level security;

drop policy if exists lead_requests_anon_insert on public.lead_requests;
create policy lead_requests_anon_insert on public.lead_requests
  for insert
  to anon
  with check (true);

drop policy if exists lead_requests_authenticated_read on public.lead_requests;
create policy lead_requests_authenticated_read on public.lead_requests
  for select
  to authenticated
  using (true);

drop policy if exists lead_requests_authenticated_update on public.lead_requests;
create policy lead_requests_authenticated_update on public.lead_requests
  for update
  to authenticated
  using (true)
  with check (true);

-- ============================================
-- Optional: notify on insert (Edge Function trigger)
-- Replace YOUR_FUNCTION_URL with your deployed Edge Function endpoint.
-- ============================================

-- create or replace function public.notify_lead_request()
-- returns trigger language plpgsql security definer as $$
-- begin
--   perform net.http_post(
--     url := 'YOUR_FUNCTION_URL',
--     headers := jsonb_build_object('Content-Type', 'application/json'),
--     body := to_jsonb(new)
--   );
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists trg_notify_lead on public.lead_requests;
-- create trigger trg_notify_lead
--   after insert on public.lead_requests
--   for each row execute procedure public.notify_lead_request();
