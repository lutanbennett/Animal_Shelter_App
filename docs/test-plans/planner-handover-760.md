# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover edition `760` |
| Backlog item | `docs/backlog.md` → none; the handover is process bookkeeping, not a backlog item |
| Branch / worktree | `claude/planner-handover-760` @ `C:\Development\Animal_Shelter_planner-handover-760` |
| Dev server | not started — no runtime surface in this PR |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner session) / 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | `32c8fe566` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` as edition `760`; it has no backlog item by design, and `SKILL.md` requires it at the setup of a plan's last batch
- [x] Files/areas touched listed — exactly one: `docs/planner-handover.md`. No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, and **no `.claude/skills/` this time** (edition `759` carried a `brief-blocks.md` correction; this one does not)
- [x] Cards affected identified — **none.** The file is not read at runtime by any card-governed surface; it is read by a Claude session
- [x] Anything explicitly **out of scope** written down — the **fifth** plan's three figures (#1676, #1677, #1678) are deliberately **not** this edition's; they were read only because the pre-clearing check requires one read per merged PR, are recorded in the gitignored `.plan-day.md`, and belong to edition `761`. Also out of scope: `docs/release-handover.md`, untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. The worktree was created from `origin/main` minutes before this commit, after the fifth plan's three PRs and the `backlog` merge had landed, so it was already current
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 79s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 186s
=== gates: test — npm test
=== gates: test exited 0 after 43s
=== gates: build — npm run build
=== gates: build stopped on Next's SecurityFatalError advisory halt; re-running build once now, while its five-minute receipt is fresh
=== gates: build exited 0 after 208s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly after the change — `n/a: no migration in this PR`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`

## 4. Functional checks

- [x] Happy path works end to end — the happy path for a handover is that the next planner session can act on it: the file is valid Markdown, 235 lines, opens with its edition number and date, and its "FOR YOUR FIRST TURN" list names the three slugs a successor must check and tells it to check them against `origin/main` rather than trusting `gh`
- [ ] Data persists — reload the page and the change is still there — `n/a: no page; this is one Markdown file`
- [ ] Create / edit / delete all exercised — `n/a: no CRUD surface in this PR`
- [ ] Empty state renders sensibly — `n/a: no rendered surface in this PR`
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: no input surface in this PR`
- [x] Boundary cases checked — every figure in the edition was read from a `stream-usage:` comment rather than estimated, and each floor is `tokens − messages` arithmetic on the same comment. **The two figures that could mislead are stated as such:** #1671's comment quotes a pre-widening band, and #1673 sits below the range the previous edition claimed, with its reason given rather than smoothed over

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this PR | no runtime surface exists | n/a |
| exactly `<card key>` | nothing in this PR | no runtime surface exists | n/a |
| signed out | nothing in this PR | no runtime surface exists | n/a |

- [ ] Every login above tested — `n/a: this PR adds no route, action, RPC or control; the file is read by a Claude session, not by the app`
- [ ] A login that should not have access is blocked server-side — `n/a: no server surface in this PR`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: no nav change; src/ untouched`
- [ ] Manual updated (`src/lib/manual/en.ts`) — `n/a: no user-facing behaviour; the manual is for shelter staff and this is planner bookkeeping`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings; this is an internal English document`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface in this PR`
- [x] Browser console clean — `n/a: no browser surface was loaded` — recorded against the honest reason rather than left blank; no dev server was started for this PR
- [ ] Network clean — `n/a: no pages in this PR`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: there are no pages near the change` — the only consumer is a Claude session reading the file, and the four gates below cover everything executable
- [x] Any shared file touched checked from a second, unrelated page — **no shared file is touched this time**, which is itself the check worth recording: edition `759` modified `.claude/skills/plan-day/brief-blocks.md`, a file assembled into every `.brief.md`, and that needed verifying by reading the block back. **This PR changes one document that nothing assembles**, so there is no second consumer to load
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch changes no executable code; `main` moved only by the fifth plan's three merges and the `backlog` merge, all of which this branch was cut after

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: the handover has no backlog item; it is written at the setup of a plan's last batch, per the /plan-day skill`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: no design choice is made here`; the edition's judgements are its content, and the one scope decision about this PR is in the PR body
- [x] `README.md` still accurate — unaffected; it does not reference this file
- [ ] **Release notes.** — `n/a: a shelter user would notice nothing; the file is read only by a Claude session, and this PR touches no src/, worker/, manual or i18n path`
- [x] Commit messages say why, not just what — the commit message leads with the omission the edition owns and the general lesson it draws
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure was read from a merged PR's `stream-usage:` comment. **The three claims in the edition that are NOT measurements are labelled as such:** that the discount is unproven above 250k, that the paper is stale on one fact (which rests on Lutan's own answer), and that `#calsh` leaks nothing today (which rests on shelter #2 not existing). **And one claim was corrected before it shipped:** the edition states that #1678 posted a correct usage comment *and* vaguer prose, having first written into three briefs that it posted prose instead — the comments were read and the claim fixed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `deferred: release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: release manager`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `deferred: release manager`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — `deferred: release manager`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — `deferred: release manager`
- [ ] Public pages re-checked after a cache purge — `deferred: release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `deferred: release manager`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — `deferred: release manager`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `deferred: release manager`

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration in this PR`
- [ ] Apply plan stated — `n/a: no migration in this PR`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this commit restores edition `759`. **What that does NOT cover:** `.plan-day.md` is gitignored and would keep both of today's figure tables, so a revert would leave `main` reading an edition that says it owes figures the saved plan already holds. Nothing executable and no schema is involved, so there is no deploy or migration component to roll back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The fifth plan was set up, merged and cleared with no handover written, against `SKILL.md`'s one-plan-one-handover rule | fixed — `760` covers that plan as well as being written at the sixth plan's setup, and says so in its opening lines rather than leaving the edition numbers to imply it |
| 2 | low | Three of today's briefs asserted that PR #1678 "wrote prose instead" of a usage comment; it had in fact posted a correct comment and *also* written loose prose | fixed — all three briefs corrected before their sessions opened, and the accurate rule recorded in each |
| 3 | low | Edition `760` is 235 lines against the skill's ~150-line target | accepted — declared in the PR body; `759` was 233 and `758` 209. Two plans completed in one day with a cross-tenant leak, a held measurement and a closed decision; trimming substance to hit a soft target was the worse trade, and a release cut found in flight mid-write added a section that changes the edition's production facts |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

Empty. There is no surface a person needs to look at: the file is read by a Claude
session, and whether edition `760` is *useful* is judged by its successor reading
it, which is the delta model's own mechanism rather than a verification step.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-18

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no surface a person needs to look at; the file is read by a Claude session

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — `n/a` in substance: this PR carries no deploy, so section 8 is `deferred: release manager` throughout

Result: pass

Release manager acknowledgement: pending: this PR carries no deploy; nothing is held on it
