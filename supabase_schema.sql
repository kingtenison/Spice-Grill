-- Fable Restaurant OS: Core Database Schema & RLS Policies

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
create type user_role as enum ('admin', 'employee', 'customer');
create type order_status as enum ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- 3. TABLES

-- Profiles (Linked to Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role default 'customer'::user_role,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Menu Items
create table public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references public.categories on delete set null,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  is_available boolean default true,
  stock_quantity int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete set null,
  status order_status default 'pending'::order_status,
  total_amount numeric not null,
  subtotal numeric,
  tax_amount numeric,
  shipping_cost numeric,
  discount_amount numeric,
  delivery_address text,
  shipping_address jsonb,
  billing_address jsonb,
  special_instructions text,
  coupon_code text,
  shipping_method text,
  payment_method text,
  payment_status payment_status default 'pending'::payment_status,
  payment_reference text,
  guest_checkout boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order Items
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders on delete cascade,
  menu_item_id uuid references public.menu_items on delete set null,
  quantity int not null check (quantity > 0),
  unit_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Loyalty Points
create table public.loyalty_points (
  user_id uuid references public.profiles on delete cascade primary key,
  points int default 0,
  tier text default 'Bronze',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade,
  order_id uuid references public.orders on delete set null,
  rating int check (rating >= 1 and rating <= 5),
  comment text,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Blog Posts
create table public.blogs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  content text,
  excerpt text,
  status text default 'draft' check (status in ('draft', 'published')),
  category text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Campaigns
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null,
  status text default 'draft' check (status in ('draft', 'active', 'completed')),
  reach text,
  performance text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ROW LEVEL SECURITY (RLS)

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.loyalty_points enable row level security;
alter table public.reviews enable row level security;
alter table public.blogs enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Policies for Categories & Menu Items
create policy "Anyone can view categories." on public.categories for select using (true);
create policy "Anyone can view menu items." on public.menu_items for select using (is_available = true);
create policy "Admins can manage menu." on public.menu_items for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Policies for Orders
create policy "Users can view own orders." on public.orders for select using (auth.uid() = user_id);
create policy "Users can create orders." on public.orders for insert with check (auth.uid() = user_id);
create policy "Admins and Employees can view all orders." on public.orders for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'employee'))
);
create policy "Admins and Employees can update orders." on public.orders for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'employee'))
);

-- Policies for Order Items
create policy "Users can view own order items." on public.order_items for select using (
  exists (select 1 from public.orders where id = order_id and (user_id = auth.uid() or user_id is null))
);
create policy "Users can create order items." on public.order_items for insert with check (
  exists (select 1 from public.orders where id = order_id)
);
create policy "Admins can manage all order items." on public.order_items for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Policies for Blogs
create policy "Anyone can view published blogs." on public.blogs for select using (status = 'published');
create policy "Admins can manage blogs." on public.blogs for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 5. TRIGGERS

-- Automatically create profile on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  insert into public.loyalty_points (user_id, points)
  values (new.id, 0);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. LOYALTY POINTS POLICIES (add after table creation)
-- Drop old policies if they exist (safe re-run)
drop policy if exists "Users can view own loyalty points." on public.loyalty_points;
drop policy if exists "Users can update own loyalty points." on public.loyalty_points;

-- Users can view their own loyalty points
create policy "Users can view own loyalty points." on public.loyalty_points 
  for select using (auth.uid() = user_id);

-- Users can update their own loyalty points (for redemption)
create policy "Users can update own loyalty points." on public.loyalty_points 
  for update using (auth.uid() = user_id);

-- 7. LOYALTY COUPONS TABLE (for redeemed point rewards)
create table if not exists public.loyalty_coupons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  code text unique not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null,
  description text,
  points_cost int not null,
  is_used boolean default false,
  expires_at timestamp with time zone default (now() + interval '90 days'),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.loyalty_coupons enable row level security;

create policy "Users can view own loyalty coupons." on public.loyalty_coupons 
  for select using (auth.uid() = user_id);

create policy "Users can update own loyalty coupons (mark used)." on public.loyalty_coupons 
  for update using (auth.uid() = user_id);

-- Admins can view all for management
create policy "Admins can manage loyalty coupons." on public.loyalty_coupons 
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 8. HELPER FUNCTION: Safely award loyalty points (callable from API)
create or replace function public.award_loyalty_points(p_user_id uuid, p_points int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  new_points int;
  new_tier text;
begin
  if p_points <= 0 then
    return;
  end if;

  insert into public.loyalty_points (user_id, points, tier)
  values (p_user_id, p_points, 
    case 
      when p_points >= 2001 then 'Gold'
      when p_points >= 501 then 'Silver'
      else 'Bronze'
    end
  )
  on conflict (user_id) do update
  set 
    points = public.loyalty_points.points + p_points,
    updated_at = now();

  -- Recalculate tier
  select points into new_points from public.loyalty_points where user_id = p_user_id;
  
  new_tier := case 
    when new_points >= 2001 then 'Gold'
    when new_points >= 501 then 'Silver'
    else 'Bronze'
  end;

  update public.loyalty_points 
  set tier = new_tier, updated_at = now()
  where user_id = p_user_id;
end;
$$;

-- 9. HELPER FUNCTION: Redeem loyalty points for a coupon
create or replace function public.redeem_loyalty_points(
  p_user_id uuid, 
  p_points_cost int,
  p_discount_type text,
  p_discount_value numeric,
  p_description text
)
returns table (
  coupon_code text,
  success boolean,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_points int;
  new_code text;
begin
  -- Get current points with lock
  select points into current_points 
  from public.loyalty_points 
  where user_id = p_user_id 
  for update;

  if current_points is null or current_points < p_points_cost then
    return query select ''::text, false, 'Insufficient points'::text;
    return;
  end if;

  -- Generate unique code
  new_code := 'REWARD-' || upper(substring(md5(random()::text) from 1 for 8));

  -- Deduct points
  update public.loyalty_points 
  set points = points - p_points_cost,
      updated_at = now()
  where user_id = p_user_id;

  -- Recalculate tier after deduction
  update public.loyalty_points
  set tier = case 
        when (points) >= 2001 then 'Gold'
        when (points) >= 501 then 'Silver'
        else 'Bronze'
      end
  where user_id = p_user_id;

  -- Create coupon
  insert into public.loyalty_coupons (user_id, code, discount_type, discount_value, description, points_cost)
  values (p_user_id, new_code, p_discount_type, p_discount_value, p_description, p_points_cost);

  return query select new_code, true, 'Reward redeemed successfully'::text;
end;
$$;
