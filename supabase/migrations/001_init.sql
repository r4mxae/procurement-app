-- Procurement Dashboard — initial multi-tenant schema.
--
-- Every row owned by a Supabase auth user via user_id = auth.uid().
-- Row-Level Security policies enforce isolation: a user can only ever
-- read/write rows they own. Apply this in the Supabase SQL editor.

set search_path = public;

-- ─── Profiles ───────────────────────────────────────────────────
-- One row per user. Created automatically by the on_auth_user_created
-- trigger below so the app always has somewhere to read/write.
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text default '',
  role text default '',
  target_mode text default 'absolute' check (target_mode in ('absolute', 'percentage')),
  annual_target numeric default 500000,
  target_percentage numeric default 8,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── User Settings ──────────────────────────────────────────────
-- App-level preferences: theme, currency, accent, active timer, etc.
-- active_timer is JSONB because it's per-user transient state.
create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text default 'obsidian',
  sidebar_collapsed boolean default false,
  currency text default 'USD',
  date_format text default 'medium',
  urgent_days_threshold int default 3 check (urgent_days_threshold between 1 and 14),
  default_task_priority text default 'medium',
  accent_preset text default 'theme',
  custom_task_categories text[] default '{}',
  custom_savings_categories text[] default '{}',
  text_size text default 'regular' check (text_size in ('regular', 'large', 'xl')),
  bold_text boolean default false,
  active_timer jsonb,
  updated_at timestamptz not null default now()
);

-- ─── Tasks ──────────────────────────────────────────────────────
-- work_logs is JSONB to keep the existing client shape intact:
-- [{ id, startTime, endTime, durationSeconds, note }]
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null default 'todo',
  priority text default 'medium',
  category text default '',
  deadline date,
  completed_at timestamptz,
  work_logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_id_idx on tasks (user_id);
create index if not exists tasks_user_created_idx on tasks (user_id, created_at desc);

-- ─── Tenders ────────────────────────────────────────────────────
create table if not exists tenders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  reference text default '',
  stage text not null default 'draft',
  value numeric default 0,
  vendor_count int default 0,
  deadline date,
  savings numeric default 0,
  notes text default '',
  work_logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tenders_user_id_idx on tenders (user_id);
create index if not exists tenders_user_created_idx on tenders (user_id, created_at desc);

-- ─── Savings ────────────────────────────────────────────────────
create table if not exists savings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric not null default 0,
  category text default '',
  date date not null default current_date,
  tender_ref text default '',
  created_at timestamptz not null default now()
);
create index if not exists savings_user_id_idx on savings (user_id);
create index if not exists savings_user_date_idx on savings (user_id, date desc);

-- ─── Activity Log ───────────────────────────────────────────────
-- Append-only audit feed. A trigger trims to the last 200 entries
-- per user so the table doesn't grow unbounded.
create table if not exists activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  timestamp timestamptz not null default now()
);
create index if not exists activity_user_ts_idx on activity (user_id, timestamp desc);

create or replace function trim_activity_for_user() returns trigger
language plpgsql security definer as $$
begin
  delete from activity
  where user_id = new.user_id
    and id not in (
      select id from activity
      where user_id = new.user_id
      order by timestamp desc
      limit 200
    );
  return new;
end;
$$;

drop trigger if exists trim_activity_after_insert on activity;
create trigger trim_activity_after_insert
  after insert on activity
  for each row execute function trim_activity_for_user();

-- ─── updated_at maintenance ─────────────────────────────────────
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists user_settings_set_updated_at on user_settings;
create trigger user_settings_set_updated_at before update on user_settings
  for each row execute function set_updated_at();

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at before update on tasks
  for each row execute function set_updated_at();

drop trigger if exists tenders_set_updated_at on tenders;
create trigger tenders_set_updated_at before update on tenders
  for each row execute function set_updated_at();

-- ─── Auto-create profile + settings on signup ───────────────────
-- Runs as the Supabase auth user is created so the app can read its
-- profile/settings rows immediately after first login.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))
  on conflict (user_id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Row-Level Security ─────────────────────────────────────────
alter table profiles      enable row level security;
alter table user_settings enable row level security;
alter table tasks         enable row level security;
alter table tenders       enable row level security;
alter table savings       enable row level security;
alter table activity      enable row level security;

-- Each policy enforces user_id = auth.uid() for SELECT/INSERT/UPDATE/DELETE.
-- "for all" covers all four with a single using/with check pair.
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own settings" on user_settings;
create policy "own settings" on user_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own tasks" on tasks;
create policy "own tasks" on tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own tenders" on tenders;
create policy "own tenders" on tenders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own savings" on savings;
create policy "own savings" on savings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own activity" on activity;
create policy "own activity" on activity
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
