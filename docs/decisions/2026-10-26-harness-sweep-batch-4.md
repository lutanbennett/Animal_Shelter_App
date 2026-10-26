# Harness sweep, batch 4 (2026-10-26)

Backlog item "Sweep the remaining red database harnesses in bounded batches". Batch 4 is seven of the permissions-first ten. **Scripts and docs
only: no migration, nothing under `src/`.** All seven were red against dev; all seven now pass. `check-who-does-what`, `check-menu-coverage`
and `check-resident-sections` were left out on purpose (they test card wiring that `card-review-1-app` is changing).

The rule that governed every verdict is batch 2's: a harness that tests a removed mechanism is cut down to what still exists, never edited to
assert that a role column or role name is consulted. A second rule from batch 3 applied again: nothing pins what management, the volunteer,
the doctor or the 2IC read, because their live cards are edited one at a time.

## Verdicts

| Harness | Verdict | Checks held | What it was, and what happened |
|---|---|---|---|
| `check-preferred-channels` | **stale, fixed** | 6 | Assertion A pinned `site_content.preferred_channels` to `{line}`; the shelter has since edited it. It now asserts the live row holds only known channels. The rest was untouched. |
| `check-security-schema-fold` | **stale, fixed** | 9 tables audited, plus actor and default checks | The `stock_receipts` audit probe edited `note`; since `0235` only `cost` may change. It edits `cost`. Its F2 section prints each role's row counts as evidence and asserts nothing on them. |
| `check-weight-one-per-day` | **stale, fixed** | 6 and one skipped by design | `record_intake` needs the register-a-resident permission (`0248`); the seed now runs as the Admin login, as the batch-2 seeders do. |
| `check-weigh-first` | **stale, fixed** | 61 | The `clinic_visits` floor probe expected management to read it and the doctor not. Management holds no such card now and the doctor reads its own clinic (`0253`). Both are no longer pinned; admin reads, and the Head of Medical, the volunteer and a roleless login still read nothing. |
| `check-social-shares-schema` | **stale, fixed** | all held | Counted every share on dev (10) against the two it made. Counts are now scoped to the rows it inserted. |
| `check-recurring-jobs` | **stale, fixed** | whole suite held | Two places pinned the doctor's live cards (which refusal message, and reading all four tables). The refusal is still asserted; the doctor is no longer in the read list. |
| `check-director-answers-schema` | **cut down** | 41 | Tested the 2IC's `name_phone` contacts scope and the `volunteer_contacts` view, both removed by `0259`/`0264`. Those are cut; a new check asserts the two views stay dropped. Management, volunteer, doctor and the 2IC are no longer pinned; admin, a roleless login and the custom roles it builds still are. |

**No harness was deleted.** One genuine question was found and filed, not fixed: in `docs/card-access-faults.md`, under "Added 2026-10-26
by `claude/harness-sweep-batch-4`", two rows. `contacts_select_perm` asks `contacts.browse` alone (`0264`), so `contacts.directory` Edit no
longer reads the table; and `shelter_friends_select_perm` asks `friends.view` alone, so `friends.manage` does not read. The harness now
asserts what the policies do today.

## The CRLF fault in the blocking check

`check-hard-coded-security.mjs` stripped SQL comments with `/--.*$/` and no `m` flag. On a CRLF checkout `.` does not cross the `\r`, so no
comment was ever stripped and `0264`'s header (naming the five columns it drops) printed five false failures. The strip is now `/--[^\r\n]*/`,
and a guard at the top of the script fails if a CRLF line's comment survives it. The registry is untouched. The same idiom was in
`check-new-policy-role-names.mjs`, fixed the same way. `readonly-checks.mjs` uses the `gm` flags, where `$` also matches before `\r`, and
`check-migration-grants.mjs` and `check-rpc-inputs.test.mjs` already use `[^\n]*`, so neither needed a change.

`node scripts/check-hard-coded-security.mjs` now prints `no coded security outside the Admin bypass` on this Windows checkout.

## What remains

The item stays open: the three card-wiring harnesses and the rest of the red list.
