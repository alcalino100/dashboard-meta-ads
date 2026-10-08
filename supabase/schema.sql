# ────────────────────────────────────────────────────────────
# Dashboard Meta Ads — schema inicial do Supabase
# Como aplicar: Supabase Dashboard > SQL Editor > New query >
# cole este arquivo e clique em Run (uma única vez).
# ────────────────────────────────────────────────────────────

-- Conexões Meta (Business Managers + tokens)
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_id text,
  app_id text,
  access_token text,
  status text not null default 'sync_error',
  uses_env_token boolean not null default false,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  last_test_at timestamptz,
  created_at timestamptz not null default now()
);

-- Usuários do painel (login via Supabase Auth + papel/escopo aqui)
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null default 'Operador',
  account_ids text[] not null default '{}',
  status text not null default 'active',
  last_access timestamptz,
  auth_id uuid unique,
  created_at timestamptz not null default now()
);

-- Metas por conta
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  account_id text,
  account_name text not null default '',
  metric text not null default '',
  target numeric not null default 0,
  current numeric not null default 0,
  unit text not null default '',
  direction text not null default 'up',
  created_at timestamptz not null default now()
);

-- Regras de automação/alertas
create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  connection_id text,
  name text not null default '',
  metric text not null default '',
  operator text not null default '',
  threshold numeric not null default 0,
  action text not null default '',
  scope text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Trilha de auditoria (somente leitura pelo painel)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null default '',
  actor_type text not null default 'user',
  action text not null default '',
  description text not null default '',
  account text,
  ip text,
  created_at timestamptz not null default now()
);

-- Configurações globais do painel (id único 'global')
create table if not exists public.app_settings (
  id text primary key,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- RLS ligada SEM políticas: o painel acessa tudo via service_role
-- (que bypassa RLS) e o login usa o Supabase Auth — o anon não lê nada.
alter table public.connections enable row level security;
alter table public.app_users enable row level security;
alter table public.goals enable row level security;
alter table public.rules enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

# ────────────────────────────────────────────────────────────
# DEPOIS do schema: criar o primeiro login
# 1) Authentication > Users > Add user > email + senha
# 2) Copie o UUID do usuário e rode:
#
#    insert into public.app_users (name, email, role, status, auth_id)
#    values ('Seu Nome', 'voce@empresa.com', 'Administrador', 'active', '<UUID>');
# ────────────────────────────────────────────────────────────
