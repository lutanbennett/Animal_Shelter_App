# 2026-11-09 — a production check for `0338`'s catch-up back-fill, because there was no instrument (`#k3mqp`)

**Outcome: one read-only production check, `suppliers-backfill`, plus two tests. No migration, no `src/`, no
application behaviour.**

Lutan asked on 2026-11-09 for the production catch-up to be run (*"Yes do that production catchups"*). Two things
stopped it the same day, and this file records the second one and what was done about it.

## Why a check rather than just running the apply

`#k3mqp` says in its own words to **count production first, expect about twenty contacts listed as suppliers, then
apply, then count again** — because `0338`'s catch-up is the only back-fill in the schema that **moves live rows**,
and it has never run against any: dev holds no Vendor contact, so on dev it moves nothing.

**That count had no instrument.** Measured 2026-11-09:

- No check in `scripts/lib/readonly-checks.mjs` read `contacts`, `suppliers`, `stock_receipts`, `stock_deliveries`
  or `shelter_friends`. The 29 checks there are about permissions, the calendar, translations and residents.
- An ad-hoc production read is refused in this environment; the allow-listed scripts are the only route.

So the before-and-after that makes the apply safe **could not be taken at all**. Writing the check first is the
cheaper half of a day's work, and unlike a one-off query it is still there for the next person.

## What it counts, and why these columns

Read out of `0338_suppliers_card.sql` rather than guessed. The back-fill does four things, so the check counts the
four things that must be true afterwards:

| Figure | What it is | After the apply |
|---|---|---|
| `vendor_contacts` | `contacts` with `type = 'Vendor'` | unchanged — the type stays in the enum so Contacts still renders history |
| `suppliers` / `suppliers_twinned` | `suppliers` rows, and those with a `source_contact_id` | one twin per Vendor contact |
| `vendor_without_supplier` | a Vendor contact with no `suppliers.source_contact_id` pointing at it | **0** |
| `receipts_unlinked` | `stock_receipts` with `supplier_contact_id` set and `supplier_id` null | **0** |
| `deliveries_unlinked` | `stock_deliveries`, same shape | **0** |
| `friends_on_vendor` | `shelter_friends` joined to a Vendor contact | **0** |

**The last four are `0338`'s own closing assertions.** The migration ends with two `raise exception` blocks that
refuse to commit if a Shelter Friend is still attached to a Vendor contact, or a Vendor contact still has no supplier
row. So the check is not inventing a standard: it reads the same invariants from outside, which is what makes it
usable *before* the apply as well as after.

## It guards a decision rather than reporting a number

**The same figures mean opposite things depending on whether `0338` has been applied**, so the check asks
`schema_migrations` and says which situation it is in:

- **`0338` not applied** — the orphan counts are **the size of the job**, and nothing is wrong. The check passes and
  says so in those words, plus: *"Count again after applying — a figure that does not fall to zero means it did not
  run."*
- **`0338` applied and the counts are zero** — complete. Passes.
- **`0338` applied and any count is above zero** — **fails**, naming how many rows still point at a Vendor contact.

Without the `schema_migrations` condition the check would have had to choose between failing on production today
(where the work legitimately has not happened) and never failing at all. A check that is red for a correct reason is
one people learn to skip — the fault `#av8rq` was filed about, one file over.

**Why `failed` is not simply "any orphan"**: a post-apply count of zero is also what a back-fill that never ran would
produce *if there were nothing to move*. That is why `vendor_contacts` and `suppliers_twinned` are printed and not
only the orphans: on production they should be about twenty and about twenty, and twenty-and-zero would mean the
insert did not happen even though no orphan remains to prove it.

## What was measured

- **Dev (`qxkmhwybjggxvsfxsxbd`), 2026-11-09:** `0 Vendor contact(s); 1 supplier row(s), 0 twinned to a contact`,
  all four orphan counts zero, `0338` applied. Consistent with the planner's earlier reading (0 Vendor contacts of 1
  contact row) and with `#k3mqp`'s note that dev has nothing to move.
- **Production: not read from this worktree.** A worktree cannot read production, and `check-production.mjs`
  defaults to production but needs `.env.deploy.production`, which a worktree does not get. **The production run is
  the planner's or the release manager's, from the main checkout.**

## The three states are pinned by tests, not by prose

`scripts/check-production.test.mjs` gains two tests: one driving all three verdicts, including that **each of the
four orphan counts alone is enough to fail** once `0338` is applied; and one asserting the SQL reads the six live
tables and `source_contact_id` rather than a literal, the same shape the file's existing tests use for
`activities-grantable`.

## What this does NOT do, deliberately

- **It does not apply anything.** `0338` cannot be applied alone in any case: `--status --env production` on
  2026-11-09 answered **339 applied, four pending** — `0338`, `0339`, `0340`, `0341` — and the runner applies every
  pending file. That is a decision for Lutan, not a consequence of this PR, and it is recorded on `#k3mqp`.
- **It does not tick `#k3mqp`.** The item needs the production apply and both counts; this is only the instrument.
- **It does not touch `#xkfsv`**, whose clean-up drops `supplier_contact_id` and so would remove the columns two of
  these figures read. **When that lands, two lines of this check go with it** — noted here so the next person finds
  the dependency rather than a broken check.
