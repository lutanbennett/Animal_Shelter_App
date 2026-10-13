# Feature test plan

## Header

| | |
|---|---|
| Feature | `/clean-streams` / `worktree.mjs done` merge proof, app-worktree filter, and the `git show` shell trap rule |
| Backlog item | `docs/backlog.md` → "`/clean-streams` can no longer clear a finished stream" and "`git show <rev>:<path>` silently returns an error" |
| Branch / worktree | `claude/stream-tooling-fixes` @ `C:DevelopmentAnimal_Shelter_stream-tooling-fixes` |
| Dev server | not started; no runtime surface |
| PR | recorded in the follow-up commit |
| Tested by / date | Claude / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | `03a35a95` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — worktree.mjs `done` proves squash merges (PR head == tip + merge commit in main), refuses merged-PR-plus-extra-commits, hides the app worktree; skill rewritten; `git show` shell trap documented in CLAUDE.md
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `scripts/worktree.mjs`, `.claude/skills/clean-streams/SKILL.md`, `CLAUDE.md`, `docs/backlog.md`, one new `docs/decisions/` file, this plan. No `src/`, `worker/` or migrations
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none; nothing a shelter role can reach changes
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `claude/bills-inbox` and other leftovers were not removed; no real `done` was run on a live branch; stale registry entries are pruned by the skill, not by `list`

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — `Already up to date`, pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, as printed:

```
=== gates: build exited 0 after 234s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no UI surface; developer tooling and docs only
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no UI surface; developer tooling and docs only
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no UI surface; developer tooling and docs only
- [ ] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no UI surface; developer tooling and docs only
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no UI surface; developer tooling and docs only
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no UI surface; developer tooling and docs only
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: no UI surface; developer tooling and docs only
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no UI surface; developer tooling and docs only
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no UI surface; developer tooling and docs only

## 4. Functional checks

- [x] Happy path works end to end — scratch repo with a faked GitHub answer (`WORKTREE_TEST_PRS`): a squash-merged branch was cleared by `done` without `--force`
- [x] Data persists — reload the page and the change is still there — branch and origin ref were really deleted, verified by the script's own closing checks
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; developer tooling and docs only
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; developer tooling and docs only
- [x] Invalid input is rejected with a readable message, not a crash — the dangerous cases: merged PR + later commit refused with and without `--force`; merged PR whose merge commit is not in main refused; no PR refused. Exercised, not only reasoned
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI surface; developer tooling and docs only

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role`
was dropped by `0181`). The live ones are admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is
retired (`0173`). **There is no `resident` role** — in this app a resident is an
animal — and do not re-derive this list by grepping for quoted strings; read the
`roles` table (or `/admin/who-does-what`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: no UI surface; developer tooling and docs only
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no UI surface; developer tooling and docs only

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI surface; developer tooling and docs only
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI surface; developer tooling and docs only
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI surface; developer tooling and docs only
- [ ] Mobile viewport (375px) — n/a: no UI surface; developer tooling and docs only
- [ ] Browser console clean — n/a: no UI surface; developer tooling and docs only
- [ ] Network clean — n/a: no UI surface; developer tooling and docs only

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `list` run against the real repo: the app worktree `determined-kepler-66dfa9` no longer appears and every other row still prints
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — only `worktree.mjs` (used by `new`/`sync`/`dev`); `node --check` passes and `list` runs; `new` and `sync` untouched, `sync` ran for real
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged nothing

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — both items ticked in `docs/backlog.md`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-10-13-done-needs-two-proofs-of-merge.md`
- [x] `README.md` still accurate — README does not describe worktree.mjs internals
- [ ] **Release notes.** — n/a: developer tooling and a documented shell trap — nothing a shelter user would see
- [x] Commit messages say why, not just what — they give the reason
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the `git show` failure and its three workarounds were reproduced in this shell; the five `done` cases were run in a scratch repo

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `03a35a95`; not yet main's tip, correct at PR time
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deployable or user-facing changes; repo scripts and docs only

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing deployable changes; only repo scripts and docs)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager (nothing deployable changes; only repo scripts and docs)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: production release manager (nothing deployable changes; only repo scripts and docs)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] — deferred: production release manager (nothing deployable changes; only repo scripts and docs)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — gates block is the script's output as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: nothing deployable or user-facing changes; repo scripts and docs only

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: production release manager (nothing deployable changes; only repo scripts and docs)
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager (nothing deployable changes; only repo scripts and docs)
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: nothing deployable or user-facing changes; repo scripts and docs only

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — deferred: production release manager (nothing deployable changes; only repo scripts and docs)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager (nothing deployable changes; only repo scripts and docs)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — deferred: production release manager (nothing deployable changes; only repo scripts and docs)
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: nothing deployable or user-facing changes; repo scripts and docs only

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — `git revert` the PR; no deployed artifact and no schema. It does not undo any branch `done` deleted meanwhile

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found | — |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up. Listing them again in this
table gives them a second home that nothing ever closes: the check gets done at
deploy time, section 8 is satisfied, and this row stays open for good. Five
release-cut plans accumulated permanently-open rows exactly that way before it
was noticed (2026-09-27).

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item checked — n/a: list is not empty; item 1 awaits a person

Manual verification by: pending: item 1 above, the real gh path on a real squash-merged leftover

### Result

- [x] Open defects are fixed or accepted — none found
- [ ] Checklist pasted into the PR the PR — n/a: not yet — the PR does not exist at this commit — deferred: production release manager (nothing deployable changes; only repo scripts and docs)
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: n/a: not yet — the release manager reads this at release time
