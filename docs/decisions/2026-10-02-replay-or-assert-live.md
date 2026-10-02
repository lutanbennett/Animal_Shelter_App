# 2026-10-02 — Replay a migration in a check script, or assert against the live schema

**Context.** The sweep that followed `check-shelter-today` (see
`2026-10-02-check-scripts-assert-live-not-replay.md`). Running all 36 scripts that
mention `supabase/migrations` against dev found **14 failing**, not the one or two
the backlog expected. Almost none were the same bug.

**The rule.**

1. **Replay only when the file creates objects nothing later has redefined**, and the
   script tests those objects. Check with the file's `create view/function/trigger/policy`
   names against every higher-numbered migration: if a later file redefines one, the
   replay puts the old body back inside the transaction and the script tests a schema
   that no longer exists. Then assert live instead.
2. **Never replay a file that defines or replaces a `public_*` view, or a function behind
   one**, whether or not anything later has touched it yet. Anon is the role every later
   tightening (0101, 0103, 0108, 0109, 0117, 0122, 0123) narrows, so this is where the
   next break comes from.
3. **A script that reads a table as anon reads the `public_*` view the site reads.** 0122
   closed `site_content` and `site_pages` to anon; asserting through the table was wrong
   from that day.
4. **Assertions about the state *before* a migration ("no row back-filled", "nothing
   tagged yet", "the before/after of the gate") hold only on the day it is applied.** Once
   the app writes real rows they fail. Either compare with a snapshot taken just before the
   replay (the replay added nothing), or drop the claim when the script no longer replays.
5. **A fixture that disables "the" trigger must disable all of them** (`disable trigger
   user`): a later migration may add a second one that does the same job.

**What was done.** Eleven scripts asserted live (rule 1/2): public-enclosures,
public-drive-file, preferred-channels, shelter-friends, medical-photos, app-access-gate,
adoption-updates, stock-on-hand, stocktake, and, as latent cases that still passed,
public-microchipped and stock-receipts. Four stayed on replay with a stale-data fix
(rule 4/5): resident-microchip, social-urls, standard-diet, vet-doctor-name; social-urls
also reads the view (rule 3). Twelve more replay objects nobody has redefined
and were left alone, each with a clean redefinition check; nine of the 36 never replayed anything (they only mention the migrations folder).

`adoption-updates` also carried a stale assertion rather than a stale fixture: since 0108
a vet reads only residents in their clinic's scope, so the vet in A7 reads nothing from a
throwaway resident. Updated to say so.

**What this costs.** A script that asserts live proves the live schema, not that the
migration file is re-runnable. Re-runnability is checked when the migration is written,
and `apply-migrations.mjs --dry-run` covers it; these harnesses are the regression
net, which is the job that went stale.
