# Feature test plan — release record and handover for `0.39.4`

## Header

| | |
|---|---|
| Feature | The `0.39.4` release record (`docs/releases/2026-10-23-0-39-4.md`) and the rewritten handover (`docs/release-handover.md`) |
| Backlog item | `docs/backlog.md` → none; the record and handover are `docs/release-procedure.md`'s own closing step, not a backlog item |
| Branch / worktree | `claude/record-0-39-4` @ `C:\Development\Animal_Shelter_vet-visit-booking-polish` — **the cut's own worktree, reused after its PR merged**, per paperwork rule 2 |
| Dev server | not started — no code in this PR |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | the record commit on this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two markdown files: the record of what `0.39.4` did, and the handover delta for the next release manager. No backlog item; this is the runbook's closing step
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two, both under `docs/`. No code, no route, no Worker, no migration, no shared lib
- [x] Roles affected identified — none. Neither file is served by the app; both are read by people in the repository
- [x] Anything explicitly **out of scope** written down — **the record does not re-verify the release.** The verification happened during the release and is cited; this PR records it. **The record and handover are one PR** (paperwork rule 3), and **the handover's PR merges without asking** alongside the record's, per `CLAUDE.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — the branch was created from `origin/main` at `e077f45b`, the release SHA, minutes after the cut merged
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — **n/a: a documents-only PR.** `scripts/check-docs-only.mjs` decides this and `ci.yml` gates every heavy job on it, so running four gates over two markdown files would burn ten minutes to compile code this PR does not touch. **This is the rule working, not a skipped check** — and per paperwork rule 1, the correct response to a heavy job running on a markdown diff is to look at the gate, not to touch code to make it run
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. `test-plan` is the one job expected to run

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration. `0249`/`0250` were applied during the release and are recorded in the document this PR adds
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or why one is not needed — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — both files render as GitHub markdown: headings nest, the tables have matching column counts, and the fenced block in the record closes. Checked by reading the rendered diff
- [x] Data persists — not applicable to a document in the usual sense; the standing-in check is that **every figure in the record is traceable to output quoted in it** rather than to memory. Spot-checked: `251 applied, 0 pending`, `99385`/`99095` bytes, `14` env vars, `cbd55beae8d8`/`ecc41837fc0b`, `f4714abf`, `e077f45b`, `376 unchanged, 0 updated, 8 created`
- [ ] Create / edit / delete all exercised — n/a: a record is written once; the handover is replaced wholesale each release
- [ ] Empty state renders sensibly — n/a: neither document has an empty state
- [x] Invalid input is rejected with a readable message, not a crash — the relevant guard is `check-test-plan.mjs`, which validates *this* file's shape and is run below
- [x] Boundary cases checked — **the handover's length limit is the boundary that matters**: `139` lines against a stated aim of ~100 and a hard limit of 150, measured with `wc -l` rather than estimated

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | neither file | no change — these are repository documents, not app pages | unchanged; this PR adds no page, route or permission |

- [ ] Every role above tested — n/a: no app surface in this PR
- [ ] A role that should not have access is blocked server-side — n/a: no app surface in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; a release record is not a manual topic
- [ ] Translatable strings go through the translation path — n/a: these are repository documents, English by design, as every previous record is
- [ ] Mobile viewport (375px) — n/a: no UI in this PR
- [ ] Browser console clean — n/a: no page was driven
- [ ] Network clean — n/a: no page was driven

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a consumer is the next release manager reading `release-handover.md`. **The rewrite was checked against its own purpose**: it is a delta, it corrects five claims from the previous edition by name, and it promotes nothing that `release-procedure.md` already holds
- [x] Any shared file touched — `docs/release-handover.md` is the one file every release rewrites. **Replaced wholesale, as intended**, and the two durable rules it used to carry stay in `release-procedure.md` rather than being copied back in
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is two documents beyond `e077f45b`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the record closes no backlog item. **The two items this release raised were filed on the `backlog` branch**, not here, which is where follow-ups belong
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no new decision was taken by this PR. **The release's own decisions are Lutan's and are recorded in the record**: minor over major, and deploying with the diets proportion change accepted. Neither is a design choice about the codebase
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — `n/a: two repository documents that no user can reach.` Nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched, so there is nothing a shelter user could notice
- [x] Commit messages say why, not just what — the record commit says what the release found and why the diets finding outranks the rest
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the figures are quoted from the tools that produced them. **Two claims are explicitly marked as NOT measured**: which production diets are out of proportion (unreadable — the scripts refuse non-dev projects) and why `check-diets-per-serving-schema.mjs` is red on dev (a plausible reading, left as plausible). **Saying "not established" is the point of this line**

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — this PR is written **after** the deploy and describes it; the release's own SHA, `e077f45b`, is in the record's header and was read from each of the four builds' output
- [x] Deployed SHA matches the tested SHA — **yes, on all four builds**, which is the line `0.39.3` had to answer "no" to. Read from each deploy's own output, not inferred

### On the deployed build

- [x] Deployed to test — done during the release; the record quotes the project ref and SHA from the log
- [x] Smoke-tested on `test.lannacare.org` — `{"version":"0.39.4","sha":"e077f45b…"}`, and the test Worker answers `0.39.4` too
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives "today". Both documents carry literal dates
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no band, threshold or rounding rule in this PR. The release's one real boundary — the mail decision — was checked both ways and is recorded in the cut plan
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the figures quoted in section 4 are verbatim
- [x] Public pages re-checked after a cache purge — done during the release: `purge-cache: purged everything`, then the byte-for-byte check from **each** Pi, exit 0 each

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `dbkodyyxxhtygxcxmfcu (e077f45b)`, read from Lutan's log **through PowerShell**, because `tee` wrote UTF-16 and every Bash `grep` of it returned nothing. Written up in the record as its own finding
- [x] `strip-baked-env: removed N env var(s)` seen in the deploy output — **14 on both environments**, same list
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none, and the release added none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [x] `--env production --dry-run` run and clean — done during the release, both files `ok`, before the apply
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **n/a, and read rather than assumed**: `0250` is additive, nothing dropped or rewritten. **That reading is what turned up the release's headline finding**, so the line earned its place
- [x] Apply plan stated — done and recorded: `0249` then `0250` to `dbkodyyxxhtygxcxmfcu`, before any deploy, `251 applied, 0 pending` afterwards

### Rollback

- [x] Rollback position stated, **including what it does not cover** — for this PR, reverting two documents has no runtime effect whatever. **For the release it describes**: `./scripts/pi/deploy-pi.sh --ref c0bdf272` on each Pi returns the served app to `0.39.3` and `npx wrangler rollback --env production` returns the Worker fallback; **neither reverts `0249` or `0250`, and neither undoes the diet amounts**, because the back-filled `qty_per_serving` stays. The real rollback for the diets change is per diet in Settings, which is also the forward fix

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The handover came in at **139 lines** against a stated aim of about 100 | **accepted.** Inside the 150-line limit, and the overage is the diets finding, which is the one thing the next release manager must not miss. Trimming it to hit a target would have cost the content the limit exists to protect |
| 2 | low | This PR describes a release whose one outstanding step belongs to Lutan, so the record is accurate only until he does it | **accepted and stated in the document**: the handover tells the next release manager to **ask him whether he has set the diets' *Servings by size***, rather than asserting either way |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing. Two repository documents with no surface a person needs to look at, and no app behaviour | — |

The release's **own** outstanding items are listed in the record and the handover.
They are not copied here: they belong to their own plans and their own signatures,
and copying them would give them a second home that nothing closes.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: a documents-only PR with no surface a person needs to look at

Manual verification by: n/a: a documents-only PR with no surface a person needs to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: this plan was written by the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-23
