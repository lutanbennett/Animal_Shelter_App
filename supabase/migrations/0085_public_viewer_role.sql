-- A login that sees the website and nothing else: app_role 'public_viewer'
-- (asked 2026-09-25; docs/decisions.md, 2026-09-25, "Public viewer is a
-- role, not an archived row").
--
-- #123 put lannacare.org and test.lannacare.org behind sign-in until
-- go-live, so testing the public site as a visitor now needs an account —
-- and a staff account sees the public pages as staff. A public_viewer signs
-- in (password or Google), which gets it past the lock, and then has no app
-- access at all: every RLS policy and role guard names the roles it admits,
-- so a value none of them names matches none of them, exactly like an
-- archived login (0063). What it can read is what anon reads, through the
-- public_* views granted to anon and authenticated alike. The next file
-- closes the few places that let any signed-in session through.
--
-- Alone in its file: a value added by `alter type … add value` cannot be
-- used in the transaction that added it, and the runner applies each file
-- in one transaction. Re-runnable: `if not exists`.

alter type app_role add value if not exists 'public_viewer';
