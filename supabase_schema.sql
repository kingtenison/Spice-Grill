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
  delivery_address text,
  payment_status payment_status default 'pending'::payment_status,
  payment_reference text,
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
