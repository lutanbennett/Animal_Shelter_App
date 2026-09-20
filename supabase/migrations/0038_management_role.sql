-- Management role, part 1 of 2: the enum value.
--
-- Section 6 of the requirements doc listed four roles; a fifth,
-- 'management', sits between admin and staff: everything staff can do plus
-- the Management section of the app (the reporting dashboard and contact
-- management), but not the system configuration under Admin (security,
-- website, zones, enclosures, vets, immunization types). See
-- docs/decisions.md (2026-09-21).
--
-- Only the enum value lives in this file because Postgres refuses to *use*
-- a new enum value in the transaction that added it ("unsafe use of new
-- value"), and apply-migrations.mjs runs each file as one transaction. The
-- policies and function changes that reference 'management'::app_role are
-- in 0039, which therefore needs this file committed first — `--dry-run`
-- of 0039 fails on its own for that reason; apply this one, then dry-run
-- the next.

alter type app_role add value if not exists 'management';
