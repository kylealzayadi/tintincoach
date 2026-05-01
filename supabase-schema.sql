-- ============================================
-- TinTin / Project: War — Supabase Schema
-- Simple tables, no RLS (private 2-user app)
-- ============================================

-- Daily Logs
create table if not exists daily_logs (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  calories integer,
  protein numeric,
  carbs numeric,
  fats numeric,
  gear_json jsonb default '[]'::jsonb,
  food_json jsonb default '[]'::jsonb,
  exercise_json jsonb default '[]'::jsonb,
  whoop_json jsonb default '{}'::jsonb,
  client_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Coach Notes
create table if not exists coach_notes (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  note text not null,
  created_at timestamptz default now()
);

-- WHOOP Tokens (persists OAuth tokens so you only sign in once)
create table if not exists whoop_tokens (
  id integer default 1 primary key check (id = 1),
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Disable RLS on all tables (private app, anon key access)
alter table daily_logs disable row level security;
alter table coach_notes disable row level security;
alter table whoop_tokens disable row level security;
