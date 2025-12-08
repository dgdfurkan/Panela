-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  username text,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(username) >= 3)
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Handle new user signup automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Products Table (The "Excel" View)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  link text,
  price text, -- Keeping as text for flexibility (e.g. "100-200 TL") or simple numeric strings
  status text default 'Idea', -- 'Idea', 'Researching', 'Sourcing', 'Live'
  thoughts text,
  priority text default 'Medium', -- 'Low', 'Medium', 'High'
  is_favorite boolean default false,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.products enable row level security;

-- Policy: Only authenticated users can see/edit products (Since it's a shared project for friends, we might want shared access, 
-- but for now assuming all auth users are "the team". 
-- If strict privacy per user is needed, add "using (auth.uid() = user_id)".
-- Given "ikimizin ortak olarak kullanabileceği", we'll allow all authenticated users to manage all products.)

create policy "Team members can view all products."
  on products for select
  using ( auth.role() = 'authenticated' );

create policy "Team members can insert products."
  on products for insert
  with check ( auth.role() = 'authenticated' );

create policy "Team members can update products."
  on products for update
  using ( auth.role() = 'authenticated' );

create policy "Team members can delete products."
  on products for delete
  using ( auth.role() = 'authenticated' );


-- 3. Todos Table (Kanban/List)
create table public.todos (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid references public.profiles(id),
  title text not null,
  status text default 'Todo', -- 'Todo', 'In Progress', 'Done'
  priority text default 'Medium',
  due_date date,
  tags text[], -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.todos enable row level security;

create policy "Team members can view all todos."
  on todos for select
  using ( auth.role() = 'authenticated' );

create policy "Team members can insert todos."
  on todos for insert
  with check ( auth.role() = 'authenticated' );

create policy "Team members can update todos."
  on todos for update
  using ( auth.role() = 'authenticated' );

create policy "Team members can delete todos."
  on todos for delete
  using ( auth.role() = 'authenticated' );


-- 4. Roadmap Steps (Startup Guide)
create table public.roadmap_steps (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text default 'Not Started', -- 'Not Started', 'Learning', 'Completed'
  research_notes text,
  category text, -- 'Legal', 'Sourcing', 'Marketing'
  sort_order integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.roadmap_steps enable row level security;

-- Everyone can read, team can edit status/notes
create policy "Team members can view roadmap."
  on roadmap_steps for select
  using ( auth.role() = 'authenticated' );

create policy "Team members can update roadmap progress."
  on roadmap_steps for update
  using ( auth.role() = 'authenticated' );

-- Initial Seed Data for Roadmap
insert into public.roadmap_steps (title, description, category, sort_order) values
('Pazar Araştırması', 'Satılacak niş veya ürün kategorisinin belirlenmesi.', 'Research', 1),
('Şirket Kurulumu', 'Şahıs şirketi veya Limited şirket açma ve vergi mükellefiyeti.', 'Legal', 2),
('Rakip Analizi', 'Benzer ürünleri satan 3-5 rakibin incelenmesi.', 'Research', 3),
('Vergi Muafiyetleri', 'Genç girişimci desteği vb. avantajların araştırılması.', 'Legal', 4),
('Tedarikçi Bulma', 'Alibaba veya yerel toptancılarla iletişim.', 'Sourcing', 5);


-- 5. Marketing Creatives (Creative Lab)
-- Enums
create type public.platform_enum as enum ('Meta', 'TikTok', 'Google', 'YouTube', 'Email', 'Influencer');
create type public.visual_type_enum as enum ('Video', 'Image', 'Carousel');
create type public.creative_status_enum as enum ('Draft', 'Active', 'Paused', 'Completed');

-- Table
create table public.marketing_creatives (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id),
  platform public.platform_enum not null,
  strategy_angle text,
  target_audience jsonb,
  ad_copy_primary text,
  ad_headline text,
  visual_type public.visual_type_enum,
  tags text[],
  status public.creative_status_enum default 'Draft',
  metrics jsonb default '{}'::jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS
alter table public.marketing_creatives enable row level security;

create policy "Team members can view marketing creatives."
  on marketing_creatives for select
  using ( auth.role() = 'authenticated' );

create policy "Team members can insert marketing creatives."
  on marketing_creatives for insert
  with check ( auth.role() = 'authenticated' );

create policy "Team members can update marketing creatives."
  on marketing_creatives for update
  using ( auth.role() = 'authenticated' );

create policy "Team members can delete marketing creatives."
  on marketing_creatives for delete
  using ( auth.role() = 'authenticated' );

-- Trigger: auto-update updated_at
create or replace function public.marketing_creatives_set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp
before update on public.marketing_creatives
for each row
execute procedure public.marketing_creatives_set_updated_at();
