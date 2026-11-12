# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `743` — a delta against `742` |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping, not a backlog item; `CLAUDE.md` ("Every PR merges on green") puts it in the same class as the release record |
| Branch / worktree | `claude/planner-handover-743` @ `C:\Development\Animal_Shelter_planner-handover-743` |
| Dev server | not started — `n/a`, this PR changes one documentation file and no code |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner session), 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | see the sign-off commit; the gates ran on 859d1348c plus this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one sentence: `docs/planner-handover.md` is replaced with edition `743`, reporting the second 2026-11-12 plan's complete set of nine figures, the re-scoping of three briefs at briefing time, and what `742`'s four owed items did.** There is no backlog item by design (see the header); the instruction is `.claude/skills/plan-day/SKILL.md` step 8, *write it at setup of the last batch*
- [x] Files/areas touched listed — **`docs/planner-handover.md` only** (224 lines, replacing 198), plus this plan. No routes, no `worker/`, no `supabase/migrations/`, no shared libs, no `src/`
- [x] Cards affected identified — **none.** The handover grants and denies nothing: it is a document read by one chat. Admin and the signed-out public are unaffected, because nothing in the app reads this file
- [x] Anything explicitly **out of scope** written down — **out of scope: `docs/release-handover.md`** (unchanged; it is the release manager's and this edition says nothing about it), **`.plan-day.md`** (gitignored, already updated in the main checkout, and deliberately not in any PR), **and the backlog filing this edition names as owed** (#1531's next group for `#3nuwy`), which belongs on the `backlog` branch and not here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`:

```
=== gates: typecheck exited 0 after 144s
=== gates: lint exited 0 after 278s
=== gates: test exited 0 after 75s
=== gates: build exited 0 after 297s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the highest on `main` is `0365` and this PR adds none
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no table is read or written by this change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour; the artefact is a markdown file a chat reads
- [ ] Data persists — reload the page and the change is still there — n/a: no page
- [ ] Create / edit / delete all exercised — n/a: no feature with those operations
- [ ] Empty state renders sensibly — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| — | — | — | n/a: this change adds no reachable surface, so there is nothing for any card to reach or be refused |

- [ ] Every login above tested — n/a: no reachable surface; the file is in the repository, not served by the app
- [ ] A login that should not have access is blocked server-side — n/a: no surface to block

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; `NavLinks.tsx` untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: a planner document is not shelter-user documentation, and nothing in the manual refers to it
- [ ] Translatable strings go through the translation path — n/a: no user-facing string; the handover is English, read by one chat
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no rendered surface
- [ ] Network clean — n/a: no rendered surface

## 6. Regression

- [x] The pages nearest the change still work — **n/a in substance and recorded as checked rather than skipped: the "pages nearest" a file nothing imports is the empty set.** Verified by the `build` gate, which compiles the whole app from a tree containing this file and passed
- [x] Any shared file touched checked from a second, unrelated page — **no shared file was touched.** `git show --stat` on the commit lists `docs/planner-handover.md` alone, and no code imports it
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and the gates ran green afterwards on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item, by design (see the header). `docs/backlog.md` is untouched by this PR
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the handover records this plan's decisions itself, in the document being changed; a decision file about a handover would duplicate it
- [x] `README.md` still accurate — unchanged by this PR and it does not describe the handover's contents
- [ ] **Release notes.** — n/a: a planner handover is read by one chat; no shelter user can see it or would notice it. `src/lib/releases.ts` is untouched, and this PR touches none of `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`
- [x] Commit messages say why, not just what — the commit names the lead (a plan line written before the item was read goes stale) and why the distinction between briefing and the removed end-of-batch re-check is written down
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the edition comes from a `stream-usage:` comment read off a merged PR; the three hypothesis answers are quoted from #1526, #1527 and #1528's own PR bodies; the `0188` enum values and the `donate` evidence were read from the files and line numbers named. **The one claim marked as inference rather than measurement is marked as such in the edition itself:** `donate-promptpay-qr`'s two halves *"appear already shipped"*, which its brief tells the stream to settle

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no logic, no date handling, no deployed behaviour; the change is one markdown file
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or threshold in code. (The *bands* this edition revises are a planner's estimates in a skill document, not a runtime band)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block above is pasted from the run's own output file, read with `cat`
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this one commit restores edition `742` in full, and that is the whole of the rollback.** Nothing is deployed by this change, no migration is applied, and no running process reads the file, so neither `deploy-pi.sh` nor `wrangler rollback` is involved. **What a revert does not cover:** `.plan-day.md` is gitignored and already records 9 of 9, so reverting the handover would leave the counter and the handover disagreeing — the next planner would read `742` beside a plan file saying the plan is complete. **If this is ever reverted, say so to the next planner in chat.**

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The edition runs to **224 lines against the ~150-line target** `CLAUDE.md` sets for a handover delta | accepted — the figures table is nine rows this time rather than eight, and there are seven owed items where `742` had four. Trimmed where it repeated `742` and `741` by reference instead of restating them |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing. The artefact is a document with no surface a person needs to look at, and its own audience is the next planner chat, which reads it as its first act | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planner document with no surface to look at; its only reader is the next planner chat

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a in substance: a handover ships no code and is not part of a release. Recorded as done because section 8's deploy rows are `deferred:` to them and this line is what hands those rows over

Result: pass with accepted defects

Release manager acknowledgement: pending: no release is being cut by this PR; acknowledgement is not sought for a handover
