-- ========================================================
-- PULSE PERSONAL TRACKER - SUPABASE DATABASE MIGRATION
-- ========================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- 1. Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  active_categories text[] default array['habits','expenses','mood','health'],
  dark_mode boolean default true,
  created_at timestamptz default now()
);

-- 2. Habits (definitions)
create table if not exists habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  icon text default 'check-circle',
  frequency text check (frequency in ('daily','weekly')) default 'daily',
  reminder_time time,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. Habit logs (completions)
create table if not exists habit_logs (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  completed_on date not null default current_date,
  created_at timestamptz default now(),
  unique(habit_id, completed_on)
);

-- 4. Expense categories (lookup, seeded)
create table if not exists expense_categories (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  icon text not null
);

-- 5. Expenses
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  category_id uuid references expense_categories(id),
  amount numeric(10,2) not null,
  note text,
  spent_on date not null default current_date,
  created_at timestamptz default now()
);

-- 6. Mood logs
create table if not exists mood_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  mood_score smallint check (mood_score between 1 and 5) not null,
  tags text[],
  journal_note text,
  logged_on date not null default current_date,
  created_at timestamptz default now()
);

-- 7. Health logs (water, sleep, workout combined per day)
create table if not exists health_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  logged_on date not null default current_date,
  water_glasses smallint default 0,
  sleep_hours numeric(3,1) default 0,
  workout_minutes smallint default 0,
  workout_type text,
  created_at timestamptz default now(),
  unique(user_id, logged_on)
);

-- 8. Streaks (denormalized for fast reads)
create table if not exists streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  category text check (category in ('habits','expenses','mood','health')) not null,
  current_streak int default 0,
  longest_streak int default 0,
  last_logged_on date,
  unique(user_id, category)
);

-- 9. Milestones / achievements
create table if not exists milestones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade not null,
  category text not null,
  milestone_type text not null, -- e.g. '7_day_streak', '30_day_streak'
  achieved_on date default current_date,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_habit_logs_user_date on habit_logs(user_id, completed_on);
create index if not exists idx_expenses_user_date on expenses(user_id, spent_on);
create index if not exists idx_mood_logs_user_date on mood_logs(user_id, logged_on);
create index if not exists idx_health_logs_user_date on health_logs(user_id, logged_on);

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table expenses enable row level security;
alter table mood_logs enable row level security;
alter table health_logs enable row level security;
alter table streaks enable row level security;
alter table milestones enable row level security;

-- Policies: user can access their own data
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own habits" on habits for all using (auth.uid() = user_id);
create policy "own habit_logs" on habit_logs for all using (auth.uid() = user_id);
create policy "own expenses" on expenses for all using (auth.uid() = user_id);
create policy "own mood_logs" on mood_logs for all using (auth.uid() = user_id);
create policy "own health_logs" on health_logs for all using (auth.uid() = user_id);
create policy "own streaks" on streaks for all using (auth.uid() = user_id);
create policy "own milestones" on milestones for all using (auth.uid() = user_id);

-- expense_categories is public read-only reference data
alter table expense_categories enable row level security;
create policy "public read categories" on expense_categories for select using (true);

-- Seed expense categories
insert into expense_categories (name, icon) values
  ('Food', 'utensils'),
  ('Transport', 'car'),
  ('Shopping', 'shopping-bag'),
  ('Bills', 'receipt'),
  ('Entertainment', 'film'),
  ('Other', 'more-horizontal')
on conflict (name) do nothing;

-- Trigger: auto-create profile row on signup
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========================================================
-- STREAK CALCULATION PROCEDURE
-- ========================================================
create or replace function public.update_streak(p_user_id uuid, p_category text)
returns void as $$
declare
  v_last_date date;
  v_curr_streak int := 0;
  v_long_streak int := 0;
  v_today date := current_date;
begin
  select last_logged_on, current_streak, longest_streak
  into v_last_date, v_curr_streak, v_long_streak
  from public.streaks
  where user_id = p_user_id and category = p_category;

  if not found then
    v_curr_streak := 1;
    v_long_streak := 1;
    insert into public.streaks (user_id, category, current_streak, longest_streak, last_logged_on)
    values (p_user_id, p_category, 1, 1, v_today);
  else
    if v_last_date = v_today then
      -- Already logged today, do nothing
      return;
    elsif v_last_date = v_today - interval '1 day' then
      -- Logged yesterday -> increment
      v_curr_streak := v_curr_streak + 1;
    else
      -- Gap > 1 day -> reset streak to 1
      v_curr_streak := 1;
    end if;

    if v_curr_streak > v_long_streak then
      v_long_streak := v_curr_streak;
    end if;

    update public.streaks
    set current_streak = v_curr_streak,
        longest_streak = v_long_streak,
        last_logged_on = v_today
    where user_id = p_user_id and category = p_category;
  end if;

  -- Insert milestones when streak reaches 7, 30, 100
  if v_curr_streak = 7 then
    insert into public.milestones (user_id, category, milestone_type, achieved_on)
    values (p_user_id, p_category, '7_day_streak', v_today)
    on conflict do nothing;
  elsif v_curr_streak = 30 then
    insert into public.milestones (user_id, category, milestone_type, achieved_on)
    values (p_user_id, p_category, '30_day_streak', v_today)
    on conflict do nothing;
  elsif v_curr_streak = 100 then
    insert into public.milestones (user_id, category, milestone_type, achieved_on)
    values (p_user_id, p_category, '100_day_streak', v_today)
    on conflict do nothing;
  end if;
end;
$$ language plpgsql security definer;
