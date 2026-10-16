# Feature test plan

## Header

| | |
|---|---|
| Feature | App half of two features: "since <year>" on the home page's baseline figures, and Thai for a resident's breed and colour |
| Backlog item | `docs/backlog.md` → **Add "since <year>" to the baseline figures** (ticked here) and **Thai for a resident's breed and colour** (partly done, see Defects) |
| Branch / worktree | `claude/labels-and-year-app` @ `C:\Development\Animal_Shelter_labels-and-year-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: number is added once the PR exists |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | no — reads `0204` and `0205` (#648), already on `main` and applied to dev |
| Tested at SHA | `383d51bb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: Settings gets an optional "Counting since (year)" box and the home page prints "<figure> since <year>" in both languages when one is set; the resident edit page gets Thai breed and colour boxes and every screen shows Thai if set, else English
- [x] Files/areas touched listed: `src/lib/site/impact.ts`, `src/app/page.tsx`, `src/app/admin/website/*`; `src/lib/residents/labels.ts` (new), `public.ts`, `card.ts`, `adoption-profile.ts`; `src/components/AdoptionProfileFields.tsx`; resident page, hub and edit form and action; `/adopt`, `/adopt/[id]`, `/r/[code]`, the home page's featured resident; both dictionaries, the manual, releases
- [x] Roles affected identified: admin/management who can edit website content (the year); anyone who edits a resident (the Thai boxes); signed-out public sees the results
- [x] Out of scope written down: no migration; the Translations page does not list breed and colour yet (needs a schema PR, filed on the backlog branch); `/e/[id]` resident cards stay English; intake does not capture Thai (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in, already up to date
- [x] `node scripts/gates.mjs` ended with every exit code 0. Exit codes read from the log file:

```
=== gates: typecheck exited 0 after 52s
=== gates: lint exited 0 after 196s
=== gates: test exited 0 after 5s
=== gates: build exited 0 after 188s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; 0204 and 0205 were applied by #648
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration; `check-public-views.mjs` exited 0 against dev, so the views still serve what the code selects
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; 0204 and 0205 must be live in production before this ships (the release that carries #648)

## 4. Functional checks

- [x] Happy path works end to end: the label function was run against the real exported code with a year (English "Animals rehomed since 2019", Thai "สัตว์ที่ได้บ้านใหม่ ตั้งแต่ปี 2019") and `residentText` with a Thai value
- [ ] Data persists — reload the page and the change is still there — n/a: saving needs a signed-in admin session; listed under manual verification
- [ ] Create / edit / delete all exercised — n/a: the edit paths need a signed-in session; listed under manual verification
- [x] Empty state renders sensibly: with no year set, the home page on dev loads (200) and reads "Animals rehomed" with no "since"; the function also returns the plain label for a null year in both languages
- [x] Invalid input is rejected with a readable message: code reading only — the action accepts exactly four digits from 1990 to 2100 and answers `invalidYear` otherwise; the database check is the second line
- [x] Boundary cases checked: Thai breed that is blank, spaces only, null and English reader all fall back to English (run against `residentText`); no Thai and no English gives nothing, not "null"

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Website year box; resident edit page | can edit | not driven: no signed-in session this run |
| management | same as admin where permitted | unchanged | not driven |
| staff | n/a | unchanged | not driven |
| doctor | n/a | unchanged | not driven |
| volunteer | resident page | sees the breed/colour per language | not driven |
| signed out | `/`, `/adopt` | 200, English label with no year | `/` 200, `/adopt` 200 |

- [ ] Every role above tested — n/a: only the signed-out pages were driven; no permission rule was changed, the edit action keeps its existing guard
- [ ] A role that should not have access is blocked server-side — n/a: no permission was added or changed; `updateImpactBaseline` and the resident edit action keep their existing checks

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added
- [x] Manual updated (`src/lib/manual/en.ts`): the impact figures paragraph now describes the year box; not read in the browser at `/manual`
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: breed and colour are not yet registered there (needs a migration; filed as a follow-up). The dictionary strings are in both languages
- [ ] Mobile viewport (375px) — n/a: not driven in a browser this run; listed under manual verification
- [ ] Browser console clean — n/a: not driven in a browser this run
- [x] Network clean: the dev server answered `/` and `/adopt` with 200 and no errors in its log

## 6. Regression

- [x] The pages nearest the change still work: `/` and `/adopt` load, `check-public-views.mjs` exits 0
- [x] Any shared file touched checked from a second page: `AdoptionProfileFields` is shared with intake, which passes no `withThai` and so shows no Thai box (code reading, typecheck and build pass); not loaded in a browser
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged, already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: the since-year item is ticked, noting only the Director's year is left; the Thai breed/colour item is annotated and left open for the Translations registration
- [x] Non-obvious design choices added as `docs/decisions/2026-10-16-labels-and-year-app.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has two new lines, one for the year box and one for the Thai breed and colour boxes; neither says the year is showing
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The label output and the fallback were run against the real code, not argued

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the only boundary is the year range 1990 to 2100, copied from the column's check
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the only pasted evidence is the gates lines, copied from the log
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration; it reads 0204 and 0205, which must be live in production first
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Destructive migration backup — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated — n/a: purely additive, nothing to roll back in the data; a rebuild of the previous SHA reverts the screens

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | Breed and colour are not registered in `translatable_labels`, so the Translations page does not list them | deferred to backlog: needs a migration this stream may not carry; filed on the backlog branch |
| 2 | minor | `/e/[id]` resident cards show the English breed only | accepted: that loader does not select the Thai column |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Type a year in one figure, confirm; the home page reads "… since <year>" in English and Thai at 375px; clear it and the plain label returns | Settings → Website, then `/` |
| 2 | A resident with Thai breed and no Thai colour reads correctly in Thai at 375px on the resident page, `/adopt` and `/adopt/<id>` | dev, signed in |
| 3 | The edit page shows the two Thai boxes and saves them; intake shows none | `/residents/<id>/edit`, `/residents/new` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items are still open and only the person who looks may tick this

Manual verification by: pending: the three items in the table above need a person signed in on dev

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
