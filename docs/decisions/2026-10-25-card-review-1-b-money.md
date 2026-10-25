# Card review 1, second half, money and content (2026-10-25)

Lutan's framing, 2026-10-25: each card on its own, no regard to roles: *enough?* and *too much?* This is the money, content and website half; `card-review-1-b-ops` has the other seven. Read like `docs/decisions/2026-10-25-card-review-1-a.md`, **plus a driven pass**, which that half did not have.

**Method.** `node scripts/check-card-grants.mjs` was green at the start (68 grants, 3 includes). `cards.ts` and `jobs.ts` read. For each card a login holding **only that card** (`scripts/dev-signin.mjs --cards`) was signed in and driven in the browser, and a read-only harness counted, as that login through RLS, every table the card's pages read against the true row count. Read-back before concluding anything: each login held exactly its one card and the expected cells (`dashboard`: `reports.dashboard`, `reports.cashflow` read; `run_appeals`: `appeal.run`, `donation.receipt`; the other five one cell each). Dev carried `0261` (from `role-extras-drop`) while `main` did not; the stock sign-in script failed on it (`set_role_cards` lost `p_bundle`), so an untracked local copy without that argument was used for sign-in and deleted. Sessions are aal1.

| card | advertises (opens) | enough? | too much? | evidence | finding |
|---|---|---|---|---|---|
| `dashboard` | the dashboard, plus cashflow read only (`/management/dashboard`) | **no**: every figure reads 0; the cashflow pages refuse it | no | reads 0 of 101 residents, 195 placements, 111 visits, 57 blood tests, 12 procedures, 20 vaccines, 13 maintenance; `requirePermission("reports.cashflow")` defaults to edit | root row (no reads) and a separate level-mismatch row |
| `donations_receipts` | issue a donation receipt (`/management/donations`) | yes for a typed-in donor: **driven**, receipt LCA0009008 | no | donor list 0 of 9 contacts, resident and appeal pickers empty | root row |
| `run_appeals` | run an appeal for a sick resident (`/management/appeals`) | **no**: "No residents match", an appeal cannot be started | no (bundles `donation.receipt` on purpose) | driven; 0 of 101 residents, 0 of 374 attachments | root row |
| `bills` | add and see a maintenance job's bills (`/bills`) | partly: opens, but cannot say what a bill is for | no | driven; 0 of 13 maintenance jobs, 0 of 11 stock receipts, 0 of 111 visits | root row |
| `website` | the public website's content (`/admin/website`) | yes for what was driven: saved a setting, pickers load | no | driven; Projects tab empty (0 of 18 folders); photo upload and publish not driven | root row (projects) |
| `outreach_notes` | outings (`/outreach`) | **yes**: recorded a visit, it listed | no | driven | none |
| `meme_library` | memes and shares (`/memes`) | partly: share recorded; residents cannot be tagged; add-a-meme needs an image upload (not driven) | no | driven; 0 of 101 residents; shares show 3 of 6, cause not established | root row |

## The finding that carries most weight

**One root cause, one decision.** None of the seven bundles grants `resident.record`, and since `0259` every resident read needs it, so "0 of 101" is the system working as written. The fault is that the **advertised jobs need a resident picker** (and contacts, attachments, per-table reads) that no card gives. `view_residents` is the deliberate floor card and `residents` gets its resident read only by `includes: ["view_residents"]`, so for `run_appeals`, `website`, `meme_library` and `donations_receipts` the likely answer is that same one-line inclusion. `dashboard` and `bills` need reads of tables no card carries. Recorded as one row, applied nowhere.

**Separate.** `dashboard`'s cashflow half is a read/edit mismatch: the card grants read, both cashflow pages ask edit.

**Over-grant:** none found in this half; every bundle is one or two activities its label names.

## Not done

Photo and file uploads (website, outreach, memes, bills, appeal photos), adding a meme, publishing a project, saving a bill against a job, why `meme_library` sees 3 of 6 shares, and the Residents link in the menu of every card-only login.
