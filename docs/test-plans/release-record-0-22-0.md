# Feature test plan — release-record-0-22-0

## Header

| | |
|---|---|
| Feature | The release record for `0.22.0`: a `## 0.22.0` section appended to `docs/releases/2026-10-08.md`, the day file `0.21.0` started that morning |
| Backlog item | none — step 8 of `docs/release-procedure.md` |
| Branch / worktree | `claude/record-0-22-0` @ `C:\Development\Animal_Shelter_record-0-22-0` |
| Dev server | not started — this PR adds a document |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `b0e03637` (`main` tip when the worktree was created) + this branch's commit. The **release** it records is `7b7341df` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one file, one appended section: what `0.22.0` contained, how it was deployed, what was verified, and what the record cannot say
- [x] Files/areas touched listed — `docs/releases/2026-10-08.md` only, plus this plan. No code, no schema, no configuration
- [x] Roles affected identified — none. The file is a repository document; no role reads it in the app
- [x] Anything explicitly **out of scope** written down — the nine `pending:` feature plans keep their own signatures and are **not** signed here; the record states them as a gap, which is not the same as closing them

**It appends rather than creating a file.** `0.22.0` shipped the same day as
`0.21.0`, so §8 of the procedure applies: add a `## <version>` section to the
existing day file. Sections run **oldest first**, matching 2026-10-02's file,
which holds four.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` minutes before writing, and `git status -sb` reported neither ahead nor behind. **Checked against the remote rather than a local ref**, because this release has already produced one stale-base error (`cut-release-0-22-0`, defect 3 in the record)
- [ ] `node scripts/gates.mjs` — n/a: no TypeScript, no build input, no lint surface. CI runs it regardless and is the check that matters
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — both, knowing `audit` and `test-plan` are `continue-on-error`
- [x] `node scripts/check-test-plan.mjs` — run on this plan before pushing, exit code read from the script rather than through a pipe
- [x] **The record's factual claims come from the tool output, not from memory** — every version string, SHA, Worker version ID, migration count, drift line and mail timestamp in the appended section was copied from the command that produced it during the release, and the figures were re-read rather than recalled while writing

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--env production --status` reviewed before applying — n/a: nothing to apply. The release's own apply is recorded in the section this PR adds
- [ ] `--env production --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no schema and no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: the release is already deployed; this PR records it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a document, with no runtime behaviour
- [ ] Data persists — n/a: no runtime data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | nothing in the app | the file is not served anywhere | n/a — no app surface |

- [ ] Every role above tested — n/a: `docs/` is not served by the app; no route renders this file
- [ ] A role that should not have access is blocked server-side — n/a: no access rule in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; a release record has no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — n/a in substance, but checked in form: the appended section is Markdown in a file nothing imports, and `grep -n "^## "` confirms the file now has exactly two sections, `0.21.0` at line 3 and `0.22.0` at line 253, with `0.21.0`'s content untouched
- [x] Any shared file touched checked from a second, unrelated place — `docs/releases/2026-10-08.md` is shared with `0.21.0`'s record. The append added lines only; `git diff` shows **0 deletions**, so the earlier section cannot have been altered
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `origin/main` directly

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: writing a release record is not a backlog item, and nothing in `docs/backlog.md` describes an outcome this PR closes. Checked by grepping the backlog for `release`, `record` and `handover` rather than assumed
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the record states decisions made during the release and the reasons for them; it does not make new ones
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** — n/a: nobody using the shelter app would notice a file in `docs/`. No line was added to `unreleased`, which is correct and is also the state `0.22.0`'s cut left it in
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the record's defect 1 in particular is written from the terminal output of the failed deploy (`⨯ Another next build process is already running`, `deploy: npm run opennext:build exited with 1`) rather than from an account of what probably happened

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR is not deployed. It documents a deploy that has already happened, at `7b7341df`
- [ ] Deployed SHA matches the tested SHA — n/a: nothing here is deployed

### On the deployed build

- [ ] Deployed to test — n/a: a document; `docs/` is not part of any build output
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test. The release it records **was** smoke-tested, and that pass is the content of the record
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime date derivation. The dates in the record are literals read from the clock and from tool output at the time
- [ ] **Boundary or banding change** — n/a: no threshold or rounding rule
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — and so is the evidence pasted into the record itself: the deploy block, the Pi block, the three cache fetches, both drift lines and the mail subject are copied verbatim
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: this PR changes no public page

### Deploy safety

- [ ] **The working tree is clean before deploying** — n/a: no deploy follows this PR
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy follows this PR. That line was read during the release and is quoted in the record
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy follows this PR
- [ ] `Server Actions key <fingerprint>` matches the Pi build — n/a: no deploy follows this PR. It matched during the release (`cbd55beae8d8`), quoted in the record
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none
- [ ] **The deploy prints a release mail, and the mail arrives** — n/a: no deploy follows this PR. The `0.22.0` mail was confirmed **in the inbox** at 10:45:48Z, not inferred from `sent 1`, and that is recorded

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, including what it does not cover — `git revert` of this commit. It removes a document and nothing else; no user-visible behaviour, no schema, no deployment artifact depends on it. **What a revert would not undo is the release it describes**, which is already live at `7b7341df` and already mailed — that is an argument for the record being accurate, not for it being reversible

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The record has to describe a failure this session caused — the build collision that killed the first production deploy | **written in rather than softened.** It is defect 1 of the record, named as the session's fault, with the cost stated. A record that reported the release as clean would be the more comfortable artifact and the less useful one |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the record matches what Lutan saw from his side — in particular that the failed first deploy and its cost are described as he experienced them | `docs/releases/2026-10-08.md`, the `## 0.22.0` section |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, and it is a read of the record rather than a check of behaviour

Manual verification by: pending: Lutan reading the `## 0.22.0` section, in particular whether the failed first deploy is described as he experienced it

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises it
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-08 — `0.22.0` is live at `7b7341df` on the production Pi and Worker and on test, three migrations applied with production reading no drift, and the admin mail confirmed in the inbox. Nine feature plans remain unsigned by Lutan's decision, and `0.20.0`'s Contacts pass is now carried for a third release
