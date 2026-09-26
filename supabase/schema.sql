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
