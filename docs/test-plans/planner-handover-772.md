# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `772` |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping, not a backlog item (`CLAUDE.md`, "Every PR merges on green") |
| Branch / worktree | `claude/planner-handover-772` @ `C:\Development\Animal_Shelter_planner-handover-772` |
| Dev server | not started — no runtime surface in this change |
| PR | filled in below once opened |
| Tested by / date | Claude (planner) / 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | `a43c6e612` (the commit this plan is committed on top of) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one sentence: replaces `docs/planner-handover.md` with edition `772`, a delta covering thirteen merged planned streams.** No backlog item, by design: the handover covers only itself and `docs/release-handover.md`
- [x] Files/areas touched listed — **exactly two: `docs/planner-handover.md` (rewritten) and `docs/test-plans/planner-handover-772.md` (this file).** No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs
- [ ] Cards affected identified — `n/a: no card is read, written or checked; the file is a markdown document read by one planning chat and by no code`
- [x] Anything explicitly **out of scope** written down — **out of scope: `docs/release-handover.md` (the release manager's, and `check-release-handover.mjs` reports it current at `0.48.0`), `.plan-day.md` (gitignored, already updated in place), and the `plan-day` skill itself.** Edition `772` reports a defect in `plan-day/SKILL.md:251` and deliberately does **not** change it: that is a separate PR and a separate decision

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 41s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 133s
=== gates: test — npm test
=== gates: test exited 0 after 32s
=== gates: build — npm run build
=== gates: build exited 0 after 121s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change — `n/a: no migration, and no code reads this file`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated for the release manager — `n/a: no migration`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: a markdown document has no runtime path; what stands in for it is section 6's check that the document is complete and internally consistent`
- [ ] Data persists — `n/a: no data; the file is in git`
- [ ] Create / edit / delete all exercised — `n/a: no runtime surface`
- [ ] Empty state renders sensibly — `n/a: no runtime surface`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: the file is not served by the app at any address |
| exactly `<card key>` | n/a | n/a | n/a: no card governs a repository document |
| signed out | n/a | n/a | n/a: the repository is public and this file has always been readable in it |

- [ ] Every login above tested — `n/a: the document is not served by the app; it is read from the repository, which is public by design`
- [ ] A login that should not have access is blocked server-side — `n/a: nothing serves this file`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav entry; the handover is not linked from the app`
- [ ] Manual updated — `n/a: the manual is for shelter users; the handover is read by one planning chat`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing string; the document is English and internal`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no rendered surface`
- [ ] Network clean — `n/a: no rendered surface`

## 6. Regression

- [x] The pages nearest the change still work — **stands in as: every figure, PR number and claim in the document was read from its source, not from the previous edition or from `.plan-day.md` prose.** The thirteen `stream-usage:` comments were read with `gh pr view <n> --json comments`; the eight PRs not counted were each checked for the absence of such a comment rather than assumed; `#1832` and `#1835` were confirmed to share one branch; `plan-day/SKILL.md:251` was read before being cited; `#u2bo6`'s guard sentence was quoted from the item itself
- [x] Any shared file touched checked from a second, unrelated page — **`node scripts/check-release-handover.mjs` run: exits 0, reports the release handover current at `0.48.0`.** That is the one sibling instrument that reads a handover, and it was run rather than reasoned about
- [x] Nothing merged from `main` during `sync` was broken by this branch — **the sync pulled five streams' work including `docs/decisions/2026-11-23-reels-batch-upload.md`; this branch touches neither `src/` nor any file they touched.** The sync is in fact what revealed #1846 had merged, which corrected this document from twelve streams to thirteen

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: the handover has no backlog item, and this branch deliberately touches no backlog file`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: the handover IS the record; a decision file about writing one would duplicate it. The two process rules it earns are stated in it and will be carried into the skill by a separate PR`
- [x] `README.md` still accurate — **read: it does not describe the handover's contents or its edition number, so an edition change cannot stale it**
- [ ] **Release notes.** — `n/a: a shelter user, an Admin and a product administrator see nothing; this file is not served by the app, appears in no screen, and this PR touches no src/, components, manual, i18n or worker path`
- [x] Commit messages say why, not just what — **the commit explains why the edition is overdue and what the day's lesson was, rather than "update handover"**
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — **the two riskiest claims in the document were each checked against a primary source rather than inferred:** that `#u2bo6`'s deploy is done (quoted from the item's own 2026-11-06 block, not from either session's summary), and that eight PRs are not plan-created streams (each queried for a `stream-usage:` comment). **The claim about `#rlbat`'s two answers is stated as two sourced quotations with the conclusion left to Lutan**, because the planner cannot know which he meant

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `deferred: release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: release manager`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `n/a: this change derives no date and runs no code. The document DISCUSSES a UTC-versus-local defect (#utcds) but introduces none`
- [ ] **For a boundary or banding change, the assertions cover both edges** — `n/a: the bands in this document are recorded forecasts, not code; nothing branches on them`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — `n/a: nothing was deployed, so there is no deploy-time evidence to paste. The one pasted artefact in this plan is section 2 gates block, which is the unedited run`
- [ ] Public pages re-checked after a cache purge — `deferred: release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `deferred: release manager`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — `deferred: release manager`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: this change adds no secret and no environment variable`

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — `n/a: no migration and no code`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration`
- [ ] Apply plan stated — `n/a: no migration`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this one commit restores edition `771`, and that is complete: the file is read by a planning chat and by `check-release-handover.mjs`'s sibling only, with no deployed state, no schema and no cached artefact behind it.** What a revert does **not** cover: the `.plan-day.md` updates made in the planning session (gitignored, not in this PR) and the four `backlog` branch commits of the day, which are independent of this file

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **This edition is 285 lines against the ~150-line target** Lutan set on 2026-10-20. It covers thirteen streams rather than nine and carries a thirteen-row figures table and two process findings | **accepted, and stated rather than trimmed.** Cutting substance to reach a line count would defeat the target's purpose. **For a future editor: the first section to cut is the figures table, which `.plan-day.md` also holds** |
| 2 | high | **`#rlbat` shipped the metadata option Lutan gave its stream, not the one he gave the planner** — "Blank, edit later" against "Per clip after upload". Already merged as #1846 | **reported, not fixed.** Recorded in the handover with both quotations and their sources; **it is his choice, and the handover says not to rebuild it on a guess.** Raised with him directly in the planning chat |
| 3 | medium | **A brief patched after its session opened reached nobody.** The planner answered his choice into `#rlbat`'s brief, verified the file, and the session was already running from the earlier text. The stale `band=175-205k` in the usage comment is the only visible trace | **fixed as a rule, in the handover:** once a session may have opened, a brief is frozen — send the correction to the session or do not make it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Which `#rlbat` metadata behaviour he wants kept** — what shipped (each clip a reel with today's date, described later in the library) or what he told the planner (a per-clip list inside the upload flow). **Needs him, not a reviewer** | the planning chat; `docs/decisions/2026-11-23-reels-batch-upload.md` records what shipped |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — `pending: Lutan's choice on #rlbat's metadata behaviour (row 1 above)`

Manual verification by: pending: Lutan's choice on #rlbat's metadata behaviour

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — **nothing to hand over: no deploy, no migration, no runtime change.** Section 8's deploy rows are `deferred:` to them as the template requires, and none of them is reachable by this change

Result: pass with accepted defects

Release manager acknowledgement: n/a: a documentation-only change with no deployed surface
