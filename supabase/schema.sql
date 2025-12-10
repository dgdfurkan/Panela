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
  completed_at timestamptz, -- When status changed to 'Done'
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

-- Simplify access: allow any authenticated user to manage creatives (matching other tables)
drop policy if exists "Team members can view marketing creatives." on marketing_creatives;
drop policy if exists "Team members can insert marketing creatives." on marketing_creatives;
drop policy if exists "Team members can update marketing creatives." on marketing_creatives;
drop policy if exists "Team members can delete marketing creatives." on marketing_creatives;

create policy "open view creatives"
  on marketing_creatives for select
  using ( true );

create policy "open insert creatives"
  on marketing_creatives for insert
  with check ( true );

create policy "open update creatives"
  on marketing_creatives for update
  using ( true );

create policy "open delete creatives"
  on marketing_creatives for delete
  using ( true );

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

-- 6. AI Tokens (Gemini)
create table if not exists public.ai_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid,
  label text,
  token text not null,
  priority integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Clean up any legacy FK to profiles
alter table public.ai_tokens
  drop constraint if exists ai_tokens_user_id_fkey;

alter table public.ai_tokens enable row level security;

create policy "open view ai tokens"
  on ai_tokens for select
  using ( true );

create policy "open insert ai tokens"
  on ai_tokens for insert
  with check ( true );

create policy "open update ai tokens"
  on ai_tokens for update
  using ( true );

create policy "open delete ai tokens"
  on ai_tokens for delete
  using ( true );

-- Creative history (kalıcı log)
create table if not exists public.creative_history (
  id uuid default uuid_generate_v4() primary key,
  creative_id uuid not null,
  changes text[],
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.creative_history enable row level security;

drop policy if exists "open view creative_history" on creative_history;
drop policy if exists "open insert creative_history" on creative_history;

create policy "open view creative_history"
  on creative_history for select
  using ( true );

create policy "open insert creative_history"
  on creative_history for insert
  with check ( true );

-- Todo Activities (activity log)
create table if not exists public.todo_activities (
  id uuid default uuid_generate_v4() primary key,
  todo_id uuid,
  user_id uuid,
  action_type text not null,
  details text,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.todo_activities enable row level security;

drop policy if exists "open view todo_activities" on todo_activities;
drop policy if exists "open insert todo_activities" on todo_activities;
drop policy if exists "open update todo_activities" on todo_activities;
drop policy if exists "open delete todo_activities" on todo_activities;

create policy "open view todo_activities"
  on todo_activities for select
  using ( true );

create policy "open insert todo_activities"
  on todo_activities for insert
  with check ( true );

create policy "open update todo_activities"
  on todo_activities for update
  using ( true );

create policy "open delete todo_activities"
  on todo_activities for delete
  using ( true );

-- Academy Hub Tables
-- Weeks
create table if not exists public.academy_weeks (
  id uuid default uuid_generate_v4() primary key,
  week_number integer not null unique,
  title text not null,
  description text,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.academy_weeks enable row level security;

drop policy if exists "open view academy_weeks" on academy_weeks;
drop policy if exists "open insert academy_weeks" on academy_weeks;
drop policy if exists "open update academy_weeks" on academy_weeks;
drop policy if exists "open delete academy_weeks" on academy_weeks;

create policy "open view academy_weeks" on academy_weeks for select using (true);
create policy "open insert academy_weeks" on academy_weeks for insert with check (true);
create policy "open update academy_weeks" on academy_weeks for update using (true);
create policy "open delete academy_weeks" on academy_weeks for delete using (true);

-- Resources (Instagram, YouTube, Website)
create table if not exists public.academy_resources (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid references public.academy_weeks(id) on delete cascade,
  resource_type text not null check (resource_type in ('instagram', 'youtube', 'website')),
  url text not null,
  title text,
  description text,
  is_good_example boolean default true,
  embed_data jsonb,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.academy_resources enable row level security;

drop policy if exists "open view academy_resources" on academy_resources;
drop policy if exists "open insert academy_resources" on academy_resources;
drop policy if exists "open update academy_resources" on academy_resources;
drop policy if exists "open delete academy_resources" on academy_resources;

create policy "open view academy_resources" on academy_resources for select using (true);
create policy "open insert academy_resources" on academy_resources for insert with check (true);
create policy "open update academy_resources" on academy_resources for update using (true);
create policy "open delete academy_resources" on academy_resources for delete using (true);

-- Videos (Classroom recordings)
create table if not exists public.academy_videos (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid references public.academy_weeks(id) on delete cascade,
  video_url text not null,
  video_provider text not null check (video_provider in ('cloudinary', 'youtube', 'vimeo', 'googledrive')),
  video_thumbnail text,
  video_duration integer, -- in seconds
  title text not null,
  description text,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.academy_videos enable row level security;

drop policy if exists "open view academy_videos" on academy_videos;
drop policy if exists "open insert academy_videos" on academy_videos;
drop policy if exists "open update academy_videos" on academy_videos;
drop policy if exists "open delete academy_videos" on academy_videos;

create policy "open view academy_videos" on academy_videos for select using (true);
create policy "open insert academy_videos" on academy_videos for insert with check (true);
create policy "open update academy_videos" on academy_videos for update using (true);
create policy "open delete academy_videos" on academy_videos for delete using (true);

-- Assignments
create table if not exists public.academy_assignments (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid references public.academy_weeks(id) on delete cascade,
  title text not null,
  description text,
  is_completed boolean default false,
  submission_url text,
  submission_file_url text,
  user_id uuid,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

alter table public.academy_assignments enable row level security;

drop policy if exists "open view academy_assignments" on academy_assignments;
drop policy if exists "open insert academy_assignments" on academy_assignments;
drop policy if exists "open update academy_assignments" on academy_assignments;
drop policy if exists "open delete academy_assignments" on academy_assignments;

create policy "open view academy_assignments" on academy_assignments for select using (true);
create policy "open insert academy_assignments" on academy_assignments for insert with check (true);
create policy "open update academy_assignments" on academy_assignments for update using (true);
create policy "open delete academy_assignments" on academy_assignments for delete using (true);

-- User Notes (Markdown)
create table if not exists public.academy_user_notes (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid references public.academy_weeks(id) on delete cascade,
  user_id uuid not null,
  content text, -- Markdown content
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now()),
  unique(week_id, user_id)
);

alter table public.academy_user_notes enable row level security;

drop policy if exists "open view academy_user_notes" on academy_user_notes;
drop policy if exists "open insert academy_user_notes" on academy_user_notes;
drop policy if exists "open update academy_user_notes" on academy_user_notes;
drop policy if exists "open delete academy_user_notes" on academy_user_notes;

create policy "open view academy_user_notes" on academy_user_notes for select using (true);
create policy "open insert academy_user_notes" on academy_user_notes for insert with check (true);
create policy "open update academy_user_notes" on academy_user_notes for update using (true);
create policy "open delete academy_user_notes" on academy_user_notes for delete using (true);

-- Notes Comments (Chat-like comments for each week)
create table if not exists public.academy_notes_comments (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid references public.academy_weeks(id) on delete cascade,
  user_id uuid not null,
  username text, -- Store username for display
  content text not null,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.academy_notes_comments enable row level security;

drop policy if exists "open view academy_notes_comments" on academy_notes_comments;
drop policy if exists "open insert academy_notes_comments" on academy_notes_comments;
drop policy if exists "open update academy_notes_comments" on academy_notes_comments;
drop policy if exists "open delete academy_notes_comments" on academy_notes_comments;

create policy "open view academy_notes_comments" on academy_notes_comments for select using (true);
create policy "open insert academy_notes_comments" on academy_notes_comments for insert with check (true);
create policy "open update academy_notes_comments" on academy_notes_comments for update using (true);
create policy "open delete academy_notes_comments" on academy_notes_comments for delete using (true);

-- Notes Summary (General summary per week)
create table if not exists public.academy_notes_summary (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid references public.academy_weeks(id) on delete cascade unique,
  content text,
  updated_at timestamptz default timezone('utc'::text, now()),
  updated_by_id uuid,
  updated_by_username text
);

alter table public.academy_notes_summary enable row level security;

drop policy if exists "open view academy_notes_summary" on academy_notes_summary;
drop policy if exists "open insert academy_notes_summary" on academy_notes_summary;
drop policy if exists "open update academy_notes_summary" on academy_notes_summary;
drop policy if exists "open delete academy_notes_summary" on academy_notes_summary;

create policy "open view academy_notes_summary" on academy_notes_summary for select using (true);
create policy "open insert academy_notes_summary" on academy_notes_summary for insert with check (true);
create policy "open update academy_notes_summary" on academy_notes_summary for update using (true);
create policy "open delete academy_notes_summary" on academy_notes_summary for delete using (true);

-- Quiz Questions
create table if not exists public.academy_quiz_questions (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid references public.academy_weeks(id) on delete cascade,
  question_type text not null check (question_type in ('fill_blank', 'matching', 'multiple_choice')),
  question_text text not null,
  options jsonb, -- For multiple choice options, matching pairs, etc.
  correct_answer text not null,
  explanation text,
  ai_generated boolean default false,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.academy_quiz_questions enable row level security;

drop policy if exists "open view academy_quiz_questions" on academy_quiz_questions;
drop policy if exists "open insert academy_quiz_questions" on academy_quiz_questions;
drop policy if exists "open update academy_quiz_questions" on academy_quiz_questions;
drop policy if exists "open delete academy_quiz_questions" on academy_quiz_questions;

create policy "open view academy_quiz_questions" on academy_quiz_questions for select using (true);
create policy "open insert academy_quiz_questions" on academy_quiz_questions for insert with check (true);
create policy "open update academy_quiz_questions" on academy_quiz_questions for update using (true);
create policy "open delete academy_quiz_questions" on academy_quiz_questions for delete using (true);

-- Quiz Attempts
create table if not exists public.academy_quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references public.academy_quiz_questions(id) on delete cascade,
  user_id uuid not null,
  user_answer text not null,
  is_correct boolean not null,
  attempted_at timestamptz default timezone('utc'::text, now())
);

alter table public.academy_quiz_attempts enable row level security;

drop policy if exists "open view academy_quiz_attempts" on academy_quiz_attempts;
drop policy if exists "open insert academy_quiz_attempts" on academy_quiz_attempts;
drop policy if exists "open update academy_quiz_attempts" on academy_quiz_attempts;
drop policy if exists "open delete academy_quiz_attempts" on academy_quiz_attempts;

create policy "open view academy_quiz_attempts" on academy_quiz_attempts for select using (true);
create policy "open insert academy_quiz_attempts" on academy_quiz_attempts for insert with check (true);
create policy "open update academy_quiz_attempts" on academy_quiz_attempts for update using (true);
create policy "open delete academy_quiz_attempts" on academy_quiz_attempts for delete using (true);

-- Product Hunting Lab (The Winner Hunter)
create table if not exists public.product_hunting_lab (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  product_name text not null,
  niche text check (niche in ('Health & Beauty', 'Pain Relief', 'Pet', 'Gadget - RISKLI', 'Other')),
  status text default 'Burner Phase' check (status in ('Burner Phase', 'Analysis', 'Validation', 'WINNER', 'Trash')),
  -- The 6 Pillars
  is_problem_solving boolean,
  profit_margin decimal(10, 2),
  is_lightweight boolean,
  is_evergreen boolean,
  upsell_potential text,
  -- Viral Math
  likes_count integer default 0,
  shares_count integer default 0,
  engagement_ratio decimal(10, 2),
  -- Validation Metrics
  search_volume integer,
  site_traffic integer,
  trend_status text check (trend_status in ('Stable', 'Exploding', 'Dying')),
  winner_score integer default 0 check (winner_score >= 0 and winner_score <= 100),
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

alter table public.product_hunting_lab enable row level security;

drop policy if exists "open view product_hunting_lab" on product_hunting_lab;
drop policy if exists "open insert product_hunting_lab" on product_hunting_lab;
drop policy if exists "open update product_hunting_lab" on product_hunting_lab;
drop policy if exists "open delete product_hunting_lab" on product_hunting_lab;

create policy "open view product_hunting_lab" on product_hunting_lab for select using (true);
create policy "open insert product_hunting_lab" on product_hunting_lab for insert with check (true);
create policy "open update product_hunting_lab" on product_hunting_lab for update using (true);
create policy "open delete product_hunting_lab" on product_hunting_lab for delete using (true);
