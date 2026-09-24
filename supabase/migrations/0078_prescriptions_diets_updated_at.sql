-- updated_at on prescriptions and resident_diets (backlog, Architecture,
-- raised 2026-09-23 by the utc-date-audit stream).
--
-- The UTC "today" bug could be audited on `date` columns written at insert
-- time, by comparing them with created_at. end_date cannot be: it is set
-- days or weeks after the row exists ("End today", the deceased cascade),
-- and neither table recorded when a row last changed. So an end_date that
-- the seven-hour window got wrong is undetectable after the fact. From this
-- migration on, updated_at is that reference timestamp.
--
--   updated_at  timestamptz not null default now(). Adding it back-fills
--               every existing row with the moment this file runs, NOT the
--               moment the row last changed — there is no way to know that.
--               A value at or before the apply time therefore means "not
--               changed since the column was added", never "changed then".
--               The column comments say so for whoever runs the next audit.
--
-- The default alone would freeze updated_at at insert time, which is the
-- very blindness this is meant to fix, so a BEFORE trigger sets it:
--
--   * on INSERT, always now() — a caller cannot backdate it;
--   * on UPDATE, now() when any other column actually changed, and the old
--     value kept otherwise, so a no-op `update … set x = x` does not pass
--     for an edit. A caller cannot set it by hand either way.
--
-- No existing touch function to reuse: maintenance and project_folders set
-- updated_at inside their own validation triggers. This one is generic
-- (touch_updated_at) so the next table that needs it can share it.
--
-- It sits alongside the *_deceased_lock triggers without interacting: they
-- fire first (alphabetical), and a write they refuse never reaches this.
-- Cascade and undo writes made under the lock bypass are real edits to
-- end_date and move updated_at, as they should.
--
-- Additive; no code reads the column. Existing grants and RLS policies are
-- table-level and cover it. Re-runnable: every statement is guarded.

alter table prescriptions add column if not exists updated_at timestamptz not null default now();
alter table resident_diets add column if not exists updated_at timestamptz not null default now();

comment on column prescriptions.updated_at is
  'When the row last changed, set by trigger (touch_updated_at). Added 2026-09-24 by 0078: rows that existed then were back-filled with the apply time, so a value at or before it means "unchanged since", not a real edit time.';
comment on column resident_diets.updated_at is
  'When the row last changed, set by trigger (touch_updated_at). Added 2026-09-24 by 0078: rows that existed then were back-filled with the apply time, so a value at or before it means "unchanged since", not a real edit time.';

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
    and (to_jsonb(new) - 'updated_at') = (to_jsonb(old) - 'updated_at')
  then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

comment on function touch_updated_at() is
  'BEFORE INSERT OR UPDATE row trigger: sets updated_at to now() on insert and on any real change, keeps it on a no-op update. Callers cannot set it.';

drop trigger if exists prescriptions_touch_updated_at on prescriptions;
create trigger prescriptions_touch_updated_at
  before insert or update on prescriptions
  for each row execute function touch_updated_at();

drop trigger if exists resident_diets_touch_updated_at on resident_diets;
create trigger resident_diets_touch_updated_at
  before insert or update on resident_diets
  for each row execute function touch_updated_at();

notify pgrst, 'reload schema';
