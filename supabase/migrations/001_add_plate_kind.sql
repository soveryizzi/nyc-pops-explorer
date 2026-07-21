-- Adds the 'plate' submission kind (an OCR'd hours-plate photo, which
-- carries both hours_text and photo_path in one row) to an existing
-- submissions table created before this kind existed.
--
-- Run once in the SQL Editor. Safe to re-run — drops and re-adds the
-- table's own check constraints by looking them up via pg_constraint
-- rather than assuming Postgres's auto-generated names, so this
-- doesn't depend on exactly how the original table was created.

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
  add constraint submissions_kind_check check (kind in ('photo', 'hours', 'plate'));

alter table public.submissions
  add constraint submissions_status_check check (status in ('pending', 'approved', 'rejected'));

alter table public.submissions
  add constraint submissions_content_check check (
    (kind = 'hours' and hours_text is not null)
    or (kind = 'photo' and photo_path is not null)
    or (kind = 'plate' and hours_text is not null and photo_path is not null)
  );
