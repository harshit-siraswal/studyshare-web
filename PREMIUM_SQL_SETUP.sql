-- 1. Create premium_users table
create table if not exists public.premium_users (
  id uuid references auth.users not null primary key,
  email text,
  plan_type text default 'monthly', -- 'monthly' or 'yearly'
  premium_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.premium_users enable row level security;

-- 3. Policies
drop policy if exists "Users can read own premium status" on public.premium_users;
create policy "Users can read own premium status"
  on public.premium_users for select
  using ( auth.uid() = id );

-- Security Note: In a real app, users should NOT be able to insert/update their own premium status directly.
-- This should be done via a secure backend/webhook after payment verification.
-- For this MVP/Demo, we allow it to enable the razorpay flow to work entirely on client-side.
drop policy if exists "Users can update own premium status" on public.premium_users;
create policy "Users can update own premium status"
  on public.premium_users for update
  using ( auth.uid() = id );

drop policy if exists "Users can insert own premium status" on public.premium_users;
create policy "Users can insert own premium status"
  on public.premium_users for insert
  with check ( auth.uid() = id );

-- 4. Add expires_at to chat_rooms if not exists
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'chat_rooms' and column_name = 'expires_at') then
    alter table public.chat_rooms add column expires_at timestamptz;
  end if;
end $$;

-- 5. Index for expiration
create index if not exists idx_chat_rooms_expires_at on chat_rooms(expires_at);
