-- Migration: swipe_selections tablosunu oturum başına tek satır yapısına dönüştür
-- Mevcut verileri korur, yeni yapıya migrate eder

-- 1. Yeni yapı için geçici tablo oluştur
create table if not exists public.swipe_selections_new (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid not null unique,
  session_code text not null,
  selected_by uuid references public.app_users(id),
  selected_products jsonb not null default '[]'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()),
  finished_at timestamptz
);

-- 2. Mevcut verileri yeni yapıya migrate et
insert into public.swipe_selections_new (session_id, session_code, selected_by, selected_products, created_at, finished_at)
select 
  session_id,
  coalesce(session_code, 'MIGRATED-' || substring(session_id::text, 1, 8)) as session_code,
  selected_by,
  jsonb_agg(
    jsonb_build_object(
      'product_id', product_id,
      'is_selected', is_selected,
      'selected_at', selected_at
    ) order by selected_at
  ) as selected_products,
  min(selected_at) as created_at,
  max(case when exists (
    select 1 from public.swipe_selections s2 
    where s2.session_id = s1.session_id 
    and s2.selected_at > s1.selected_at
  ) then null else selected_at end) as finished_at
from public.swipe_selections s1
group by session_id, session_code, selected_by
on conflict (session_id) do nothing;

-- 3. Eski tabloyu yedekle (opsiyonel, güvenlik için)
alter table public.swipe_selections rename to swipe_selections_old_backup;

-- 4. Yeni tabloyu aktif et
alter table public.swipe_selections_new rename to swipe_selections;

-- 5. İndeksleri oluştur
create index if not exists idx_swipe_selections_session on public.swipe_selections(session_id);
create index if not exists idx_swipe_selections_session_code on public.swipe_selections(session_code);
create index if not exists idx_swipe_selections_created on public.swipe_selections(created_at);

-- 6. RLS politikalarını uygula
alter table public.swipe_selections enable row level security;

drop policy if exists "open view swipe_selections" on swipe_selections;
drop policy if exists "open insert swipe_selections" on swipe_selections;
drop policy if exists "open update swipe_selections" on swipe_selections;
drop policy if exists "open delete swipe_selections" on swipe_selections;

create policy "open view swipe_selections" on swipe_selections for select using (true);
create policy "open insert swipe_selections" on swipe_selections for insert with check (true);
create policy "open update swipe_selections" on swipe_selections for update using (true);
create policy "open delete swipe_selections" on swipe_selections for delete using (true);

-- NOT: Eski yedek tablo (swipe_selections_old_backup) isterseniz sonra silebilirsiniz
-- drop table if exists public.swipe_selections_old_backup;

