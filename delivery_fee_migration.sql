-- Delivery Fee System Migration
-- Run this against Supabase SQL Editor

-- 1. Delivery Settings (admin-configurable rates)
create table if not exists public.delivery_settings (
  id uuid default uuid_generate_v4() primary key,
  delivery_fee numeric default 3.99 not null,
  service_fee numeric default 4.00 not null,
  service_fee_radius_miles numeric default 5.0 not null,
  per_mile_rate numeric default 0.70 not null,
  free_delivery_radius_miles numeric default 0 not null,
  small_order_threshold numeric default 15.00 not null,
  small_order_fee numeric default 2.50 not null,
  driver_base_pay numeric default 3.00 not null,
  driver_mileage_pay numeric default 0.70 not null,
  restaurant_lat numeric default 46.8772 not null,
  restaurant_lng numeric default -96.7898 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default settings if none exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.delivery_settings LIMIT 1) THEN
    INSERT INTO public.delivery_settings (id) VALUES (default);
  END IF;
END $$;

-- 2. Dispatcher Bank Accounts
create table if not exists public.dispatcher_bank_accounts (
  id uuid default uuid_generate_v4() primary key,
  dispatcher_id uuid references public.dispatchers on delete cascade unique not null,
  routing_number text not null,
  account_number_encrypted text not null,
  account_last_four text not null,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Dispatcher Earnings
create table if not exists public.dispatcher_earnings (
  id uuid default uuid_generate_v4() primary key,
  dispatcher_id uuid references public.dispatchers on delete cascade not null,
  order_id uuid references public.orders on delete cascade not null,
  distance_miles numeric default 0 not null,
  base_pay numeric default 0 not null,
  mileage_pay numeric default 0 not null,
  total_earned numeric default 0 not null,
  is_paid boolean default false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Platform Fees
create table if not exists public.platform_fees (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders on delete cascade unique not null,
  delivery_fee numeric default 0 not null,
  service_fee numeric default 0 not null,
  small_order_fee numeric default 0 not null,
  total_collected numeric default 0 not null,
  dispatcher_payout numeric default 0 not null,
  platform_net numeric default 0 not null,
  distance_miles numeric default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Add columns to orders
alter table public.orders add column if not exists delivery_fee numeric default 0;
alter table public.orders add column if not exists service_fee numeric default 0;
alter table public.orders add column if not exists small_order_fee numeric default 0;
alter table public.orders add column if not exists distance_miles numeric default 0;
alter table public.orders add column if not exists customer_location jsonb;

-- 6. Enable RLS
alter table public.delivery_settings enable row level security;
alter table public.dispatcher_bank_accounts enable row level security;
alter table public.dispatcher_earnings enable row level security;
alter table public.platform_fees enable row level security;

-- 7. RLS Policies

-- Delivery Settings
do $$ begin
  create policy "Anyone can view delivery settings." on public.delivery_settings for select using (true);
exception when duplicate_object THEN null;
end $$;

do $$ begin
  create policy "Admins can update delivery settings." on public.delivery_settings for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
exception when duplicate_object THEN null;
end $$;

-- Dispatcher Bank Accounts
do $$ begin
  create policy "Dispatchers can view own bank account." on public.dispatcher_bank_accounts for select using (
    exists (select 1 from public.dispatchers where id = dispatcher_id and user_id = auth.uid())
  );
exception when duplicate_object THEN null;
end $$;

do $$ begin
  create policy "Dispatchers can update own bank account." on public.dispatcher_bank_accounts for update using (
    exists (select 1 from public.dispatchers where id = dispatcher_id and user_id = auth.uid())
  );
exception when duplicate_object THEN null;
end $$;

do $$ begin
  create policy "Dispatchers can insert own bank account." on public.dispatcher_bank_accounts for insert with check (
    exists (select 1 from public.dispatchers where id = dispatcher_id and user_id = auth.uid())
  );
exception when duplicate_object THEN null;
end $$;

do $$ begin
  create policy "Admins can view all bank accounts." on public.dispatcher_bank_accounts for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
exception when duplicate_object THEN null;
end $$;

-- Dispatcher Earnings
do $$ begin
  create policy "Dispatchers can view own earnings." on public.dispatcher_earnings for select using (
    exists (select 1 from public.dispatchers where id = dispatcher_id and user_id = auth.uid())
  );
exception when duplicate_object THEN null;
end $$;

do $$ begin
  create policy "Admins can manage all earnings." on public.dispatcher_earnings for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
exception when duplicate_object THEN null;
end $$;

-- Platform Fees
do $$ begin
  create policy "Admins can manage platform fees." on public.platform_fees for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
exception when duplicate_object THEN null;
end $$;
