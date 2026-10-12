# Feature test plan — release-fewer-merges

## Header

| | |
|---|---|
| Feature | Release PRs merge without asking; the migration apply gets an allow rule; `npm ci` in the main checkout becomes a release step |
| Backlog item | `docs/backlog.md` → none — this is Lutan's process decision of 2026-10-13, taken in chat, not a backlog item |
| Branch / worktree | `claude/release-fewer-merges` @ `C:\Development\Animal_Shelter_release-fewer-merges` |
| Dev server | not started — this PR adds no code and no page |
| PR | #581 |
| Tested by / date | Claude (production release manager session) / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — record Lutan's decision that a release's own two PRs are merged by Claude once CI is green, so a release costs him two interventions instead of five
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `CLAUDE.md`, `docs/release-procedure.md`, a new `docs/decisions/` file and this plan. Markdown only: no route, no `worker/`, no migration, no shared lib, no code
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** Nothing here is served by the app. The people affected are Lutan and future Claude sessions
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the two permission rules themselves, which live in `C:\Users\Leidos\.claude\settings.json` and are **not in the repository**. Lutan added them by hand on 2026-10-13 after the classifier refused Claude the edit as self-modification. Also out of scope: the production Worker deploy, which deliberately keeps no allow rule

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `47a09820` minutes before, and nothing has merged since
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 149s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 255s
=== gates: test — npm test
=== gates: test exited 0 after 4s
=== gates: build — npm run build
=== gates: build exited 0 after 226s
gates: typecheck=0 lint=0 test=0 build=0
gates exit: 0
```

- [x] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR, and nothing here reads or writes a row
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — **the behaviour this PR changes is Claude's, and the happy path was exercised while making the change**: the two allow rules Lutan added were confirmed working by this session immediately afterwards. `node scripts/worktree.mjs new release-fewer-merges` had been refused as self-modification minutes earlier and went through once the rules were in; `gh pr merge` ran without a prompt on #576 and #577 in the same session. The remaining half — a release that costs two touches instead of five — cannot be exercised until the next release, and is in Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows, no state
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | nothing | `CLAUDE.md` and `docs/` are not served by the app; no role reaches them through any URL | unchanged by this PR |

- [ ] Every role above tested — n/a: there is nothing for a role to reach
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the shelter manual is for shelter users; this is a development process document
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout, no page
- [ ] Browser console clean — no errors or React warnings — n/a: no page is loaded by this PR
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: same reason

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — n/a in the usual sense, and checked in the sense that matters: `gates.mjs` ran the full build on this branch and all four gates exited 0, so nothing in `CLAUDE.md` or `docs/` has broken a build that reads them. No page reads either file
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — **`CLAUDE.md` is a shared file in the sense that matters here — every session reads it — and the check is that it no longer contradicts `docs/release-procedure.md`.** It did: the runbook has always listed "Cut PR, gates, CI, merge" as Claude's while the merge train said "once the user says so". Both were re-read after the edit and now agree
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing to merge; the branch is at `origin/main`'s tip

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: this closes no backlog item. It is a decision taken in chat on 2026-10-13
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-13-release-prs-merge-without-asking.md`, which records the count that prompted it, what stays Lutan's, why it is safe, and the contradiction it resolves
- [x] `README.md` still accurate — no README statement is about who merges a release PR
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: nobody would notice. This changes how Claude and Lutan run a release between them. No shelter user can see any of these files, and nothing the app serves changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — **the central claim here is a count, and it is counted rather than estimated**: `0.28.0` asked Lutan for five interventions, enumerated one by one in the decision file against what actually happened in that release, with two identified as genuinely his. The claim that the two documents contradicted each other is quoted from both

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — this PR ships no build and is not part of a release
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — n/a: nothing is deployed by this PR. It will reach production incidentally, in whatever release next carries `main`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing to deploy; no file here is in the build
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: same reason
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — n/a: this PR derives no date
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock — n/a: no instant is derived
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — n/a: no date-derived behaviour
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named** — n/a: no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: nothing this PR touches reaches a public page

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: this PR runs no deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: this PR runs no deploy
- [x] Any new secret/env var exists in the production Cloudflare environment — n/a in effect: this PR adds no secret and no env var. The two **permission rules** it documents are Claude Code settings on Lutan's laptop, not application configuration, and nothing in the deployed system reads them

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration in this PR, and nothing here touches data
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations — **nothing to roll back in the running system**: reverting the commit restores the previous wording of both documents, and no deployed thing reads them. **What a revert does not cover: the two permission rules**, which are not in the repository. Undoing those means editing `C:\Users\Leidos\.claude\settings.json` by hand, and Claude cannot do it — the classifier refuses the edit as self-modification, which is how it was added in the first place

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
| 1 | **The next release actually costs two touches** — major-versus-minor, and the deploy command — and nothing else is asked of Lutan. This is the whole point of the change and it cannot be tested until `0.29.0` | the next release, and its record |
| 2 | The wording in `CLAUDE.md` reads to Lutan as what he decided, not as something broader | `CLAUDE.md` → "Release PRs merge without asking" |

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

Manual verification by: pending: row 1 cannot be checked before `0.29.0`; row 2 is Lutan reading the wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: the release manager wrote it

Result: pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The two permission rules cannot be added, read or reverted by Claude — the classifier refuses any access to `~/.claude/settings.json` as self-modification, including a plain read | accepted, and correct behaviour. Lutan added them by hand. Recorded here and in the decision file so a future session knows the rules exist, where they live, and that it cannot verify them by looking |
