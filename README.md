# Veil — verified adult creators, private by default (MVP)

Next.js 15 (App Router) · Tailwind · Supabase Auth + PostgreSQL + Storage.
**Out of scope for now:** payments and private messaging.

## Setup
1. Create a Supabase project; copy `.env.example` to `.env.local` and fill in URL + anon key.
2. Run `supabase/migrations/20261111000000_init.sql` (SQL editor or `supabase db push`).
3. Auth → URL config: add `http://localhost:3000/auth/callback` as a redirect URL.
4. `npm install && npm run dev`
5. Make yourself admin / verify creators in the SQL editor (no admin UI yet):
   ```sql
   update profiles set role = 'admin' where username = 'you';
   update profiles set verification_status = 'verified' where username = 'creator1';
   update media set moderation = 'approved' where id = '...';
   -- of gebruik het beheerpaneel op /admin
   ```

## Security model
- **Age:** 18+ required at signup; enforced again in the `handle_new_user` trigger. DOB lives in `profile_private` (owner-only).
- **Roles/verification** can't be self-edited (column-level grants + RLS); `admin` can never be chosen at signup.
- **Discovery** requires login; only `verified`, non-suspended creators are readable, and only by adult members.
- **Media:** private storage bucket, signed URLs (5 min), `visibility` defaults to `private`, and a file is only viewable by others when
  `approved` by moderation **and** shared (`public` = all members, `followers`). Storage policies reuse the same `can_view_media` check.
- Real ID/age verification (e.g. a KYC provider) should replace manual `verification_status` review before launch, along with
  admin tooling, CSAM/abuse reporting workflows, and legal review (2257/DSA/age-assurance rules in your jurisdictions).
