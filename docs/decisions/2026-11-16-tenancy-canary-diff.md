# Tenancy canary diff (#qtid6, Part 3 of #ykefa)

`scripts/check-tenancy-canary.mjs`, nightly via `.github/workflows/tenancy-canary.yml`. Report-only by default, `--strict` exits 1, exit 2 when it could not read (conventions copied from `check-tenancy-catalogue.mjs`).

**What it plants.** One transaction, always rolled back (the block ends in `raise exception`, the result travels in the message): a `shelters` row, one `residents` row copied from a real one with `shelter_id` = B, not adopt-ready and not text-approved, and one `attachments` row for it (`shelter_id` = B, unapproved). Chosen so that on a correct schema anon sees nothing new. No `roles` rows, so stream 7's keys are not touched. Verified after runs: no shelter, resident, policy or grant left behind in dev.

**How it enumerates.** Not from `check-public-views.mjs`'s hand lists: from the catalogue, every `public` table/view/matview on which `anon` holds any SELECT privilege (23 on dev), so a new view is covered the day it is granted. `check-public-views.mjs` told us what anon must refuse and is unchanged; it found no gap. Output per object = md5 of the rows as anon reads them, or `refused:<sqlstate>`. Two baseline reads find objects unstable on their own (none today).

**RPCs.** Anon-executable `public` functions with arguments: 2. Only `is_public_drive_file(text)` takes an id; it is called with B's planted file id and with a nonexistent one, and the answers must match. Covered all of them; the pattern (uuid/text arguments) extends on its own.

**Known leaks today (found by building it).** `public_resident_cards` (kennel card answers for every resident, by design in 0350) and `public_shelter_stats` (counts across shelters) both change when B is planted. They are Part 5's job, listed in `KNOWN_TODAY` so the run passes on today's schema and still goes red on any new one; a listed entry that stops changing is STALE and fails `--strict`, so Part 5 deletes it with its fix.

**Proof it fails.** The item's method (remove a restrictive policy) is not available: Part 5 has not landed. Substitute: `--prove-red leak-table` and `--prove-red leak-attachments` grant anon SELECT plus a permissive policy on `residents` / `attachments` inside the rolled-back transaction; the planted B row then changes what anon reads and the run exits 1 naming the table. Both red, clean run exit 0. **The item's own test is owed at Part 5 and should be run then.**

**Two limits** (also in the script header and its output): it cannot see service-role calls (not database roles; Part 7), and it cannot run on the pull-request path. It reads as the anon database role via `set local role`, not through HTTP or the Worker.

**Why nightly, not a PR check.** It writes (then rolls back), so it needs a write-capable Management API token, and this repository is public on purpose. The nightly uses a new secret `SUPABASE_CANARY_TOKEN`, dev project only. **Lutan's step: create that secret.** Until then the run exits 2 (NOT CHECKED), visibly.
