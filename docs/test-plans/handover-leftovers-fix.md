# Feature test plan — handover-leftovers-fix

## Header

| | |
|---|---|
| Feature | Correct three stale or wrong claims in `docs/release-handover.md`, written during `0.32.0` and already out of date by the time the release finished |
| Backlog item | `docs/backlog.md` → none — a correction to a short-lived handover closes no backlog item |
| Branch / worktree | `claude/handover-leftovers-fix` @ `C:\Development\Animal_Shelter_handover-leftovers-fix` |
| Dev server | not started — this PR changes one markdown file and renders nothing |
| PR | #641 |
| Tested by / date | Claude (production release manager session) / 2026-10-15 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — fix three claims in `docs/release-handover.md` that were wrong or became stale in the last few minutes of `0.32.0`: a leftover-worktree **count** copied from the previous edition without checking, two lines saying the release's own worktrees still needed clearing when they had already been cleared, and an Open PRs row naming the record PR as open after it had merged
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/release-handover.md` and this plan. **No code, no route, no `worker/`, no migration, no shared lib**
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** The handover is a repository document for whoever runs the next release; no role in the app can reach it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: actually clearing the remaining leftover worktrees, which is `/clean-streams` work and needs a person to decide about the two `HELD` ones; and `docs/releases/2026-10-15.md`, which is a record of what happened and is **not** edited by this PR. Only the short-lived handover is corrected

**Why this is worth a PR at all.** The handover's own standing instruction is that
a confidently wrong warning costs more than a missing one, and the wrong claim was
of exactly that kind: it told the next release manager that a tidy-up was three
times larger and wholly neglected, and it described another session's live branch
as an abandoned leftover. Left alone it would have been read as fact by the next
release and quoted forward again, which is how it survived from the `0.31.0`
edition into the `0.32.0` one in the first place.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly; the branch was created from `origin/main` at the post-release tip and had nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 50s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 100s
=== gates: test — npm test
=== gates: test exited 0 after 4s
=== gates: build — npm run build
=== gates: build exited 0 after 115s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit. Ticked in a follow-up commit once the run is actually green

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The highest on `main` is `0199`, and the next free number is `0200`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; both databases read `200 applied, 0 pending` after the release
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR, so there is nothing to dry-run
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR, and nothing here reads or writes a row
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no behaviour. Its correctness is whether the corrected sentences are true, which is checked in §6 against `worktree.mjs list` and `gh` rather than by using the app
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no such path in this PR
- [ ] Empty state renders sensibly (no rows yet) — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing | no app surface changes | nothing under `src/`, `worker/` or `supabase/` is touched — confirmed from the branch diff against its merge-base |

- [ ] Every role above tested — n/a: no role reaches anything in this PR
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change. The release handover is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string; the handover is English-only by design
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: nothing renders
- [ ] Browser console clean — no errors or React warnings — n/a: nothing renders
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: nothing renders

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — read as "are the replacement sentences true", which is the only way this PR can be wrong. Each was established from a command rather than from the previous edition: the worktree inventory from `node scripts/worktree.mjs list` (which also supplied `planner-handover-156`'s `dirty 1` and `ahead 4`, the evidence that it is live work and not a leftover), `#638`'s state from `gh pr view 638 --json state` → `OPEN`, and #639's and #640's merged state from having merged them. **The one number the corrected text gives is deliberately a range** — "two or three" — because `donate-page-order` read as all-`-` on the last run and that is not enough to call it either way; the text says to look rather than guessing on the reader's behalf
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a would be wrong here, so: **no shared file is touched.** `docs/release-handover.md` is read by people, not by code
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing to merge, and this branch adds only prose to one document

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: no backlog item. The leftover worktrees themselves are `/clean-streams` work and need a person for the two `HELD` ones, which is said in the corrected text rather than filed as a new item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no design choice. This is a factual correction to a file that is rewritten every release and deliberately short-lived, so a decision file would outlive the thing it was about. The generalisable lesson — a count copied from the previous edition is a quotation, not a fact — is written into the handover itself, next to the line it broke
- [x] `README.md` still accurate — no README statement is about the handover or about worktree counts
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: nobody using the shelter app can reach the release handover, and this PR changes nothing that runs. `unreleased` is deliberately left empty, which is its correct state immediately after a cut
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** This is the whole substance of the PR: the claim being replaced was *reasoned* — inherited from the previous edition because it looked like a fact — and the replacement is measured, from `worktree.mjs list` and `gh pr view`. The correction also states what it cannot settle (`donate-page-order`) instead of rounding it into the count

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — this PR ships nothing. `0.32.0` is live everywhere at `038859fb` and is unaffected by it
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — n/a: this PR triggers no deploy. `0.32.0`'s deploy lines are read and quoted in its record

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: this PR is a document and will not be deployed on its own. It reaches test and production whenever the next release ships, with nothing to verify
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: no behaviour to smoke-test; the change cannot affect a running build
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives a date
  - *Does the logic handle the boundary?* — n/a: no instant is derived in this PR
  - *Does the deployed build behave as the source does?* — n/a: no date-derived behaviour in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or banding change in this PR. The one *number* it touches is a leftover count in prose, and the correction deliberately gives a range rather than a false precision
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block in §2 is `gates.mjs`'s own closing lines
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: this PR cannot affect a public page, and the site is locked in any case

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy in this PR
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy in this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: this PR carries no migration, so there is nothing to dry-run
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting the commit restores the previous wording of one markdown file and changes nothing a user or a service can reach; there is no deploy to undo and no migration to reverse. **What it would not cover: nothing.** This is as reversible as a change gets, which is worth saying plainly rather than leaving the box ticked without content

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `docs/release-handover.md`, written during `0.32.0`, claimed "nine older leftovers … and nothing has been done about them since". The real figure was two or three, and one of the four folders listed was #638's live branch with uncommitted work in it | **fixed by this PR.** The count came from the `0.31.0` edition and was reproduced without being checked against `worktree.mjs list`. The replacement text quotes the list, names which folders are genuine leftovers and which is live work, says what it cannot settle, and adds the general rule next to the line that broke: a count carried over from the previous edition is a quotation, not a fact |
| 2 | low | The same file said the release's own two worktrees "are free leftovers once their PRs merge" and listed `/clean-streams` for them as outstanding work, when both had already been `done` with their branches removed locally and on `origin` | **fixed by this PR.** Rewritten to say clearing them is the release manager's last step and that `0.32.0`'s own two are already gone, so the next release starts from a clean list |
| 3 | low | The Open PRs row named "the record PR this file is in" as open; it had merged | **fixed by this PR.** The row now names #638 and this correction PR, and states that #639 and #640 are merged |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the two `HELD` leftovers — `public-site-visitor-fold` and `small-ui-fixes-fold` — can be cleared, and what `donate-page-order` actually is. `HELD` means something still has the folder open, so it is a question for a person rather than a thing to tear down. This PR only corrects the description of them; it clears nothing | `node scripts/worktree.mjs list`, then `/clean-streams` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the leftover worktrees above — whether the two `HELD` ones can go, and what `donate-page-order` is

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass
