# The three record_intake seeders run as a disposable Admin login

**2026-10-28**, `claude/instruments-card-shaped-rest`. Follows `2026-10-28-instruments-ask-a-card-question.md`.

## What changed

`record_intake` asks `has_permission('resident.register')` (0248). Three harnesses seeded a resident through it and
each got its login a different way:

- `check-medical-archive-roles.mjs` ran it as a **Management** login, whose answer moves whenever someone edits a card
  on Settings > Who does what. A card edit could break the seed and look like a fault in the thing under test.
- `check-medical-soft-delete.mjs` and `check-diets-sheet.mjs` **borrowed the first real Admin** on dev. With no Admin
  on a database the lookup returns null and the seed is refused.

All three now insert a disposable `auth.users` row holding the Admin role inside the harness's own rolled-back
transaction. Admin answers true without reading a card (`CLAUDE.md`), so the seed no longer depends on any card
assignment or on which real logins exist. The assertions under test are untouched.

## Found, not fixed

`check-medical-archive-roles.mjs` fails at `HARNESS-FAIL A: management could not archive a weight`. It failed
identically before this change (run from `HEAD`), so it is the live dev card state, not the seeder: the Management
login in that harness holds no card that archives a weight. Whether that is intended is Lutan's card-building, not
this stream's. The other two harnesses pass (`HARNESS-OK`, `GREEN`).
