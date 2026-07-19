-- ============================================================
-- Teacher Codes Store - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null unique,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz default now()
);

-- SECTIONS (e.g. Science, Math, Literature)
create table if not exists sections (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image text,
  created_at timestamptz default now()
);

-- SUBJECTS
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid not null references sections(id) on delete cascade,
  name text not null,
  description text,
  image text,
  created_at timestamptz default now()
);

-- TEACHERS
create table if not exists teachers (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  image text,
  description text,
  created_at timestamptz default now()
);

-- PRODUCTS
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  title text not null,
  description text,
  price numeric(10,2) not null,
  image text,
  is_reusable boolean not null default false,
  created_at timestamptz default now()
);

-- CODES
create table if not exists codes (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  code text not null,
  status text not null default 'unused' check (status in ('unused', 'sold')),
  sold_to uuid references auth.users(id) on delete set null,
  sold_at timestamptz,
  created_at timestamptz default now()
);

-- ORDERS
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- PAYMENTS
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  method text not null check (method in ('instapay', 'vodafone_cash')),
  screenshot_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_subjects_section on subjects(section_id);
create index if not exists idx_teachers_subject on teachers(subject_id);
create index if not exists idx_products_teacher on products(teacher_id);
create index if not exists idx_codes_product on codes(product_id);
create index if not exists idx_codes_sold_to on codes(sold_to);
create index if not exists idx_codes_status on codes(status);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_product on orders(product_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_payments_order on payments(order_id);
create index if not exists idx_payments_user on payments(user_id);
create index if not exists idx_payments_status on payments(status);
create index if not exists idx_profiles_role on profiles(role);

-- STORAGE BUCKET
insert into storage.buckets (id, name, public) values ('payments', 'payments', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('teachers', 'teachers', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict do nothing;

-- ROW LEVEL SECURITY

-- Profiles
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can update any profile" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Sections
alter table sections enable row level security;
create policy "Sections are viewable by everyone" on sections for select using (true);
create policy "Admins can insert sections" on sections for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update sections" on sections for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete sections" on sections for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Subjects
alter table subjects enable row level security;
create policy "Subjects are viewable by everyone" on subjects for select using (true);
create policy "Admins can manage subjects" on subjects for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update subjects" on subjects for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete subjects" on subjects for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Teachers
alter table teachers enable row level security;
create policy "Teachers are viewable by everyone" on teachers for select using (true);
create policy "Admins can manage teachers" on teachers for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update teachers" on teachers for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete teachers" on teachers for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Products
alter table products enable row level security;
create policy "Products are viewable by everyone" on products for select using (true);
create policy "Admins can manage products" on products for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update products" on products for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete products" on products for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- CODES: Students NEVER see codes directly. Only through their purchases.
alter table codes enable row level security;
create policy "Codes are viewable by admins only" on codes for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can manage codes" on codes for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update codes" on codes for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete codes" on codes for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Orders
alter table orders enable row level security;
create policy "Students can view own orders" on orders for select using (auth.uid() = user_id);
create policy "Admins can view all orders" on orders for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Students can insert own orders" on orders for insert with check (auth.uid() = user_id);
create policy "Admins can update orders" on orders for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Students can update own pending orders" on orders for update using (auth.uid() = user_id and status = 'pending');
create policy "Admins can delete orders" on orders for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Payments
alter table payments enable row level security;
create policy "Students can view own payments" on payments for select using (auth.uid() = user_id);
create policy "Admins can view all payments" on payments for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Students can insert own payments" on payments for insert with check (auth.uid() = user_id);
create policy "Admins can update payments" on payments for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Storage
create policy "Students can upload payment screenshots" on storage.objects for insert with check (
  bucket_id = 'payments' and auth.role() = 'authenticated'
);
create policy "Students can view own payment screenshots" on storage.objects for select using (
  bucket_id = 'payments' and auth.role() = 'authenticated'
);
create policy "Admins can view all payment screenshots" on storage.objects for select using (
  bucket_id = 'payments' and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Public can view teacher images" on storage.objects for select using (
  bucket_id = 'teachers'
);
create policy "Public can view product images" on storage.objects for select using (
  bucket_id = 'products'
);
create policy "Admins can upload teacher images" on storage.objects for insert with check (
  bucket_id = 'teachers' and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can upload product images" on storage.objects for insert with check (
  bucket_id = 'products' and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'User'),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
