-- =============================================================================
-- Fannova MVP schema: adults-only creators & fans. Privacy by default.
-- Every table has RLS enabled. Media is private unless the creator opts in AND
-- moderation has approved it. No payments / DMs in this version.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------- Types ------------------------------------------------------------
create type public.app_role as enum ('fan', 'creator', 'admin');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.media_kind as enum ('image', 'video');
create type public.media_visibility as enum ('private', 'followers', 'public');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');

-- ---------- Tables -----------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  role public.app_role not null default 'fan',
  verification_status public.verification_status not null default 'unverified',
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sensitive data lives apart from anything publicly readable.
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth date not null check (date_of_birth <= (current_date - interval '18 years')),
  age_confirmed_at timestamptz not null default now()
);

create table public.creator_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  headline text not null default '' check (char_length(headline) <= 120),
  about text not null default '' check (char_length(about) <= 2000),
  categories text[] not null default '{}' check (cardinality(categories) <= 6),
  updated_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,            -- '<creator_id>/<file>' in private bucket 'media'
  kind public.media_kind not null,
  title text not null default '' check (char_length(title) <= 120),
  visibility public.media_visibility not null default 'private',   -- private by default
  moderation public.moderation_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (split_part(storage_path, '/', 1) = creator_id::text)
);
create index media_creator_idx on public.media (creator_id, created_at desc);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id),
  check (follower_id <> creator_id)
);
create index follows_creator_idx on public.follows (creator_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_profile_id uuid references public.profiles (id) on delete cascade,
  target_media_id uuid references public.media (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  created_at timestamptz not null default now(),
  check (num_nonnulls(target_profile_id, target_media_id) = 1)
);

-- ---------- Helper functions (SECURITY DEFINER avoids RLS recursion) ---------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.role = 'admin' and not p.is_suspended);
$$;

-- Viewer is an authenticated, age-confirmed, non-suspended adult.
create or replace function public.is_adult_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1
                 from public.profiles p
                 join public.profile_private pp on pp.id = p.id
                 where p.id = (select auth.uid()) and not p.is_suspended);
$$;

create or replace function public.is_listed_creator(cid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = cid and p.role = 'creator'
                   and p.verification_status = 'verified' and not p.is_suspended);
$$;

create or replace function public.is_following(cid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.follows f
                 where f.follower_id = (select auth.uid()) and f.creator_id = cid);
$$;

create or replace function public.follower_count(cid uuid)
returns bigint language sql stable security definer set search_path = '' as $$
  select count(*) from public.follows where creator_id = cid and public.is_adult_member();
$$;

-- Can the current user see this media object? Used by table + storage policies.
create or replace function public.can_view_media(m public.media)
returns boolean language sql stable security definer set search_path = '' as $$
  select m.creator_id = (select auth.uid())
      or public.is_admin()
      or (public.is_adult_member()
          and m.moderation = 'approved'
          and public.is_listed_creator(m.creator_id)
          and (m.visibility = 'public'
               or (m.visibility = 'followers' and public.is_following(m.creator_id))));
$$;

-- ---------- Signup trigger: create profile, enforce 18+ server-side ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  dob date;
  uname text := lower(meta ->> 'username');
  chosen public.app_role := case when meta ->> 'role' = 'creator' then 'creator' else 'fan' end; -- never admin
begin
  begin
    dob := (meta ->> 'date_of_birth')::date;
  exception when others then
    raise exception 'A valid date of birth is required';
  end;
  if dob is null or dob > (current_date - interval '18 years') then
    raise exception 'You must be at least 18 years old';
  end if;
  if coalesce((meta ->> 'age_confirmed')::boolean, false) is not true then
    raise exception 'Age confirmation is required';
  end if;

  insert into public.profiles (id, username, display_name, role)
  values (new.id, uname, coalesce(nullif(meta ->> 'display_name', ''), uname), chosen);
  insert into public.profile_private (id, date_of_birth) values (new.id, dob);
  if chosen = 'creator' then
    insert into public.creator_profiles (profile_id) values (new.id);
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Triggers: updated_at ---------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger creator_profiles_touch before update on public.creator_profiles
  for each row execute function public.touch_updated_at();

-- ---------- User action: request creator verification ------------------------
create or replace function public.request_verification()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles
     set verification_status = 'pending'
   where id = (select auth.uid()) and role = 'creator'
     and verification_status in ('unverified', 'rejected');
end $$;

-- ---------- Row Level Security -----------------------------------------------
alter table public.profiles        enable row level security;
alter table public.profile_private enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.media           enable row level security;
alter table public.follows         enable row level security;
alter table public.reports         enable row level security;

-- profiles: own row; listed creators to adult members; admins everything.
create policy profiles_select on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or public.is_admin()
  or (public.is_adult_member() and public.is_listed_creator(id))
);
-- Updates limited to own row; column grants below stop role/verification edits.
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profile_private: only the owner (and admins for compliance review).
create policy private_select on public.profile_private for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy creator_profiles_select on public.creator_profiles for select to authenticated using (
  profile_id = (select auth.uid())
  or public.is_admin()
  or (public.is_adult_member() and public.is_listed_creator(profile_id))
);
create policy creator_profiles_update_own on public.creator_profiles for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- media
create policy media_select on public.media for select to authenticated
  using (public.can_view_media(media));
create policy media_insert on public.media for insert to authenticated with check (
  creator_id = (select auth.uid())
  and moderation = 'pending'
  and public.is_listed_creator(creator_id)
);
create policy media_update_own on public.media for update to authenticated
  using (creator_id = (select auth.uid())) with check (creator_id = (select auth.uid()));
create policy media_delete_own on public.media for delete to authenticated
  using (creator_id = (select auth.uid()) or public.is_admin());
create policy media_admin_update on public.media for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- follows
create policy follows_select_own on public.follows for select to authenticated
  using (follower_id = (select auth.uid()) or creator_id = (select auth.uid()));
create policy follows_insert on public.follows for insert to authenticated with check (
  follower_id = (select auth.uid())
  and public.is_adult_member()
  and public.is_listed_creator(creator_id)
);
create policy follows_delete_own on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));

-- reports: write-only for users, readable by admins.
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and public.is_adult_member());
create policy reports_admin_select on public.reports for select to authenticated
  using (public.is_admin());

-- ---------- Privilege hardening (defense in depth on top of RLS) -------------
revoke all on public.profiles, public.profile_private, public.creator_profiles,
              public.media, public.follows, public.reports from anon, authenticated;

grant select on public.profiles, public.profile_private, public.creator_profiles,
                public.media, public.follows to authenticated;
-- Users may only edit harmless columns; role / verification / suspension are admin-only
-- (admins edit via the SQL editor / service role).
grant update (display_name) on public.profiles to authenticated;
grant update (headline, about, categories) on public.creator_profiles to authenticated;
grant insert (creator_id, storage_path, kind, title, visibility) on public.media to authenticated;
grant update (title, visibility) on public.media to authenticated;
grant delete on public.media to authenticated;
grant insert, delete on public.follows to authenticated;
grant insert (reporter_id, target_profile_id, target_media_id, reason) on public.reports to authenticated;
grant select on public.reports to authenticated;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_adult_member(), public.is_listed_creator(uuid),
  public.is_following(uuid), public.follower_count(uuid), public.can_view_media(public.media),
  public.request_verification(), public.is_admin() to authenticated;

-- ---------- Storage: private bucket, path = '<creator_id>/<file>' ------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 52428800,
        array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do update set public = false;

create policy media_objects_select on storage.objects for select to authenticated using (
  bucket_id = 'media'
  and exists (select 1 from public.media m
              where m.storage_path = storage.objects.name and public.can_view_media(m))
);
create policy media_objects_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.is_listed_creator((select auth.uid()))
);
create policy media_objects_delete on storage.objects for delete to authenticated using (
  bucket_id = 'media'
  and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
);
