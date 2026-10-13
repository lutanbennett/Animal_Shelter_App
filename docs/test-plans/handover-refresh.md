# Feature test plan — handover-refresh

## Header

| | |
|---|---|
| Feature | Bring `docs/release-handover.md` up to date: `--drift` is fixed, the duplicate `0191` is decided, and a release's PRs now merge without asking. Plus a "what happened next" note on `0.28.0`'s record |
| Backlog item | `docs/backlog.md` → none — asked for directly by Lutan on 2026-10-13: *"Is everything documented for the handover"*. It was not |
| Branch / worktree | `claude/handover-refresh` @ `C:\Development\Animal_Shelter_handover-refresh` |
| Dev server | not started — this PR adds no code and no page |
| PR | #582 |
| Tested by / date | Claude (production release manager session) / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the handover written at the end of `0.28.0` was stale within hours; this corrects what is now wrong and adds what was missing
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/release-handover.md`, `docs/releases/2026-10-13.md` (one addendum) and this plan. Markdown only: no route, no `worker/`, no migration, no shared lib, no code
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** Nothing in `docs/` is served by the app. The reader is whoever runs `0.29.0`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the `--drift` fix and the `0191` decision themselves, which are #579's work by another stream, read and cited here rather than redone. Also out of scope: the two allow rules, which are not in the repository and which Claude cannot read

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `67c05093` minutes before
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 39s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 120s
=== gates: test — npm test
=== gates: test exited 0 after 2s
=== gates: build — npm run build
=== gates: build exited 0 after 150s
gates: typecheck=0 lint=0 test=0 build=0
gates exit: 0
```

- [x] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `all 7 jobs `completed success` on run 38310924212 at `5c001bdc`, the branch tip: script-integrity, audit, new-policy-role-names, test-plan, migration-numbers, public-views, check. Read from `gh run view <id> --json jobs`, not from `gh pr checks`` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The handover states the next free number is `0192`, which was re-read against `main` while editing it
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR, and nothing here reads or writes a row
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — **the central claim of this PR is that `--drift` works, and it was run rather than inferred from #579's commit message.** `node scripts/apply-migrations.mjs --drift production` printed the comparison and then `No drift: production matches origin/main`, and exited **0** when run bare rather than through a pipe. That is the behaviour the old handover said was impossible
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows, no state
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the one boundary a markdown edit has is **the numbered list it is inserted into**. Inserting an item at position 2 renumbered the rest; the renumbering was scripted, then **re-read**, and it had missed the final item because that one begins with a backtick rather than bold text, leaving two items numbered 13. Found and fixed before commit. See Defect 1

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | nothing | `docs/` is not served by the app; no role reaches these files through any URL | unchanged by this PR |

- [ ] Every role above tested — n/a: there is nothing for a role to reach
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the shelter manual is for shelter users; this is a release process document
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout, no page
- [ ] Browser console clean — no errors or React warnings — n/a: no page is loaded by this PR
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: same reason

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — n/a in the usual sense; `gates.mjs` ran the full build and all four gates exited 0, so nothing in `docs/` has broken a build that reads it. No page reads either file
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — **the "second page" here is `docs/releases/2026-10-13.md`, and it was read rather than assumed.** It describes `--drift` at length as an open defect, so correcting only the handover would have left the two documents contradicting each other with no clue which is current. Hence the addendum on the record's Defect 5, which also closes Defect 6
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing to merge; branched from `origin/main`'s tip at `67c05093`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: this closes no backlog item. The two items this work touches — the `--drift` crash and the duplicate `0191` — were both ticked by #579, which did the work
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no new decision. This PR records decisions made elsewhere — Lutan's merge decision (`2026-10-13-release-prs-merge-without-asking.md`) and #579's number-check decision — in the place a release manager reads first
- [x] `README.md` still accurate — no README statement is about the handover
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: nobody would notice. These are process documents in `docs/`; nothing the app serves changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — **the claim being corrected was itself a confidently wrong one**, which is the point. The old handover said `--drift` crashes; that was true when written and false hours later. It was checked by running the command, and #579's decision file was read before citing it rather than inferred from its title

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — this PR ships no build and is not part of a release
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — n/a: nothing is deployed by this PR

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no file here is in the build
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: same reason
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — n/a: this PR derives no date
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock — n/a: no instant is derived
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — n/a: no date-derived behaviour
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named** — n/a: no boundary or banding change in the code sense; the list-renumbering boundary is covered in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: nothing this PR touches reaches a public page

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: this PR runs no deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: this PR runs no deploy
- [x] Any new secret/env var exists in the production Cloudflare environment — n/a in effect: no secret and no env var. The two allow rules the handover now documents are Claude Code settings on Lutan's laptop, not application configuration

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration in this PR, and nothing here touches data
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations — **nothing to roll back in the running system.** Reverting the commit restores the previous wording, which is the *stale* wording, so a revert here would reintroduce a false warning about `--drift` rather than undo a risk. Nothing deployed reads either file

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up.

| # | What to check | Where |
|---|---|---|
| 1 | **The handover reads correctly cold**, to someone who was not in this session — in particular that the two-touch budget and the allow-rule section are clear enough to act on, and that nothing still reads as though `--drift` were broken | `docs/release-handover.md`, at the start of `0.29.0` |

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

Automated checks by: Claude (production release manager session)  Date: 2026-10-13

### Manual verification

The items in **Left for manual verification** above, signed by the person who looked.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: row 1 — the handover read cold by whoever runs `0.29.0`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: the release manager wrote it

Result: pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The scripted renumbering of the "What the next release will need" list skipped its final item, leaving **two items numbered 13**. The script matched `^\d+\. \*\*` and that item begins with a backtick, not bold text | fixed before commit, and worth recording: a regex over prose silently matches less than it looks like it does, and the only reason this was caught is that the output was re-read rather than trusted. The same shape as `| tail` hiding an exit code |
| 2 | low | `docs/release-handover.md` was **stale within hours of being written** — it warned at length about a tool that had been fixed, in the document a release manager reads first | accepted as inherent, and answered with a standing instruction rather than a fix: the file now opens by saying that when something it warns about is fixed, someone should come back and say so. A confidently wrong warning costs more than a missing one |
