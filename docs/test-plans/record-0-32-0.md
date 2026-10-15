# Feature test plan — record-0-32-0

## Header

| | |
|---|---|
| Feature | The `0.32.0` release record: a `## 0.32.0` section in `docs/releases/2026-10-15.md`, and the build-order decision the last release asked for |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item |
| Branch / worktree | `claude/record-0-32-0` @ `C:\Development\Animal_Shelter_record-0-32-0` |
| Dev server | not started — this PR changes no code and renders nothing |
| PR | #640 |
| Tested by / date | Claude (production release manager session) / 2026-10-15 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — record what `0.32.0` actually did, as a `## 0.32.0` section appended to today's record file, plus `docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md`, which settles the build-order question `0.31.0`'s record and the release handover both left open
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-15.md` (one H1 retitle and an appended section), `docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md` (new), `docs/release-handover.md` (rewritten for the next release) and this plan. **No code, no route, no `worker/`, no migration, no shared lib**
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** Nothing here is reachable from the app; these are repository documents
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the four items under **Left for a person** in the record, which are a person's work and not this PR's. **This PR is not a gate** — `0.32.0` was deployed and verified before it existed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, bringing in the merged cut (#639)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 36s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 78s
=== gates: test — npm test
=== gates: test exited 0 after 3s
=== gates: build — npm run build
=== gates: build exited 0 after 82s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit. Ticked in a follow-up commit once the run is actually green

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's two (`0198`, `0199`) merged in #632 and #635 and were applied to production as a release step, recorded in the record itself
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; both databases read `200 applied, 0 pending` after the release, quoted in the record
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR, and nothing here reads or writes a row
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; the release's apply is already done and recorded

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no behaviour. Its correctness is whether the record matches what happened, which is checked in §6 against the logs and endpoints rather than by using the app
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no such path in this PR
- [ ] Empty state renders sensibly (no rows yet) — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR

### Role access matrix

Nothing in this PR is reachable by any role: three documents in the repository and
one test plan. The matrix is `n/a` as a whole rather than row by row, which is the
honest form here — filling eight rows with "cannot reach a markdown file" would be
noise, not a check.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing | no app surface changes | no file under `src/`, `worker/` or `supabase/` is touched — confirmed from the branch diff against its merge-base |

- [ ] Every role above tested — n/a: no role reaches anything in this PR
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change. A release record is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string; these documents are English-only by design, as every previous record is
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: nothing renders
- [ ] Browser console clean — no errors or React warnings — n/a: nothing renders
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: nothing renders

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — read as "is the record true", which is the only way this PR can be wrong. Every factual claim in it was re-read off its source rather than from memory: the deployed SHA and version from `/api/version` on both hosts, the project ref, `Next.js version`, `strip-baked-env`, the Server Actions key and the mail line from `deploy-0.32.0.log` (after `tr -d '\000'`), both Pi clones and services over SSH, the drift lines from the named `--drift` runs, the PR list from `release-prs.mjs` at the release SHA, `#638`'s state from `gh pr view`, the CI run id and its seven job conclusions from `gh run view --json jobs`, and the mail's arrival time and subject from the inbox
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a would be wrong here, so: **no shared file is touched.** `docs/releases/2026-10-15.md` is read by people, not by code, and the branch diff against its merge-base confirms nothing under `src/` changed
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in the merged cut (#639) and this branch adds only documents on top of it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release record closes no backlog item. The release's own items were ticked by the feature PRs that closed them, and the four things still open are in **Left for a person** in the record, where a person picks them up
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md`. This is the substantive half of the PR rather than a formality: `0.31.0`'s record and the handover both asked explicitly for a decision instead of another silent choice, and the file states the order, the reasoning, what it deliberately does not change, and what evidence would show it was the wrong call
- [x] `README.md` still accurate — no README statement is about release records or build order
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: nobody using the shelter app can see a release record, a decision file or the handover. No shelter user has any way to reach these documents, and `unreleased` is deliberately left empty, which is its correct state immediately after a cut
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** This is the main risk in a record PR, since no gate reads prose and a plausible wrong sentence is the thing the next release manager inherits. Two places were handled deliberately rather than written confidently: the record states that the **new build order was not exercised**, because `main` did not move after the cut, instead of implying the change was vindicated; and the `0199` `-- consumer:` finding is stated as having been found **by diffing the header against the tree**, which is what was actually done

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release's deployed SHA `038859fb` is recorded in the record; this PR is documents on top of it and ships nothing
- [x] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — read from `deploy-0.32.0.log`: `deploy: production ... Supabase project dbkodyyxxhtygxcxmfcu (038859fb)`, and all four builds report `038859fb`

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` — done as a release step (`node scripts/deploy.mjs --env test`, the bare `node` form), test Worker at `038859fb`, and the test Pi pinned to the same
- [x] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — to the extent a session without an account can: `/api/version` reports `0.32.0` at `038859fb` with `x-lanna-served-by: pi`, and `/api/releases/current` reports `0.32.0`. Everything behind sign-in is in **Left for a person** in the record
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives a date. The record's dates are fixed strings. The release's own date-derived behaviour is the vet-visit calendar link, which carries that check in `vet-visit-calendar-link.md` and is not re-signed here
  - *Does the logic handle the boundary?* — n/a: no instant is derived in this PR
  - *Does the deployed build behave as the source does?* — n/a: no date-derived behaviour in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block in §2 is `gates.mjs`'s own closing lines, and every quoted line in the record is copied from the log, endpoint or `gh` output it came from rather than retyped
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: unreachable, and this is the release's biggest blind spot rather than this PR's gap. `PUBLIC_SITE` is `locked`, so an anonymous request gets the staff gate; three of `0.32.0`'s six notes are about the public site and all three are in **Left for a person**

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `dbkodyyxxhtygxcxmfcu`, read from the log
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `removed 11 env var(s)`, the eleven named, on both Worker builds
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var, and neither did the release

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries neither. The release's two were applied **before** either deploy, and the one finding about `0199`'s `-- consumer:` header is recorded as Defect 1 in the record
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: this PR carries no migration, so there is nothing here to dry-run. It was run twice during the release itself, both files `ok`, exit 0, and is quoted in the record
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: this PR carries no migration. The gate was satisfied for the release itself and is recorded under **Backups**, including the fact that the dump is the same one `0.31.0` cited, because both releases were cut the same day
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR; the release's apply is complete and recorded

### Rollback

- [x] Rollback position stated, **including what it does not cover** — for this PR, reverting the commit removes three documents and changes nothing a user or a service can reach, so there is no deploy to undo. The release's own rollback position is recorded in full in the record, including the two things a Pi rebuild would not cover, and the useful finding there is that `0.32.0` is in a **better** position than `0.31.0`: both its migrations are inert under `0.31.0`, so the mail is the only part a rebuild could not undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | — none in this PR. The release's three defects are recorded in the record itself, where they belong |

## Left for manual verification

The four rows in the record's own **Left for a person** table are the release's
handover and are not repeated here, for the reason the template gives: copying
them would give them a second home that nothing closes. What is left for a person
about *this PR* is one thing only.

| # | What to check | Where |
|---|---|---|
| 1 | That the record is a fair account of the release, and in particular that the build-order decision reads as a decision someone can disagree with later rather than a fait accompli — it changes how every future release is sequenced | `docs/releases/2026-10-15.md` → `## 0.32.0`, and `docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: Lutan to read the `0.32.0` record and the build-order decision

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass
