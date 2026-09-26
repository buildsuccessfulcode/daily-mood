-- Daily Mood - Supabase / PostgreSQL schema
-- Jalankan seluruh file ini di Supabase SQL Editor pada database baru.

create extension if not exists pgcrypto;

-- 1. Kategori quote (dinamis, dikelola admin)
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    key varchar(40) unique not null,
    label varchar(80) not null,
    icon_name varchar(50) not null default 'cloud-rain',
    theme_gradient varchar(100) not null default 'from-indigo-600 to-purple-600',
    prompt text not null,
    sort_order int not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Quote harian (dibuat cron, disimpan maksimal 7 hari)
create table if not exists public.quotes (
    id uuid primary key default gen_random_uuid(),
    category_id uuid not null references public.categories(id) on delete cascade,
    text text not null,
    theme_gradient varchar(100) not null default 'from-indigo-600 to-purple-600',
    icon_name varchar(50) not null default 'cloud-rain',
    created_at timestamptz not null default now()
);

create index if not exists idx_quotes_category_created
    on public.quotes (category_id, created_at desc);
create index if not exists idx_quotes_created
    on public.quotes (created_at desc);

-- 3. Admin (hanya diakses lewat service role)
create table if not exists public.admins (
    id uuid primary key default gen_random_uuid(),
    username varchar(50) unique not null,
    password_hash text not null,
    last_login_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. Pengaturan aplikasi (rahasia disimpan terenkripsi)
create table if not exists public.app_settings (
    key varchar(50) primary key,
    value text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated
    before update on public.categories
    for each row execute function public.set_updated_at();

drop trigger if exists trg_admins_updated on public.admins;
create trigger trg_admins_updated
    before update on public.admins
    for each row execute function public.set_updated_at();

drop trigger if exists trg_app_settings_updated on public.app_settings;
create trigger trg_app_settings_updated
    before update on public.app_settings
    for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.categories enable row level security;
alter table public.quotes enable row level security;
alter table public.admins enable row level security;
alter table public.app_settings enable row level security;

-- Anon hanya boleh membaca kategori aktif dan quote.
-- admins & app_settings sengaja tanpa policy -> hanya service role.
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
    for select using (is_active = true);

drop policy if exists "public read quotes" on public.quotes;
create policy "public read quotes" on public.quotes
    for select using (true);

-- 5. Journal harian pengguna (maksimal 1 entri per hari, immutable)
do $$
begin
    create type public.user_mood_type as enum ('SAD', 'TIRED', 'NEUTRAL', 'HAPPY', 'EXCITED');
exception
    when duplicate_object then null;
end $$;

create table if not exists public.user_journals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    journal_date date not null,
    mood public.user_mood_type not null,
    entry_text text not null,
    ai_response text not null,
    created_at timestamptz not null default now(),
    constraint unique_user_daily_journal unique (user_id, journal_date)
);

create index if not exists idx_user_journals_lookup
    on public.user_journals (user_id, journal_date desc);

-- 6. Profil pengguna (nickname + data dari Google)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nickname varchar(24),
    display_name varchar(80),
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
    before update on public.profiles
    for each row execute function public.set_updated_at();

-- Nickname unik (case-insensitive), boleh null selama pendaftaran belum selesai
create unique index if not exists idx_profiles_nickname_unique
    on public.profiles (lower(nickname))
    where nickname is not null;

-- Auto-buat profil saat user baru dibuat (email/password maupun Google OAuth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, nickname, display_name, avatar_url)
    values (
        new.id,
        nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'name'
        ),
        new.raw_user_meta_data ->> 'avatar_url'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Row Level Security: journal & profil hanya untuk pemiliknya
alter table public.user_journals enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "users read own journals" on public.user_journals;
create policy "users read own journals" on public.user_journals
    for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users insert own journals" on public.user_journals;
create policy "users insert own journals" on public.user_journals
    for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
    for select to authenticated using (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
    for insert to authenticated with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
