-- ============================================================
-- Digital Signage 24h - Supabase migration
-- Run this in the Supabase SQL Editor.
-- Creates: ads, screens tables + RLS + helper functions + seed.
-- ============================================================

-- ---------- TABLES ----------

create table if not exists public.ads (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  media_type  text not null check (media_type in ('image', 'video')),
  media_url   text not null,
  duration    integer,            -- seconds (used for images; videos use natural length)
  position    integer not null default 0,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.screens (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  name         text not null default 'Tablet',
  is_active    boolean not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------- INDEXES ----------

create index if not exists idx_ads_active_position on public.ads (is_active, position);
create index if not exists idx_screens_code on public.screens (code);

-- ---------- ROW LEVEL SECURITY ----------

alter table public.ads enable row level security;
alter table public.screens enable row level security;

-- Public (anon key) can only read ACTIVE ads.
drop policy if exists "read active ads" on public.ads;
create policy "read active ads"
  on public.ads for select
  using (is_active = true);

-- Authenticated admin: full access.
drop policy if exists "admin all ads" on public.ads;
create policy "admin all ads"
  on public.ads for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin all screens" on public.screens;
create policy "admin all screens"
  on public.screens for all
  to authenticated
  using (true)
  with check (true);

-- ---------- FUNCTIONS ----------

-- Used by the tablet on first run: tells whether a pairing code exists.
-- security definer: runs as table owner, bypassing RLS (reads screens).
create or replace function public.verify_screen(p_code text)
returns table (valid boolean, screen_id uuid, name text, is_active boolean)
language sql security definer
as $$
  select true, s.id, s.name, s.is_active
  from public.screens s
  where s.code = p_code
  union all
  select false, null::uuid, null::text, false
  where not exists (select 1 from public.screens where code = p_code)
  limit 1;
$$;

-- Called periodically by a paired tablet to update last_seen_at.
create or replace function public.ping_screen(p_code text)
returns void
language sql security definer
as $$
  update public.screens
  set last_seen_at = now()
  where code = p_code;
$$;

-- ---------- PLAY COUNTER (added later) ----------

-- Counts how many times each ad has been fully played.
alter table public.ads
  add column if not exists play_count integer not null default 0;

-- Called by the tablet every time an ad finishes playing.
create or replace function public.increment_ad_play(p_ad_id uuid)
returns void
language sql security definer
as $$
  update public.ads
  set play_count = play_count + 1
  where id = p_ad_id;
$$;

-- ---------- STORAGE (added later) ----------

-- Bucket "ad-media" (public) must already exist in Storage > Buckets.
-- storage.objects has RLS enabled with NO policies by default, so uploads
-- fail with "new row violates row-level security policy". These policies
-- allow the logged-in admin to manage media and anyone to read it.
drop policy if exists "public read ad-media" on storage.objects;
create policy "public read ad-media"
  on storage.objects for select
  using (bucket_id = 'ad-media');

drop policy if exists "admin upload ad-media" on storage.objects;
create policy "admin upload ad-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ad-media');

drop policy if exists "admin update ad-media" on storage.objects;
create policy "admin update ad-media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'ad-media')
  with check (bucket_id = 'ad-media');

drop policy if exists "admin delete ad-media" on storage.objects;
create policy "admin delete ad-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'ad-media');

-- ---------- SETTINGS (kiosk exit PIN, added later) ----------

-- Key/value store. exit_pin_hash stores the SHA-256 of the kiosk exit PIN
-- (hex). The tablet fetches the hash with the anon key and compares it
-- against the hash of the typed PIN, so the plaintext PIN never reaches
-- the database or travels over the API.
create extension if not exists pgcrypto;

create table if not exists public.settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

-- Anyone (tablets, with the anon key) may read settings values (PIN is hashed).
drop policy if exists "read settings" on public.settings;
create policy "read settings"
  on public.settings for select
  using (true);

-- Authenticated admin: full access.
drop policy if exists "admin all settings" on public.settings;
create policy "admin all settings"
  on public.settings for all
  to authenticated
  using (true)
  with check (true);

-- Default exit PIN: 123456 (only the hash is stored; change it in the Admin panel).
insert into public.settings (key, value)
values ('exit_pin_hash', encode(digest('123456', 'sha256'), 'hex'))
on conflict (key) do nothing;

-- ---------- DEVICE GROUPS (ads segmented per group, added later) ----------

-- Screens can be grouped (e.g. "Lobby", "Restaurantes"). Ads are assigned to
-- groups via ad_groups; an ad with NO assignments plays on every screen
-- (global behavior preserved).

create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  created_at timestamptz not null default now()
);

-- Screen without a group is allowed; it only sees unassigned (global) ads.
alter table public.screens
  add column if not exists group_id uuid references public.groups(id) on delete set null;

-- Junction: which groups each ad is shown in.
create table if not exists public.ad_groups (
  ad_id    uuid not null references public.ads(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  primary key (ad_id, group_id)
);

create index if not exists idx_ad_groups_group on public.ad_groups (group_id);

alter table public.groups enable row level security;
alter table public.ad_groups enable row level security;

-- Authenticated admin: full access. Public (tablets) never reads these
-- directly — the playlist comes from the get_playlist RPC below.
drop policy if exists "admin all groups" on public.groups;
create policy "admin all groups"
  on public.groups for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin all ad_groups" on public.ad_groups;
create policy "admin all ad_groups"
  on public.ad_groups for all
  to authenticated
  using (true)
  with check (true);

-- Returns the screen's group along with the pairing result.
drop function if exists public.verify_screen(text);
create or replace function public.verify_screen(p_code text)
returns table (valid boolean, screen_id uuid, name text, is_active boolean, group_id uuid)
language sql security definer
as $$
  select true, s.id, s.name, s.is_active, s.group_id
  from public.screens s
  where s.code = p_code
  union all
  select false, null::uuid, null::text, false, null::uuid
  where not exists (select 1 from public.screens where code = p_code)
  limit 1;
$$;

-- Playlist for a paired screen: active ads that are either global (no group
-- assignment) or assigned to the screen's group. Runs as table owner so the
-- tablet (anon key) does not need read access to ad_groups.
create or replace function public.get_playlist(p_code text)
returns table (
  id          uuid,
  title       text,
  description text,
  media_type  text,
  media_url   text,
  duration    integer,
  "position"  integer,
  is_active   boolean,
  play_count  integer,
  created_at  timestamptz,
  updated_at  timestamptz
)
language sql security definer
as $$
  select a.id, a.title, a.description, a.media_type, a.media_url,
         a.duration, a.position, a.is_active, a.play_count,
         a.created_at, a.updated_at
  from public.ads a
  where a.is_active = true
    and (
      not exists (select 1 from public.ad_groups ag where ag.ad_id = a.id)
      or exists (
        select 1 from public.ad_groups ag
        join public.screens s on s.group_id = ag.group_id
        where ag.ad_id = a.id and s.code = p_code
      )
    )
  order by a.position asc, a.created_at asc;
$$;

-- ---------- SEED ----------

-- The admin account password is NOT stored here.
-- Create the admin user in Authentication > Users instead.
-- Optionally seed a demo screen (register it in the Admin panel instead).

-- ---------- SECURITY REVIEW (2026-08-17) ----------

-- Revoke public EXECUTE on the event-trigger helper (used only by the
-- "ensure_rls" event trigger, which runs as superuser anyway).
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- All RPC functions now pin an empty search_path (all references are
-- schema-qualified, so nothing breaks; pg_catalog is still searched).
create or replace function public.get_playlist(p_code text)
returns table (
  id          uuid,
  title       text,
  description text,
  media_type  text,
  media_url   text,
  duration    integer,
  "position"  integer,
  is_active   boolean,
  play_count  integer,
  created_at  timestamptz,
  updated_at  timestamptz
)
language sql security definer
set search_path = ''
as $$
  select a.id, a.title, a.description, a.media_type, a.media_url,
         a.duration, a."position", a.is_active, a.play_count,
         a.created_at, a.updated_at
  from public.ads a
  where a.is_active = true
    and (
      not exists (select 1 from public.ad_groups ag where ag.ad_id = a.id)
      or exists (
        select 1 from public.ad_groups ag
        join public.screens s on s.group_id = ag.group_id
        where ag.ad_id = a.id and s.code = p_code
      )
    )
  order by a."position" asc, a.created_at asc;
$$;

create or replace function public.verify_screen(p_code text)
returns table (valid boolean, screen_id uuid, name text, is_active boolean, group_id uuid)
language sql security definer
set search_path = ''
as $$
  select true, s.id, s.name, s.is_active, s.group_id
  from public.screens s
  where s.code = p_code
  union all
  select false, null::uuid, null::text, false, null::uuid
  where not exists (select 1 from public.screens where code = p_code)
  limit 1;
$$;

create or replace function public.ping_screen(p_code text)
returns void
language sql security definer
set search_path = ''
as $$
  update public.screens
  set last_seen_at = now()
  where code = p_code;
$$;

create or replace function public.increment_ad_play(p_ad_id uuid)
returns void
language sql security definer
set search_path = ''
as $$
  update public.ads
  set play_count = play_count + 1
  where id = p_ad_id;
$$;

-- Index for the screens.group_id FK (added after the groups feature).
create index if not exists screens_group_id_idx on public.screens (group_id);

-- Scope the public read policies to the anon role only, so authenticated no
-- longer hits overlapping permissive policies (linter 0006). The tablet
-- (anon key) keeps reading active ads and settings exactly as before.
alter policy "read active ads" on public.ads to anon;
alter policy "read settings" on public.settings to anon;
