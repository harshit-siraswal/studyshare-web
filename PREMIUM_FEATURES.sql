
-- 1. Create premium_users table
create table if not exists public.premium_users (
  id uuid references auth.users not null primary key,
  email text,
  plan_type text default 'monthly', -- 'monthly' (49), 'yearly' (149) or custom codes
  premium_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.premium_users enable row level security;

-- 3. Policies (Drop first to avoid "already exists" error)
drop policy if exists "Users can read own premium status" on public.premium_users;
create policy "Users can read own premium status"
  on public.premium_users for select
  using ( auth.uid() = id );

drop policy if exists "Users can insert own premium status" on public.premium_users;
create policy "Users can insert own premium status"
  on public.premium_users for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own premium status" on public.premium_users;
create policy "Users can update own premium status"
  on public.premium_users for update
  using ( auth.uid() = id );

-- 4. Add expires_at to chat_rooms
alter table public.chat_rooms 
add column if not exists expires_at timestamptz;

-- 5. Optional: Add index for expiration queries
create index if not exists idx_chat_rooms_expires_at on chat_rooms(expires_at);
