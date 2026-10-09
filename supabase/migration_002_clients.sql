-- ────────────────────────────────────────────────────────────
-- Migration 002 — Clientes e vínculo com conexões
-- Como aplicar: Supabase Dashboard > SQL Editor > New query >
-- cole este arquivo e clique em Run (uma única vez).
-- Pré-requisito: supabase/schema.sql já aplicado.
-- ────────────────────────────────────────────────────────────

-- Clientes: cada cliente tem 1..N conexões (app + token próprios)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  email text,
  phone text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- Vínculo: conexão pertence a um cliente
alter table public.connections
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists connections_client_id_idx on public.connections (client_id);

alter table public.clients enable row level security;
-- (RLS ligada sem políticas: acesso via service_role, igual às demais tabelas)
