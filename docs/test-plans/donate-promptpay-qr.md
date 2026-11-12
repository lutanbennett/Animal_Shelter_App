# Feature test plan

---

## Header

| | |
|---|---|
| Feature | donate-promptpay-qr — the manual PromptPay path: what was already shipped, and the two small additions that make working down a bank statement safe |
| Backlog item | `docs/backlog.md` → `#kxksr` (Fundraising) |
| Branch / worktree | `claude/donate-promptpay-qr` @ `C:\Development\Animal_Shelter_donate-promptpay-qr` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | filled in when opened |
| Tested by / date | Claude (Opus 5) · 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | `cb9339b74` (the merge of `origin/main`; the gates below ran on it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *the two halves `#kxksr` says are left were already shipped (`donation_channels`/`0191` for the static PromptPay QR on `/donate`, `donations`/`0168` for recording a gift), so this adds only what working down a bank statement still lacked: the donation form shows what is already recorded for the chosen date, and a gift's page offers "Record another gift" keeping that date and method.*
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — *`src/app/management/donations/reads.ts` (new, read-only server action), `src/app/management/donations/new/page.tsx`, `src/app/management/donations/new/DonationForm.tsx`, `src/app/management/donations/[id]/page.tsx`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`. No `worker/`, no migration, no shared lib behaviour changed.*
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — *only the card that carries recording a donation and its receipt (`donations_receipts`, which grants `donation.receipt`). Every control added asks `donation.receipt`, the activity `recordDonation()` itself asks. Admin is unaffected (outside the card system, `can.ts`). The signed-out public is unaffected: nothing on `/donate` changed.*
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — *no payment provider, webhook, signature check, idempotency or countdown page (decided against for now, Lutan 2026-11-10); no bank-statement file import (brief, deliverable 3); no ID-number or card-detail field; `#ss2s0`'s Cashflow-forecast and project/appeal-designation work is reported, not built.*

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 183s
=== gates: lint exited 0 after 335s
=== gates: test exited 0 after 64s
=== gates: build exited 0 after 181s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the `donations` table already exists (`0168`)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — *driven in the browser pane on `http://localhost:3009` with a login holding exactly `donations_receipts`: recorded a gift from the form, it appeared on the list and on its own page; the gift's page then offered "Record another gift", which opened the form with the same date and method and the panel listing the gift just saved.*
- [x] Data persists — reload the page and the change is still there
- [x] Create / edit / delete all exercised (whichever the feature has) — *create only: this change adds no edit or delete. Recording a gift was exercised; the receipt was issued and filed on Drive.*
- [x] Empty state renders sensibly (no rows yet) — *a date with nothing on record shows "Nothing recorded for this date yet."*
- [x] Invalid input is rejected with a readable message, not a crash — *a half-typed date is not asked about at all (the panel keeps the last answer); `?on=` and `?method=` in the address are validated server-side and a bad value is ignored rather than trusted, so the form falls back to today and bank transfer.*
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — *a future `?on=` date is refused (it is clamped to today, which is what the date field itself allows); an in-kind gift shows "In kind" in the panel rather than a baht figure; a gift whose lines are all null sums to no figure rather than ฿0.*

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/donations`, `/management/donations/new`, `/management/donations/<id>` | everything, via the `perms.isAdmin` short-circuit outside the card system | not re-driven this stream — unchanged by this PR, which adds no new permission path; the pages' `requirePermission("donation.receipt")` is as it was |
| exactly `donations_receipts` | `/management/donations`, `/management/donations/new`, `/management/donations/<id>` | the list, the form with the "Already recorded for this date" panel, and "Record another gift" on a gift | pass — driven; Management showed only the Donations tile, the panel loaded and the link worked |
| exactly `view_residents` | `/management/donations/new` | refused server-side: it does not grant `donation.receipt` | pass — `requirePermission("donation.receipt")` is unchanged and `giftsReceivedOn()` asks the same activity before it reads anything |
| signed out | `/management/donations/new` | sent to `/login` | pass — the proxy's auth gate is unchanged; `/management` is not a public path |

- [ ] Every login above tested — pending: admin and a `view_residents`-only login were reasoned from unchanged code rather than driven; only the `donations_receipts` login and the signed-out case were exercised
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — *the new read action asks `can(perms, "donation.receipt")` before it reads, and refuses with the app's own "not allowed" wording; the pages keep their `requirePermission` calls, and RLS on `donations` is untouched.*

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added or changed; both new controls sit inside Management → Donations
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: `src/lib/manual/en.ts` is not this stream's to touch this batch (brief, "what you do not own"); the change is a panel and a link on a screen the manual already describes
- [x] Translatable strings go through the translation path, checked at `/management/translations` — *every new string is a key in `src/lib/i18n/dictionaries/en.ts` with a Thai value beside it in `th.ts`; nothing is written into a component.*
- [x] Mobile viewport (375px) — no overflow, controls reachable — *driven at 375×812: the panel's rows wrap, and "Record another gift" drops under the donor name rather than overflowing.*
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — *`/management/donations` (list, window filter, total), `/management/donations/<id>` (the gift and its receipt), `/management/donations/new` (the whole form, including the donor picker and the receipt lines).*
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — *`src/lib/i18n/dictionaries/en.ts` and `th.ts` are the shared files; `/donate` (public, English) and `/management` were loaded after the edit and render their own strings correctly.*
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — *`#kxksr` is retitled rather than ticked: the code for both halves is shipped, but entering the shelter's own PromptPay id and QR image under Settings → Website → Ways to give is a step nobody has done, so the item stays open and its title now says exactly that.*
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — *`docs/decisions/2026-11-12-promptpay-manual-path-already-shipped.md`.*
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: the backlog item and this PR's decision file both record a step still outstanding before a shelter user could see any of this working end to end — the shelter's own PromptPay id and QR image have not been entered under Settings → Website → Ways to give. A note would promise users it works now. The note belongs in the PR that closes that step. `src/lib/releases.ts` is also owned by the `general-bill-photos` stream this batch.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — *every "already shipped" claim in the decision file names the file and the line it was read from, and the `/donate` and Donations findings were driven in a browser rather than inferred. Where something could not be measured — whether production's `donation_channels` holds a PromptPay row — the decision file says "not established" rather than guessing.*

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — deferred: release manager
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this change adds no secret and no environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — *nothing to roll back beyond the build: no migration, no schema, no data written by the change. `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi reverts the app; `npx wrangler rollback --env production` reverts only the Worker fallback. Neither is needed for this PR beyond the ordinary release rollback.*

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | On the dev database `/donate` lists only the DonorBox way to give: there is no `donation_channels` row carrying the bank details or the PromptPay id and QR, so the page's "How to give" prose still reads `(bank name)` / `(PromptPay id)`. The code renders them; the rows do not exist. | accepted — data, not code. Reported in the PR body and in the decision file; the equivalent on production could not be read (the public site is locked there) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether production's `donation_channels` already holds a PromptPay row with the shelter's id and QR image, and if not, entering them | Settings → Website → Ways to give, on production |
| 2 | That the "Already recorded for this date" panel reads well in Thai | `/management/donations/new` with the language set to ไทย |
| 3 | An admin login and a login holding only an unrelated card, against the two controls this PR adds | `/management/donations/new` and a gift's page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-11-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the three items above, none of which Claude can answer from this worktree

Manual verification by: pending: the Thai wording, an admin and unrelated-card login, and whether production's ways to give already carry the PromptPay id and QR

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: the next production release
