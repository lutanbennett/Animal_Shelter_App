# 2026-10-29 — the twelve `?` harness rows, and the cards.ts photo grants

Stream `claude/harness-q-rows`. No migration. Every row was re-run in this worktree with a dev server up and a 60–100 s timeout.
Batch-7 triage marked these twelve `?` ("classified from the first error line only").

## cards.ts / card_grants (backlog, Security)

`0279` intended the grant, so the fix is the source, not a migration. `view_medical` and `medical_records` now carry
`photos.resident_medical` at read, `medical_records` also carries `photos.medical_add` (`cards.ts`), and `add_medical_photos` carries
`photos.resident_medical` at read (`jobs.ts`, where that card is defined; it already had `photos.medical_add`).
`check-card-grants` is green and `check-cards-count` still passes.

## The twelve

| row | verdict | what was done |
|---|---|---|
| `map-markers` | green | exit 127 is the Windows teardown assertion after "84 markers checked, 0 failures". Retired as a fault; the old "exits 3221226505" crash is gone. |
| `hidden-public-pages-schema` | repaired, by card | It picked "the first Management login" as the editor. Now a login holding exactly the Website card writes it, and one holding only View residents cannot. Was not an app fault. |
| `card-taps` | restated, by card | Principals are logins holding exactly: no card, Enclosures (who-and-where), View residents. "Doctor outside the treating clinic" left the list, because that row rule is `roles.scope_residents` (`may_open_resident_record`, 0249), a role column and not a card; a harness never asserts a role column is consulted. |
| `daily-count` | **live-data finding, check left as it is** | On 2026-07-27 one resident (`853951b2…`) has a Foster placement whose enclosure is `Unassigned`, not `Fostered`, so the series (by placement type) says away while the straight count (by enclosure) says present. The check did its job. Not fixed here. |
| `public-stories-schema` | repaired | A1 asserted nothing was shared, true only the day 0214 landed; now anon sees no more than is ticked. Part B restated: Assistant card alone vs Admin. No card grants `assistant.record` any more (0268). |
| `photo-approval` | repaired | Step 0 ("nothing is waiting after the back-fill") is stale live data; retired with its reason in the file. |
| `two-step-session` | retired claim | "every Google session on dev is aal1" is a fact about who signed in to dev, not about the app. The table still prints. |
| `appeals-schema`, `community-dogs-schema` | repaired, shared cause confirmed | Both replayed an applied migration over a later schema (`42P16`). Replay dropped; both now run against the live schema, with logins defined by cards (View residents / Outreach notes). `appeal.run` is asserted as "granted by the Run appeals card alone". |
| `offsite-chip`, `residents-status-chips` | repaired | `ENOENT .port` was where it was run. Underneath: the list now links `/residents/<id>?list=…` under a filter, and status-chips still used the retired `staff` role (now `giveCards(["view_residents"])`). |
| `can-see-drive-file` | **finding** | Exceeded 100 s, not run to completion. Not diagnosed. |

## Found, not fixed

- SUPERSEDED 2026-10-29: the next bullet is WRONG, kept so the reasoning still reads. `0264` (2026-10-25) dropped `may_open_resident_record()` and the column
  `roles.scope_residents` (its sections 5 and 6), and dropped the clinic-scoped `doctor_read_residents` policy; the registry already records them as no longer
  existing, and `check-no-role-column-security.mjs` is clean on test and production. The stream read `0249`, superseded twice. What governs the resident row now is
  `residents_select_perm`, which asks only `has_permission('resident.record','read')` (0264): a card, with no clinic narrowing. Do NOT add the column to the registry.
  The removed card-taps principal is correctly absent for that reason (the behaviour is gone), now written in the check.
- ~~`roles.scope_residents` still decides which resident rows a login reads (`may_open_resident_record`, 0249). It is a role column granting
  access; it belongs in `docs/hard-coded-security-registry.json` if it is not already there.~~
- `check-photo-approval` and `check-daily-count` still lean on nothing role-named I changed; `check-daily-count` needs the data fix above.
- `scripts/lib/` untouched.
