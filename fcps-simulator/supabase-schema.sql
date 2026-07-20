-- ═══════════════════════════════════════════════════════════
--  FCPS Part 1 CBT Simulator — Supabase SQL Schema
--  Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- ── 1. PROFILES TABLE ────────────────────────────────────────
create table if not exists public.profiles (
  id                      uuid        primary key references auth.users(id) on delete cascade,
  email                   text,
  full_name               text,
  role                    text        not null default 'student' check (role in ('student', 'admin')),
  subscription_status     text        not null default 'pending'
                          check (subscription_status in ('pending', 'active', 'expired')),
  subscription_expires_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Auto-create profile on new user sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, subscription_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 2. QUESTIONS TABLE ────────────────────────────────────────
create table if not exists public.questions (
  id              uuid        primary key default gen_random_uuid(),
  subject         text        not null,
  question_text   text        not null,
  option_a        text        not null,
  option_b        text        not null,
  option_c        text        not null,
  option_d        text        not null,
  option_e        text,
  correct_answer  text        not null check (correct_answer in ('A','B','C','D','E')),
  explanation     text,
  created_by      uuid        references auth.users(id),
  created_at      timestamptz not null default now()
);

create index if not exists questions_subject_idx on public.questions(subject);


-- ── 3. EXAM ATTEMPTS TABLE ────────────────────────────────────
create table if not exists public.exam_attempts (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  subject         text        not null,
  mode            text        not null default 'exam' check (mode in ('exam', 'practice')),
  score           integer     not null default 0,
  total_questions integer     not null default 0,
  answers         jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists attempts_user_idx on public.exam_attempts(user_id);
create index if not exists attempts_subject_idx on public.exam_attempts(subject);


-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────────

-- profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admin can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Service role full access to profiles"
  on public.profiles
  using (auth.role() = 'service_role');


-- questions
alter table public.questions enable row level security;

create policy "Authenticated users can read questions"
  on public.questions for select
  using (auth.role() = 'authenticated');

create policy "Admin can insert questions"
  on public.questions for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admin can update questions"
  on public.questions for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admin can delete questions"
  on public.questions for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Service role full access to questions"
  on public.questions
  using (auth.role() = 'service_role');


-- exam_attempts
alter table public.exam_attempts enable row level security;

create policy "Users can view own attempts"
  on public.exam_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own attempts"
  on public.exam_attempts for insert
  with check (auth.uid() = user_id);

create policy "Admin can view all attempts"
  on public.exam_attempts for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Service role full access to attempts"
  on public.exam_attempts
  using (auth.role() = 'service_role');


-- ── 5. AUTO EXPIRY FUNCTION (Optional Cron) ───────────────────
-- Run this via pg_cron or Supabase Edge Functions scheduler
-- to automatically mark expired subscriptions:
--
-- create or replace function public.expire_subscriptions()
-- returns void language sql security definer as $$
--   update public.profiles
--   set subscription_status = 'expired'
--   where subscription_status = 'active'
--     and subscription_expires_at < now();
-- $$;


-- ── 6. SEED ADMIN USER ────────────────────────────────────────
-- After creating your admin user via Supabase Auth, run:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
