-- Lets a signed-in user erase their own account (GDPR). Cascades to profile, media rows, follows, reports.
-- Storage objects must be removed through the Storage API first (direct deletes are blocked).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from public.profiles where id = uid and role = 'admin') then
    raise exception 'admins cannot delete their own account here';
  end if;
  delete from auth.users where id = uid;
end $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
