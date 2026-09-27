# Feature test plan

## Header

| | |
|---|---|
| Feature | Pet of the week card shows the resident's hook line |
| Backlog item | `docs/backlog.md` → **Pet of the week: use the resident's hook line.** |
| Branch / worktree | `claude/pet-of-week-hook` @ `C:\Development\Animal_Shelter_pet-of-week-hook` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | no |
| Tested at SHA | 2449d7b |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the homepage's Pet of the week card shows the resident's hook line through `localizedField(…, "hook_line")`, falling back to the bio's first paragraph cut at 160 characters when the hook line is blank
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/page.tsx` (the Pet of the week select, type and hook only), `src/lib/releases.ts`, `docs/backlog.md`, this plan
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — signed-out public (and anyone else viewing `/`); no signed-in page changed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — nothing else on the homepage changed (the Shelter Friends and impact bands are untouched); the hook line's own length (capped at 120 on Edit resident, `HOOK_LINE_MAX`) is not cut on the card, since it is already shorter than the 160-character bio lead

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 381s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — run 36267259065 on `6e5d269`: `check`, `migration-numbers` and `test-plan` all passed. Before merging, `sync` brought in #164 (migrations 0099–0100, a check script, docs; nothing under `src/`), and CI ran again on the merge

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; `hook_line` shipped in 0094
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; the card was checked against dev's real featured resident in section 4
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; 0094 is already in production with release 0.6.1

## 4. Functional checks

Checked on `http://localhost:3009/` against dev's featured resident, Panda (`853951b2-…`), which has a hook line and an approved Thai translation of it. Card text read from the page after each reload:

| Case | Card shows |
|---|---|
| English, hook line filled | "A cuddly corgi who will follow you from room to room." |
| English, hook line blank | "Panda is the ultimate people pleaser, … Recently she lost her bonded partner Chico…" (the bio lead, cut) |
| Thai, hook line blank | the Thai bio lead, cut ("แพนด้าเป็นสุนัขที่ชอบเอาใจคนที่สุด … คู่หูที่ผูกพันกันมาก…") |
| Thai, hook line filled | "คอร์กี้ขี้อ้อนที่จะเดินตามคุณไปทุกห้อง" (the approved Thai hook line) |

- [x] Happy path works end to end — English and Thai hook lines shown on the card
- [ ] Data persists — reload the page and the change is still there — n/a: the card only reads; every case above was read after a fresh page load
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the card has no create, edit or delete; the hook line was blanked and restored directly on dev to produce both cases
- [x] Empty state renders sensibly (no rows yet) — a blank hook line falls back to the bio lead, in both languages
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the card takes no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — missing hook line checked in both languages; the longest possible hook line is 120 characters (`HOOK_LINE_MAX`), under the bio lead's 160, so it is never longer than what the card showed before

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no change to access | unchanged | n/a |
| management | n/a: no change to access | unchanged | n/a |
| staff | n/a: no change to access | unchanged | n/a |
| vet | n/a: no change to access | unchanged | n/a |
| volunteer | n/a: no change to access | unchanged | n/a |
| signed out | `/` | card shows the hook line, else the bio lead | as expected (section 4 table, all signed out) |

- [ ] Every role above tested — n/a: no route, guard or policy changed; `hook_line` is already a column of the anon-readable `public_resident_profiles` view, which the resident page reads
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access surface changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual does not describe the homepage card's text
- [x] Translatable strings go through the translation path, checked at `/management/translations` — the hook line is read through `localizedField` with `"hook_line"`, and the Thai homepage showed the approved Thai translation. Not checked at `/management/translations`: no new translatable field was added
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change, and the text shown is never longer than before (120 ≤ 160 characters)
- [x] Browser console clean — no errors or React warnings — the only error logged was a `getComputedStyle` error from an anonymous script injected by the preview tooling, not from the app
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not captured separately; every load of `/` rendered the card normally and the dev server logged `200`s

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/` in English and Thai: hero, impact band, Shelter Friends band, How you can help and the Pet of the week card all rendered
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched; `src/lib/releases.ts` gained one string in `unreleased`
- [x] Nothing merged from `main` during `sync` was broken by this branch — the first sync was "Already up to date."; the second brought in #164, which touches no file this branch does, and CI's `check` covers the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: nothing non-obvious; the card follows the resident page's `hook || bio lead` rule exactly
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — a visitor sees a different line on the card as soon as the featured animal has a hook line, and staff writing hook lines should know the homepage uses them
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the fallback and the Thai translation were each observed on the page (section 4), not assumed from the code

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic changed
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold, band or cutoff changed; the 160-character cut is unchanged
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: apart from the gates block, pasted as printed, the evidence is card text quoted from the page
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager, for `/` only

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; the column it reads (0094) is already in production
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` restores the bio-lead card; there is no schema or data change to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

Note on test data: blanking Panda's hook line on dev reset its approved Thai translation to `pending` with its text cleared, observed on the `translations` row afterwards. It was restored by hand (`status approved`, the same Thai text, `reviewed_source_text` = the English hook line, `reviewed_at` = the time of the restore), and the Thai card showed it again. `reviewed_by` is empty on the row now; what it held before was not recorded. Not a defect in this change: a source edit invalidating its translation is the translation queue's intended behaviour.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The card reads well with a real hook line — the line sits naturally where the bio lead used to, in English and Thai | `http://localhost:3009/` (or `test.lannacare.org` after deploy), Pet of the week card; switch language in the header |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 awaits Lutan

Manual verification by: pending: item 1, how the hook line reads on the card

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over at release time

Result: pass
