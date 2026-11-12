-- Outcome of the external ID check (Sumsub). We store only the result, never ID images.
create table public.creator_verifications (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  applicant_id text,
  review_status text,
  review_answer text,            -- GREEN / RED
  reject_type text,              -- FINAL / RETRY
  updated_at timestamptz not null default now()
);
alter table public.creator_verifications enable row level security;
create policy cv_select on public.creator_verifications for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_admin());
revoke all on public.creator_verifications from anon, authenticated;
grant select on public.creator_verifications to authenticated;
-- Writes happen only server-side with the service-role key (webhook); no user write policies exist.

-- Creators can no longer self-submit for review; the ID-check webhook or an admin moves the status.
revoke execute on function public.request_verification() from authenticated;
