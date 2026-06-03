-- EVEN — schema for the digital contract-signing tool (multi-signer, PARALLEL).
-- Run in Supabase: SQL Editor → paste → Run.  Region must be EU (GDPR).
--
-- Model: ONE contract = ONE document. Several people sign it INDEPENDENTLY —
-- each from their own link, in any order, possibly at the same time. Each signer
-- is a row in contract_signers with their own token, personal data, drawn
-- signature and audit trail. The single final PDF is generated once EVERYONE has
-- signed, carrying every signature + per-signer audit.
--
-- Simultaneous signing: the "is everyone signed now?" check + final PDF must run
-- atomically so the document is finalized exactly once even if two people submit
-- at the same instant (handled in the /api sign endpoint via a guarded update).

create extension if not exists pgcrypto;

-- ────────────────────────────────────────────────────────────────────────────
-- contracts — the document itself
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.contracts (
  id              uuid primary key default gen_random_uuid(),

  -- draft → sent → partial (some signed) → signed (all) | void
  status          text not null default 'draft'
                    check (status in ('draft','sent','partial','signed','void')),

  template        text not null default 'intermediere',
  title           text,
  data            jsonb not null default '{}'::jsonb,   -- meta, terms, clauses, agency snapshot

  -- produced once everyone has signed
  document_hash   text,                                  -- final SHA-256 of the complete signed content
  signed_pdf_path text,                                  -- path inside the 'signed-contracts' bucket

  created_at      timestamptz not null default now(),
  sent_at         timestamptz,
  finalized_at    timestamptz
);

create index if not exists contracts_status_idx  on public.contracts (status);
create index if not exists contracts_created_idx on public.contracts (created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- contract_signers — one row per person who must sign, in order
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.contract_signers (
  id            uuid primary key default gen_random_uuid(),
  contract_id   uuid not null references public.contracts(id) on delete cascade,

  position      int  not null,            -- display order in the document (NOT a signing order)
  role          text,                     -- e.g. 'Proprietar', 'Soție', 'Cumpărător'
  name          text,                     -- pre-filled by admin (optional)
  email         text,                     -- where this person's link is sent

  -- unique unguessable link for THIS signer (all links are live from the start)
  token         text not null unique default encode(gen_random_bytes(24), 'hex'),

  -- pending (awaiting signature) → viewed (opened the link) → signed
  status        text not null default 'pending'
                  check (status in ('pending','viewed','signed')),

  -- evidence captured at signing time
  gdpr_consent  boolean not null default false,
  client_data   jsonb,                    -- this person's CNP, CI, domiciliu, telefon…
  signature     jsonb,                    -- { imageDataUrl, signedAt }
  audit         jsonb,                    -- { ip, userAgent, signedAtLocal, hash }

  viewed_at     timestamptz,
  signed_at     timestamptz,
  created_at    timestamptz not null default now(),

  unique (contract_id, position)
);

create index if not exists signers_token_idx    on public.contract_signers (token);
create index if not exists signers_contract_idx on public.contract_signers (contract_id, position);

-- ────────────────────────────────────────────────────────────────────────────
-- Row Level Security
--   Everything goes through the serverless API (/api) using the SERVICE_ROLE
--   key, which bypasses RLS. The tables stay locked to anon/auth clients so that
--   personal data (CNP, CI) is never exposed to the public client directly.
-- ────────────────────────────────────────────────────────────────────────────
alter table public.contracts        enable row level security;
alter table public.contract_signers enable row level security;

drop policy if exists "admins read contracts" on public.contracts;
create policy "admins read contracts"
  on public.contracts for select to authenticated using (true);

drop policy if exists "admins read signers" on public.contract_signers;
create policy "admins read signers"
  on public.contract_signers for select to authenticated using (true);

-- ────────────────────────────────────────────────────────────────────────────
-- Private storage bucket for the final signed PDFs
-- ────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('signed-contracts', 'signed-contracts', false)
on conflict (id) do nothing;
