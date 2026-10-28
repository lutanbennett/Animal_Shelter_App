# Feature test plan — medical-photos-read-note

## Header

| | |
|---|---|
| Feature | The release note for `0276`'s READ half: looking at a resident's Medical-folder photos needs a medical card |
| Backlog item | `docs/backlog.md` → Security, *MEDICAL PHOTOS ARE READABLE WITH THE VIEW RESIDENTS CARD* (already ticked by grooming; this PR closes the release note its body left owed) |
| Branch / worktree | `claude/medical-photos-read-note` @ `C:\Development\Animal_Shelter_medical-photos-read-note` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | filled in at `gh pr create` |
| Tested by / date | Claude (Opus 5) / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | see the `gates:` block below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` (`unreleased`, one note), a decision file, and this plan. Nothing else
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — the note is card-tagged, so it is shown to holders of `view_residents`, `residents`, `add_medical_photos`, `view_medical`, `medical_records`, `book_clinic_visits`, `run_appeals`, and always to Admin. Volunteer is deliberately excluded: it holds none of those and never read the Medical folder
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: changing who holds which card (a Settings answer for Lutan, raised in chat 2026-10-28), the app-half gallery gating that `0276`'s header assigns to a later batch, and `0275`'s note, which #1024 already shipped in `0.40.9`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
GATES_OUTPUT_PLACEHOLDER
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; the behaviour the note describes is `0276`, already applied to production at 2026-10-28T04:56:38Z

## 4. Functional checks

- [x] Happy path works end to end — `unreleased` holds exactly one well-formed `{ text, cards }` note; `typecheck` proves every card key is a real `CardKey` and that the shape matches `ReleaseNote`
- [ ] Data persists — reload the page and the change is still there — n/a: a static constant in the source, no stored state
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a release note has no create/edit/delete surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: the empty state is the `unreleased: []` this PR fills, and it is what shipped in `0.40.9`
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; the note is authored, not entered
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no values; the only risk is wording, which is in the manual list below
- [x] **Card labels in the note match the on-screen labels** — checked against `src/lib/i18n/dictionaries/en.ts`: View medical (188), Manage medical (187), Book clinic visits (189), Run fundraising appeals (204), View residents (185), Add Medical Photos (180). Two first drafts were wrong and were corrected; see Defects

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees the note — Admin sees every line | as expected, per `release-audience.ts` |
| management | `/releases` | sees it — holds `residents`, `book_clinic_visits`, `run_appeals` | as expected |
| staff | — | retired by `0173`; no login exists | n/a |
| doctor | `/releases` | sees it — holds `medical_records` | as expected |
| volunteer | `/releases` | does **not** see it — holds none of the tagged cards | as expected |
| signed out | `/releases` | no change; released notes only | as expected |

- [ ] Every role above tested — n/a: read from the card tags and `release-audience.ts`, not driven as six logins. A release note grants nothing, so this matrix is about who is shown a line, not who can reach anything
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: nothing is gated by this PR; the access change it describes is `0276`, verified in its own plan

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: not touched; `/releases` already exists
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched; a release note is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are authored in English and carried by the existing `/releases` path, which this PR does not change
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no new markup; the note renders in the existing `/releases` list
- [ ] Browser console clean — no errors or React warnings — n/a: no new client code
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `build` compiles `/releases` and every other route importing `src/lib/releases.ts`; a malformed note or an unknown card key fails `typecheck`
- [ ] Any shared file touched checked from a second, unrelated page — **by loading that page** — n/a: `src/lib/releases.ts` is shared, but only its `unreleased` array changed, and nothing reads that except `/releases`
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item is already ticked; what was outstanding was the note inside its body, and that body is reworded on the `backlog` branch instead because it also carries a stale "NOT YET ON PRODUCTION" line
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-28-medical-photos-read-note.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained the line this PR exists for, written for a shelter user and card-tagged. It promises nothing outstanding: `0276` is live on production (applied 2026-10-28T04:56:38Z), so the behaviour it describes is in force now, which is the condition the release-note truth rule asks for
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The apply time is `check-production.mjs calendar-cron` output; the card labels are line references in `en.ts`; the closure is `card_includes` rows plus `card_closure()`. The one thing NOT measured is stated as such in the decision file and in the handover: who holds the read is derived from the card tables, not proven by a query run as those logins

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: a static note; no date arithmetic anywhere in the change
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: no boundary, threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block above is as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager
- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration
- [x] Rollback position stated, **including what it does not cover** — reverting this commit removes the note and nothing else: no schema, no behaviour. It does not undo `0276`, which is already applied and is reverted by no rollback of this PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First draft named the cards "Run appeals" and "Add medical photos"; the on-screen labels are "Run fundraising appeals" and "Add Medical Photos" | fixed |
| 2 | low | First draft said a login without the read "no longer sees Medical"; the database hides the photos, while the folder-chooser half is `0277`/`0278`. Reworded to the Medical folder's photos | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read the note as a shelter user and say whether four card names in one sentence is too much, or whether it should simply say "a medical card" | the diff on this PR, or `/releases` after the next cut |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by: pending: a person to read the note's wording — item 1 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: at the next release cut
