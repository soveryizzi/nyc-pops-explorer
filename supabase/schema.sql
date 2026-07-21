-- NYC POPS Explorer — visitor submissions (photos + corrected hours).
--
-- Setup: create a Supabase project, then paste this whole file into the
-- SQL Editor (Dashboard → SQL Editor → New query) and run it once.
-- Moderation happens in the dashboard: Table Editor → submissions →
-- change a row's status to 'approved' (or 'rejected'). Only approved
-- rows are ever visible to the app.

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  space_id text not null,
  kind text not null check (kind in ('photo', 'hours')),
  hours_text text,
  photo_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  check (
    (kind = 'hours' and hours_text is not null)
    or (kind = 'photo' and photo_path is not null)
  )
);

create index submissions_space_status on public.submissions (space_id, status);

alter table public.submissions enable row level security;

-- Anyone may submit, but only as 'pending' — nobody can self-approve.
create policy "anon insert pending" on public.submissions
  for insert to anon
  with check (status = 'pending');

-- Only approved rows are publicly readable. Pending/rejected rows are
-- visible only in the dashboard (service role bypasses RLS).
create policy "anon read approved" on public.submissions
  for select to anon
  using (status = 'approved');

-- Storage bucket for visitor photos. Public bucket: file URLs are
-- unguessable (uuid paths) and the app only links approved ones, but
-- note a pending photo's URL is technically fetchable if leaked.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pops-photos', 'pops-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "anon upload pops photos" on storage.objects
  for insert to anon
  with check (bucket_id = 'pops-photos');

create policy "public read pops photos" on storage.objects
  for select to anon
  using (bucket_id = 'pops-photos');
