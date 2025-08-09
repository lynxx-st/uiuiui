-- Schema for Offline-to-Online Expense Tracker
create extension if not exists "uuid-ossp";

-- profiles (mirror of auth.users for easy joins)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- categories
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  color text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);
create index if not exists categories_owner_idx on public.categories(owner_id);

-- expenses
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  amount numeric not null check (amount >= 0),
  currency text not null default 'USD',
  category_id uuid references public.categories(id) on delete set null,
  images text[],
  occurred_on timestamp with time zone not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);
create index if not exists expenses_owner_idx on public.expenses(owner_id);
create index if not exists expenses_date_idx on public.expenses(occurred_on);

-- RLS
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by users" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Categories policies
create policy "Users can view own categories" on public.categories for select using (owner_id = auth.uid());
create policy "Users can insert own categories" on public.categories for insert with check (owner_id = auth.uid());
create policy "Users can update own categories" on public.categories for update using (owner_id = auth.uid());
create policy "Users can delete own categories" on public.categories for delete using (owner_id = auth.uid());

-- Expenses policies
create policy "Users can view own expenses" on public.expenses for select using (owner_id = auth.uid());
create policy "Users can insert own expenses" on public.expenses for insert with check (owner_id = auth.uid());
create policy "Users can update own expenses" on public.expenses for update using (owner_id = auth.uid());
create policy "Users can delete own expenses" on public.expenses for delete using (owner_id = auth.uid());

-- Storage bucket for receipts
-- Run in Supabase Storage: create bucket 'receipts' public=false


