-- ========================================================
-- Pulse Web Application - Supabase Postgres DB Schema
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text default 'Pulse User',
  active_categories text[] default array['habits', 'expenses', 'mood', 'health'],
  notifications_enabled boolean default true,
  streak_count integer default 0,
  longest_streak integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habits Table
create table if not exists public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  icon text default 'CheckCircle',
  frequency text default 'daily',
  reminder_time text default '08:00',
  target_per_day integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habit Logs Table
create table if not exists public.habit_logs (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references public.habits(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date default current_date not null,
  completed boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(habit_id, date)
);

-- 4. Expenses Table
create table if not exists public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10, 2) not null,
  category text not null,
  note text default '',
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Mood Logs Table
create table if not exists public.mood_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer check (rating between 1 and 5) not null,
  label text not null,
  tags text[] default array[]::text[],
  journal text default '',
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Health Logs Table
create table if not exists public.health_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  water_ml integer default 0,
  sleep_hours numeric(4, 1) default 0,
  workout_mins integer default 0,
  workout_type text default 'General',
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.expenses enable row level security;
alter table public.mood_logs enable row level security;
alter table public.health_logs enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Habits Policies
create policy "Users can view own habits" on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on public.habits for delete using (auth.uid() = user_id);

-- Habit Logs Policies
create policy "Users can view own habit logs" on public.habit_logs for select using (auth.uid() = user_id);
create policy "Users can insert own habit logs" on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own habit logs" on public.habit_logs for delete using (auth.uid() = user_id);

-- Expenses Policies
create policy "Users can view own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users can delete own expenses" on public.expenses for delete using (auth.uid() = user_id);

-- Mood Logs Policies
create policy "Users can view own mood logs" on public.mood_logs for select using (auth.uid() = user_id);
create policy "Users can insert own mood logs" on public.mood_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own mood logs" on public.mood_logs for delete using (auth.uid() = user_id);

-- Health Logs Policies
create policy "Users can view own health logs" on public.health_logs for select using (auth.uid() = user_id);
create policy "Users can insert own health logs" on public.health_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own health logs" on public.health_logs for delete using (auth.uid() = user_id);
