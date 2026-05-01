-- ============================================
-- TinTin Fitness Coaching Dashboard
-- Supabase Schema + RLS Policies
-- ============================================

-- 1. Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('client', 'coach')),
  last_viewed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

-- Users can read all users (needed to resolve roles)
create policy "Users can read all users"
  on public.users for select
  using (true);

-- Users can update their own record
create policy "Users can update own record"
  on public.users for update
  using (auth.uid() = id);

-- 2. Daily Logs table
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  calories integer,
  protein numeric,
  carbs numeric,
  fats numeric,
  gear_json jsonb default '[]'::jsonb,
  whoop_json jsonb default '{}'::jsonb,
  client_notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.daily_logs enable row level security;

-- Clients can insert their own logs
create policy "Clients can insert own logs"
  on public.daily_logs for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.users where id = auth.uid() and role = 'client'
    )
  );

-- Clients can update their own logs
create policy "Clients can update own logs"
  on public.daily_logs for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.users where id = auth.uid() and role = 'client'
    )
  );

-- Everyone can read all daily logs (coach reads client data, client reads own)
create policy "All authenticated users can read logs"
  on public.daily_logs for select
  using (auth.role() = 'authenticated');

-- 3. Coach Notes table
create table public.coach_notes (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.users(id) on delete cascade not null,
  coach_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  note text not null,
  created_at timestamptz default now()
);

alter table public.coach_notes enable row level security;

-- Coaches can insert notes
create policy "Coaches can insert notes"
  on public.coach_notes for insert
  with check (
    auth.uid() = coach_id
    and exists (
      select 1 from public.users where id = auth.uid() and role = 'coach'
    )
  );

-- Coaches can update their own notes
create policy "Coaches can update own notes"
  on public.coach_notes for update
  using (
    auth.uid() = coach_id
    and exists (
      select 1 from public.users where id = auth.uid() and role = 'coach'
    )
  );

-- Coaches can delete their own notes
create policy "Coaches can delete own notes"
  on public.coach_notes for delete
  using (
    auth.uid() = coach_id
    and exists (
      select 1 from public.users where id = auth.uid() and role = 'coach'
    )
  );

-- All authenticated users can read coach notes
create policy "All authenticated users can read coach notes"
  on public.coach_notes for select
  using (auth.role() = 'authenticated');

-- ============================================
-- Function to auto-create user profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
