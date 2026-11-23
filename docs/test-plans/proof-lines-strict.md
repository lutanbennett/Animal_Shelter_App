# Feature test plan

---

## Header

| | |
|---|---|
| Feature | A missing `**Proof:**` line fails `check-backlog-waiting.mjs` instead of reporting |
| Backlog item | `docs/backlog.md` → `#prvln` (not ticked — see §7) |
| Branch / worktree | `claude/proof-lines-strict` @ `C:\Development\Animal_Shelter_proof-lines-strict` |
| Dev server | not started — no runtime surface; this is a repository check script |
| PR | filled in below once opened |
| Tested by / date | Claude (planner) / 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | `748671046` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one line in `scripts/check-backlog-waiting.mjs`: `PROOF_STRICT` now defaults on, so an item tagged `waiting:lutan` with no `**Proof:**` line fails (exit 3) instead of being reported.** `#prvln`'s `DONE WHEN` asks that *"no item CAN say a step is Lutan's without saying how to check it first"* — "can" is the word that needs a failure rather than a report
- [x] Files/areas touched listed — **exactly two: `scripts/check-backlog-waiting.mjs` (one constant plus its comment) and `docs/test-plans/proof-lines-strict.md` (this file).** No `src/`, no `worker/`, no migration, no workflow change
- [ ] Cards affected identified — `n/a: no card is read, written or checked; this is a repository check script that no login reaches`
- [x] Anything explicitly **out of scope** written down — **out of scope: the thirteen `**Proof:**` lines themselves**, which are backlog data and landed on the `backlog` branch as `898d42499` (the only branch allowed to change `docs/backlog.md`); **`#prvln`'s second half**, `/plan-day` running the proof lines, which is not built; **and adding this check to CI as a new step** — it already runs there inside `script-integrity`, unchanged by this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 39s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 150s
=== gates: test — npm test
=== gates: test exited 0 after 48s
=== gates: build — npm run build
=== gates: build exited 0 after 159s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change — `n/a: no migration; this script reads a markdown file, not a database`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated for the release manager — `n/a: no migration`

## 4. Functional checks

- [x] Happy path works end to end — **`node scripts/check-backlog-waiting.mjs` on the current tree exits 0: *"ok — 36 open items, each tagged and named"*.** Run before the flip with `BACKLOG_PROOF_STRICT=1` against `main`, and after the flip as the default
- [x] Data persists — **stands in as: the escape hatch still works.** `BACKLOG_PROOF_STRICT=0` returns the check to reporting and exits 0
- [x] Create / edit / delete all exercised — **stands in as the negative case, which is the one that matters: with one `**Proof:**` line removed the check exits 3 and prints `line 18 (#rqv5c): waiting:lutan with no "**Proof:** <how to check it is done>" line`.** The file was restored from a copy taken first and `git diff` confirms no residue. **A check only ever seen to pass has not been tested**
- [x] Empty state renders sensibly — **every `waiting:lutan` item carries a line, so the "nothing missing" state is the current one and is the exit-0 case above.** The script already refuses an empty item list (*"no open items found — that cannot be right"*), unchanged here
- [x] Invalid input is rejected with a readable message — **the failure names the line number and the item id**, which is what makes it actionable rather than just red
- [ ] Boundary cases checked — `n/a: there is no boundary; the condition is the presence or absence of one marker in a line`

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: a check script is not served by the app at any address |
| exactly `<card key>` | n/a | n/a | n/a: no card governs a repository script |
| signed out | n/a | n/a | n/a: the repository is public and this script has always been readable in it |

- [ ] Every login above tested — `n/a: nothing serves this script; it runs in a git hook and in CI, neither of which has a login`
- [ ] A login that should not have access is blocked server-side — `n/a: no server, no route, no login`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav entry; a check script appears in no screen`
- [ ] Manual updated — `n/a: the manual is for shelter users; this is a repository guard`
- [ ] Translatable strings go through the translation path — `n/a: the message is developer output, English only, and is never shown to a shelter user`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no rendered surface`
- [ ] Network clean — `n/a: the script makes no network call`

## 6. Regression

- [x] The pages nearest the change still work — **stands in as: every other thing this script asserts still passes.** The same run reports 36 open items each tagged and named, so the tag-shape, future-date, name-presence and duplicate-id checks are all still exercised and green
- [x] Any shared file touched checked from a second, unrelated page — **this script is run by `.githooks/pre-commit` and by CI's `script-integrity` job, and the hook is the second caller.** Exercised for real: the `backlog` commit `898d42499` went through that hook, and a *first* attempt was **refused** by the sibling `commit-msg` hook for not naming four items — so both hooks were seen working on a live commit rather than read
- [x] Nothing merged from `main` during `sync` was broken by this branch — **`sync` brought in four merged streams (#1849-#1852); this branch changes one constant in a script none of them touches**

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: #prvln is NOT closed by this PR. Its Done-when has a second half — /plan-day running the proof lines before it writes anything naming him — and only the existence half is built. Ticking it would claim the half that is not done`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: docs/decisions/2026-11-23-backlog-proof-lines-and-shelter-dates.md already records the design, from PR #1850; this PR flips the switch that file describes and the reasoning is in the code comment beside the constant`
- [x] `README.md` still accurate — **read: it does not describe this check's strictness**
- [ ] **Release notes.** — `n/a: a shelter user, an Admin and a product administrator see nothing. A check script that runs in a git hook and in CI reaches no screen, and this PR touches no src/, components, manual, i18n or worker path`
- [x] Commit messages say why, not just what — **the commit records the order the flip was made in and why that order mattered, and that the negative case was proved rather than assumed**
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — **both claims in the commit were run:** that strict passes on the populated tree (run with the environment variable against `main` before the default changed), and that it refuses a missing line (exit 3, item named, file restored). **Neither was inferred from reading the code**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `n/a: nothing to deploy. This script is never bundled, never served and never runs on the Pi or the Worker; it runs in a git hook and in CI only`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: no deployed surface`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `n/a: the shelter-day comparison this script uses was built and tested with injected instants in PR #1850, and this change does not touch it`
- [ ] **For a boundary or banding change, the assertions cover both edges** — `n/a: no boundary; the condition is the presence or absence of one marker`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — `n/a: nothing was deployed, so there is no deploy-time evidence. The two pasted artefacts, the gates block and the exit-3 message, are both unedited runs`
- [ ] Public pages re-checked after a cache purge — `n/a: no public surface`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `n/a: no deploy`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — `n/a: no deploy`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: BACKLOG_PROOF_STRICT is read only by this developer script in a git hook and in CI. It is deliberately NOT a runtime variable and is not registered in runtime-config.mjs`

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration`
- [ ] Apply plan stated — `n/a: no migration`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **two positions, and the cheap one needs no deploy: `BACKLOG_PROOF_STRICT=0` returns the check to reporting immediately, for one commit or for a shell. A `git revert` of this commit restores the previous default.** What a revert does **not** cover: the thirteen `**Proof:**` lines, which are on the `backlog` branch and are wanted either way — they are data, not a consequence of this switch, and nothing breaks if they stay while the switch is off

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **The check cannot tell a proof line that is honest from one that is a placeholder.** It asserts the marker exists, not that the command works or that anyone ran it. Five of the thirteen lines say in terms that they are *not* a command (hardware, a panel on his own network, a design session, two people using the manual) | **accepted, and said out loud rather than papered over.** `#prvln` explicitly rules those out of scope — *a physical wait "must not be made to look as if" it can be proved by a command* — so a marker-presence check is the honest limit of what is assertable here. Running the lines is `#prvln`'s unbuilt second half |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

*Empty on purpose: everything in this plan was run from a terminal, including the negative case. There is no screen, no deploy and no phone involved.*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — **the list is empty: there is no surface a person needs to look at**

Manual verification by: n/a: no screen, no deploy and no device — every check in this plan runs in a terminal

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — **nothing to hand over: no deploy, no migration, no runtime change, and no new runtime variable**

Result: pass with accepted defects

Release manager acknowledgement: n/a: a repository check script with no deployed surface
