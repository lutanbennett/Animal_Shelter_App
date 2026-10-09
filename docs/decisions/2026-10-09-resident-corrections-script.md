# 2026-10-09 — Duplicate residents are removed with `scripts/correct-resident.mjs`, and the loader warns about near-duplicates

**Context.** Bulk uploads (Brown, Blue, Left Zone) brought duplicates that the
loader's exact-name check missed: Left Zone's "Noon (Daeng)" against the Blue
upload's "Noon". Removing one depended on which chat was asked. On 2026-10-05
one chat deleted R-0240 and another refused the same request for R-0220. Since
then a single chat ("Delete duplicate resident R-0240") has done Lutan's
corrections on the live database with a fresh throwaway script each time,
keeping its copy of the deleted rows in a scratch folder that disappears with
the session.

**Decision.**

1. **The loader warns, never refuses, about near-duplicates.**
   `load-residents.mjs`'s run lists every row that looks like an existing
   resident, archived and Lifecycle ones included, with the existing code,
   where it is now and when it was created. "Looks like" is
   `scripts/lib/near-names.mjs`: the same name once a bracket tag is dropped,
   one name being the other's bracket tag, the same Thai name, or a close
   spelling (one letter apart for names of 4+ letters, two for 8+). Names under
   4 letters are not spelling-matched: "Max" and "Mia" would fill the list with
   noise people learn to skip. The exact-name refusal is unchanged.

2. **One script removes a duplicate: `scripts/correct-resident.mjs`.** It is
   meant to be the same every time, so it refuses rather than guesses:
   - It removes only a resident with no real history: its Intake (plus a death
     recorded and then withdrawn), diets, the intake weight and its machine
     translations. Vet visits, blood tests, prescriptions, immunizations,
     procedures, adoption updates, photos, a donation earmarked for it, or
     being the website's featured resident each refuse. The last two matter
     because those links are `ON DELETE SET NULL`: a delete would succeed and
     quietly blank them.
   - A resident still recorded as deceased is refused, with the app step that
     fixes it ("Withdraw this death"). The script never turns the lock off.
   - Drive is refused unless `--drive-trashed`. The script prints the folder
     and file IDs and never touches Drive itself; trashing them is the
     operator's step, as the R-0317 chat did.
   - Names must look alike (the same rules as the loader) unless
     `--force-names`.
   - Every row it deletes goes into a JSON receipt on the Desktop **before**
     the delete, and the delete is one `begin…commit` that re-checks for
     history, asserts each row count, and checks that the kept resident
     changed in nothing but the copied details.

3. **`--copy` is the only merge, and `--merge-into` is refused.** `--copy
   thai_name,colour` carries descriptive details onto the original, only into
   blanks; a clash is refused with "change it in the app". History cannot be
   merged cleanly: `placement_history.resident_id` cannot change (`0001`), so
   moving a placement means deleting and re-creating it, which rewrites the
   record the guard protects.

4. **A chat runs it on the live database; Lutan does not.** The brief said dev
   only, with Lutan running any apply by hand. Lutan changed that on
   2026-10-09: he is still cleaning live data, a chat does his deletes, and he
   wants no manual step. So `--env production` works. Two safeguards:
   it checks the Supabase URL against the live project's ref as well as
   `app-env.ts` (which calls any unknown project "production"), and fails
   closed after the cutover until the ref is updated; and `--apply` on live
   needs `--confirm <the code being removed>`, so a test command with
   `--env production` added cannot delete live data by accident.

**The R-0240 question** (how a delete got past `0119`): answered on 2026-10-07
in the backlog and confirmed here. `0001` and `0119` guard UPDATE only; DELETE
is guarded by nothing but the deceased lock, and the Management API runs as the
owner, so row security does not apply. The script relies on that openly. That
Admin can also delete placement rows through the API (`0153`) is filed on the
backlog as its own item, not fixed here.

**What was not done.** No live run from this stream: a worktree session cannot
read production. The first real request will be the first live run, from the
main checkout, which is where Lutan's corrections chat already works. A chat
needs an allow rule (`Bash(node scripts/correct-resident.mjs *)`) in the main
checkout's settings for the classifier to let it run; that is Lutan's to add.
