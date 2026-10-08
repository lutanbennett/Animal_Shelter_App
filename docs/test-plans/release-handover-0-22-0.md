# Feature test plan — release-handover-0-22-0

## Header

| | |
|---|---|
| Feature | Rewrite `docs/release-handover.md` for whoever runs the release after `0.22.0`, including a new **timings** section measured during this release |
| Backlog item | none — the handover is rewritten each release by the release manager |
| Branch / worktree | `claude/release-handover-0-22-0` @ `C:\Development\Animal_Shelter_release-handover-0-22-0` |
| Dev server | not started — this PR rewrites a document |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `98afdbd0` (`main` tip when the worktree was created) + this branch's commit. The release it hands over from is `7b7341df` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one file replaced in full: `0.21.0`'s handover becomes `0.22.0`'s, plus a timings section Lutan asked for by name
- [x] Files/areas touched listed — `docs/release-handover.md` only, plus this plan. No code, no schema, no configuration
- [x] Roles affected identified — none. No role reads this file in the app
- [x] Anything explicitly **out of scope** written down — the nine `pending:` plans are listed as outstanding, not signed; and the file does not restate the runbook, which outranks it

**It replaces rather than appends.** The file says of itself that it is rewritten
each release and is deliberately short-lived, and the previous copy was already
wrong in its first table — it named `0.21.0` as live everywhere and `#456` as the
open PR, both superseded within the day.

**Risk if this is wrong is real but bounded:** a release manager who trusts a
stale handover starts from the wrong picture. That is why the file's own header
tells the reader it is outranked by the runbook and the release record, and why
every figure in it was re-read from a command during this release rather than
recalled.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` minutes before writing. **Base confirmed against the remote**, not a local ref — this release already produced one stale-base error, which is lesson 4 in the file itself
- [ ] `node scripts/gates.mjs` — n/a: no TypeScript, no build input, no lint surface. CI runs it regardless and is the check that matters
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — both, knowing `audit` and `test-plan` are `continue-on-error`
- [x] `node scripts/check-test-plan.mjs` — run on this plan before pushing, exit code read from the script rather than through a pipe
- [x] **Every figure in the file was measured, not recalled** — the state table from `git`, `gh pr list` and two `--drift` runs re-read at writing time; the timings from artefact timestamps, `gh run view` durations and the `gates.mjs` output of this release. The one figure that could not be measured precisely — the exact minute the failed deploy began — is **not** stated; the file says only that the test build was still running, which is what the terminal output proves

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `node scripts/apply-migrations.mjs --env production --status` reviewed — not to apply anything, but because the file states production's position: `164 applied, 1 pending (0165_audit_facility_maps.sql)`, read at writing time rather than carried over
- [ ] `--env production --dry-run` reviewed — n/a: this PR applies nothing
- [x] Applied to **dev** and recorded in `schema_migrations` — n/a for this PR, but checked for the file's claim: dev holds `165` and reads `No drift`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no schema and no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — yes, as item 3 of "What the next release will need": apply `0165`, which is why production currently reports drift

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
| every role | nothing in the app | `docs/` is not served | n/a — no app surface |

- [ ] Every role above tested — n/a: no route renders this file
- [ ] A role that should not have access is blocked server-side — n/a: no access rule in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; the handover is an internal process document with no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — n/a in substance; checked in form: the file is Markdown that nothing imports, and the headings it must carry for a reader to navigate it (`Where things stand`, `In flight`, `Outstanding verification`, `Lessons`, `What the next release will need`, `Who does what`) are all present, plus the new timings section
- [x] Any shared file touched checked from a second, unrelated place — `docs/release-handover.md` is read by the next release manager and by nothing else. **Its cross-references were followed rather than assumed**: `docs/releases/2026-10-08.md` does hold two sections with `## 0.22.0` second; `cut-release-0-20-0.md`, `facility-map-upload.md`, `website-content-grant.md` and `shelter-operations-nav.md` all exist under `docs/test-plans/`
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `origin/main` directly

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: rewriting the handover is a release step, not a backlog item, and nothing in the backlog describes an outcome this PR closes
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the file records lessons from a release that has already happened; it makes no new design decision. The decisions `0.22.0` *did* make are in its release record
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** — n/a: nobody using the shelter app would notice a file in `docs/`. No line was added to `unreleased`
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — see §2. In particular the timings table is measurements, and the one timing that could not be measured precisely is omitted rather than estimated

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR is not deployed
- [ ] Deployed SHA matches the tested SHA — n/a: nothing here is deployed

### On the deployed build

- [ ] Deployed to test — n/a: a document; `docs/` is not part of any build output
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime date derivation. The clock times in the timings section are local (SEAST) artefact timestamps and CI durations, used as **durations**, which no timezone changes
- [ ] **Boundary or banding change** — n/a: no threshold or rounding rule
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — and so is the one quoted failure in the file: `⨯ Another next build process is already running`, copied from the terminal
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: this PR changes no public page

### Deploy safety

- [ ] **The working tree is clean before deploying** — n/a: no deploy follows this PR
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy follows this PR
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy follows this PR
- [ ] `Server Actions key <fingerprint>` matches the Pi build — n/a: no deploy follows this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none
- [ ] **The deploy prints a release mail, and the mail arrives** — n/a: no deploy follows this PR

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR. The *next release's* apply plan for `0165` is stated in the file, which is the point of the file

### Rollback

- [x] Rollback position stated, including what it does not cover — `git revert` of this commit, which restores `0.21.0`'s handover. **That is worse than having no handover**, since the restored file states `0.21.0` is live everywhere, which is false. If this file is wrong the fix is to correct it, not to revert it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The file this PR replaces was stale within hours of being written — it named `0.21.0` as live and `#456` as the open PR, both superseded the same day | **inherent to the file's purpose, not fixable.** It is why the header tells the reader the runbook and the release record outrank it, and why this rewrite leads with a dated state table rather than prose |
| 2 | low | The exact minute the failed production deploy started could not be established from the artefacts | **omitted rather than estimated.** The file states only what the terminal output proves — that the test build was still running when the production deploy began |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the timings match Lutan's experience of the release, particularly the ~13 minutes for a Worker deploy and the ~75 minutes end to end | `docs/release-handover.md`, "How long each step actually takes" |
| 2 | That the handover reads usefully to someone starting cold on the next release — it is written for a reader who has not seen this session | `docs/release-handover.md`, start to finish |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's, and both are reads of the document rather than checks of behaviour

Manual verification by: pending: Lutan confirming the timings match his experience, and that the handover reads usefully cold

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises it
- [ ] Handed to the production release manager — n/a: this session is the release manager, and this file *is* the handover

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-08 — the handover is rewritten from `0.22.0`'s state, re-read at writing time rather than carried over, and carries a timings section Lutan asked for because this release's one real failure was a timing mistake rather than a technical one
