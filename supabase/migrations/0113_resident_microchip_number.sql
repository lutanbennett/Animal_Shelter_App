-- Microchip number on a resident (2026-09-29). Schema half only; the screens
-- that enter and search it are a separate PR.
--
--   residents.microchip_number       digits only, exactly 15 (ISO 11784/11785)
--   residents.microchip_implanted_on optional date
--
-- 15 digits only is a decision, not an oversight. Older 9- and 10-digit
-- chips were considered and ruled out (Lutan, 2026-09-29: the shelter has no
-- such chips). Loosening the check later is a one-line migration; a check
-- that was loose from the start could never be tightened over the rows it
-- had let in.
--
-- The application strips spaces and dashes before saving; the check makes
-- the column refuse anything that was not stripped, so a caller that
-- forgets fails loudly instead of storing "982 000-...".
--
-- Unique where set, as a partial index: a mistyped duplicate is caught and
-- the many null rows do not collide.
--
-- Locked on death without touching the 0026/0052 trigger: enforce_deceased_lock()
-- lists the columns that stay OPEN after death (bio, notes, profile photo)
-- and refuses a change to any other, so a new column is locked by default.
-- Asserted in the test plan rather than assumed.
--
-- Staff-only. Nothing here touches a public_* view, and none of them selects
-- residents.* (a view fixes its column list when it is created), so the
-- number is not reachable by anon. scripts/check-public-views.mjs asserts it.
--
-- Written to be safely re-runnable.

alter table residents
  add column if not exists microchip_number text,
  add column if not exists microchip_implanted_on date;

alter table residents drop constraint if exists residents_microchip_number_iso;
alter table residents
  add constraint residents_microchip_number_iso
  check (microchip_number is null or microchip_number ~ '^[0-9]{15}$');

create unique index if not exists residents_microchip_number_key
  on residents (microchip_number)
  where microchip_number is not null;

comment on column residents.microchip_number is
  'ISO 11784/11785 chip number: exactly 15 digits, no spaces or dashes; null = not chipped or unknown. Unique where set. Staff-only: never in a public_* view.';
comment on column residents.microchip_implanted_on is
  'Optional date the chip was implanted.';

notify pgrst, 'reload schema';
