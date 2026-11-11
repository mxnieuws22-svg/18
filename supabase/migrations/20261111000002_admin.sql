-- Admin actions run through SECURITY DEFINER functions that verify is_admin().
-- Users never get column-level UPDATE on role/verification/suspension/moderation.

create table public.admin_audit (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_profile_id uuid,
  target_media_id uuid,
  detail text,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
create policy admin_audit_select on public.admin_audit for select to authenticated using (public.is_admin());
revoke all on public.admin_audit from anon, authenticated;
grant select on public.admin_audit to authenticated;

create or replace function public.admin_set_verification(pid uuid, new_status public.verification_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.profiles set verification_status = new_status where id = pid and role = 'creator';
  insert into public.admin_audit (admin_id, action, target_profile_id, detail)
  values ((select auth.uid()), 'set_verification', pid, new_status::text);
end $$;

create or replace function public.admin_set_suspended(pid uuid, suspended boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if pid = (select auth.uid()) then raise exception 'cannot suspend yourself'; end if;
  update public.profiles set is_suspended = suspended where id = pid and role <> 'admin';
  insert into public.admin_audit (admin_id, action, target_profile_id, detail)
  values ((select auth.uid()), 'set_suspended', pid, suspended::text);
end $$;

create or replace function public.admin_set_moderation(mid uuid, new_status public.moderation_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.media set moderation = new_status where id = mid;
  insert into public.admin_audit (admin_id, action, target_media_id, detail)
  values ((select auth.uid()), 'set_moderation', mid, new_status::text);
end $$;

revoke execute on function public.admin_set_verification(uuid, public.verification_status),
  public.admin_set_suspended(uuid, boolean),
  public.admin_set_moderation(uuid, public.moderation_status) from public, anon;
grant execute on function public.admin_set_verification(uuid, public.verification_status),
  public.admin_set_suspended(uuid, boolean),
  public.admin_set_moderation(uuid, public.moderation_status) to authenticated;
