-- 1. DROP OLD TABLES (Clean Slate for new logic)
-- DİKKAT: Bu işlem mevcut verileri siler. Proje başı olduğu için sorun yok.
drop table if exists public.products;
drop table if exists public.todos;
drop table if exists public.roadmap_steps;
drop table if exists public.profiles;

-- 2. CUSTOM USERS TABLE (Basit Kullanıcı Tablosu)
-- Buraya elle kullanıcı ekleyeceksiniz. (Username & Password)
create table public.app_users (
  id uuid default uuid_generate_v4() primary key,
  username text not null unique,
  password text not null, -- Plain text olarak saklanacak (isteğiniz üzerine)
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS (Row Level Security) KAPATIYORUZ (Siz manuel yöneteceğiniz için karmaşa olmasın)
alter table public.app_users enable row level security;
create policy "Allow public read/write" on public.app_users for all using (true) with check (true);

-- 3. PRODUCTS TABLE
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid, -- Artık app_users tablosuna referans verebilir veya boş bırakabiliriz
  name text not null,
  link text,
  price text,
  status text default 'Idea',
  thoughts text,
  priority text default 'Medium',
  is_favorite boolean default false,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Herkese açık (Public app mantığı)
alter table public.products enable row level security;
create policy "Allow public read/write" on public.products for all using (true) with check (true);


-- 4. TODOS TABLE
create table public.todos (
  id uuid default uuid_generate_v4() primary key,
  created_by uuid, -- app_users.id referansı (opsiyonel)
  title text not null,
  status text default 'Todo',
  priority text default 'Medium',
  due_date date,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.todos enable row level security;
create policy "Allow public read/write" on public.todos for all using (true) with check (true);


-- 5. ROADMAP TABLE
create table public.roadmap_steps (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text default 'Not Started',
  research_notes text,
  category text,
  sort_order integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.roadmap_steps enable row level security;
create policy "Allow public read/write" on public.roadmap_steps for all using (true) with check (true);


-- 6. ÖRNEK KULLANICILAR (Sizin için ekliyorum)
insert into public.app_users (username, password, full_name) values 
('furkan', '1234', 'Furkan Gündüz'),
('ortak', '1234', 'Proje Ortağı');

-- 7. ÖRNEK ROADMAP DATA
insert into public.roadmap_steps (title, description, category, sort_order) values
('Pazar Araştırması', 'Satılacak niş veya ürün kategorisinin belirlenmesi.', 'Research', 1),
('Şirket Kurulumu', 'Şahıs şirketi veya Limited şirket açma.', 'Legal', 2),
('Rakip Analizi', 'Benzer ürünleri satan 3-5 rakibin incelenmesi.', 'Research', 3),
('Tedarikçi Bulma', 'Alibaba veya yerel toptancılarla iletişim.', 'Sourcing', 4);
