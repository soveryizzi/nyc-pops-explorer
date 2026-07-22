-- Adds the 'feedback' submission kind (general app feedback, not tied
-- to a space) to an existing submissions table created before this
-- kind existed. Unlike 'photo'/'hours'/'plate', feedback rows have no
-- space_id — this migration drops the not-null constraint on that
-- column and adds the message/email columns feedback rows use.
--
-- Run once in the SQL Editor. Safe to re-run — drops and re-adds the
-- table's own check constraints by looking them up via pg_constraint
-- rather than assuming Postgres's auto-generated names, same as
-- 001_add_plate_kind.sql.

alter table public.submissions alter column space_id drop not null;
alter table public.submissions add column if not exists message text;
alter table public.submissions add column if not exists email text;

do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.submissions'::regclass and contype = 'c'
  loop
    execute format('alter table public.submissions drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.submissions
  add constraint submissions_kind_check check (kind in ('photo', 'hours', 'plate', 'feedback'));

alter table public.submissions
  add constraint submissions_status_check check (status in ('pending', 'approved', 'rejected'));

alter table public.submissions
  add constraint submissions_content_check check (
    (kind = 'hours' and space_id is not null and hours_text is not null)
    or (kind = 'photo' and space_id is not null and photo_path is not null)
    or (kind = 'plate' and space_id is not null and hours_text is not null and photo_path is not null)
    or (kind = 'feedback' and message is not null)
  );
