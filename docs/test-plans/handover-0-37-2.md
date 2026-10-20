# Feature test plan — handover-0-37-2

## Header

| | |
|---|---|
| Feature | Rewrite `docs/release-handover.md` for the release after `0.37.2`: retire what `0.37.2` fixed, correct three statements the previous edition got wrong, and name the permission gate that actually bit |
| Backlog item | `docs/backlog.md` → none — the handover is rewritten every release by standing instruction, not from a backlog item |
| Branch / worktree | `claude/handover-0-37-2` @ `C:\Development\Animal_Shelter_handover-0-37-2` |
| PR | **#761 — a guess at the time of writing, to be re-read with `gh pr view` after opening** |
| Dev server | not driven — documentation only |
| Tested by / date | Claude (production release manager session) / 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

**Not a gate.** `0.37.2` is deployed, verified and recorded. This rewrites the
file the *next* release manager reads first.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — replace the `0.37.1` edition of `docs/release-handover.md` with the `0.37.2` one, and add this plan
- [x] Files/areas touched listed — `docs/release-handover.md` and this plan. **No code, no schema, no configuration.** Nothing here can change what runs
- [x] Roles affected identified — none. `docs/` is not served to anyone
- [x] Anything explicitly **out of scope** written down — three things. (a) **`docs/release-procedure.md` is not touched**: the runbook outranks the handover and nothing this release found contradicts it. (b) **The two open backlog items are not actioned here** — the `0227` check and its fix are recorded in the handover's *In flight*, not solved. (c) **The previous edition is replaced wholesale, not amended.** That is what "rewritten each release" means, and keeping a diff-friendly structure would make the file grow without bound

### The risk this file carries, stated plainly

**A handover is read as authoritative by the next release manager and is the one
document nothing checks.** No gate reads it; `check-test-plan.mjs` does not know
it exists. Its failure mode is not a red check but a session confidently acting
on something that stopped being true. **`0.37.2` demonstrated exactly that**: it
inherited `0224`'s card check as open when Lutan had closed it, and nearly asked
him twice.

So the rewrite is held to two rules, both verifiable and both checked below:

1. **Every retirement is backed by something this release observed**, not by belief that a fix shipped.
2. **Every open item names where its live state is kept** — `docs/backlog.md` — rather than asserting the state itself.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at the tip after `0.37.2`'s record and the backlog fold merged
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — output pasted below, unedited. A docs-only diff cannot change the result, but the gate was run rather than assumed

```
=== gates: build exited 0 after 161s

gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — `n/a: not yet at this commit — no PR exists until this plan is committed.` Written and committed **before** the PR opens, so the first run is green by construction; the run's `headSha` is then matched against this branch's HEAD and this line ticked
- [x] `node scripts/check-release-guards.mjs` — `n/a` as a release gate; `src/lib/releases.ts` is untouched by this PR

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.`

- [ ] Migration number is one above the highest on `main` — `n/a: no migration.` The handover records the next free number as **`0230`**, read from the tree
- [ ] `--status` reviewed before applying — `n/a: no migration.` The figures quoted in the handover (production `230 applied, 0 pending`; dev `230 of 230, No drift`) were read during `0.37.2`, and **the handover tells the reader to run both themselves rather than trust the table**
- [ ] `--dry-run` reviewed — `n/a: no migration`
- [ ] Applied to dev and recorded in `schema_migrations` — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly — `n/a: no migration`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed — `n/a: no migration`
- [ ] Production apply plan stated — `n/a: no migration`

## 4. Functional checks

A handover has no runtime behaviour. What it has instead is **claims**, and those
are what this section checks.

- [x] Happy path works end to end — the document renders as Markdown, its tables parse, and **both of its internal section references resolve to headings that exist**: *THE ONE THING* → line 41, *THE SECOND THING* → line 71, checked by listing the headings rather than by eye. (*In flight* is referenced from this plan, not from inside the handover; that heading exists too, at line 202)
- [x] Data persists — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: no such surface`
- [x] Empty state renders sensibly — the nearest equivalent is the *In flight* section, which this release could have left empty. **It is not empty and must not be**: it carries the one genuinely open item
- [x] Invalid input is rejected with a readable message — `n/a: no input path`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — **the boundary that matters here is factual, and every retirement was checked against this release's own evidence rather than against the belief that a fix shipped:**
  - *The Pi no longer lies* — from the production log: `restarting under the script from 3e94268e`, `serving 0.37.2 as expected`, no banner, and `check-assets: ok … identical to the build` as the last step
  - *The purge is yours* — `purge-cache.mjs --env production` printed `purged everything for lannacare.org (zone c596f1fe…)`
  - *13 on both environments* — both deploy logs grepped; `SCRATCH_RESTORE_DB_URL` in neither list
  - *`0224` is closed* — the tick read in `docs/backlog.md`, quoted verbatim
  - *The gate refuses twice* — observed, with the test Pi going through seconds later from the same session, which is what makes the "test Pi is not refused" claim a diagnostic rather than a guess
  - *Only one pg_cron job* — `grep -r "cron.schedule" supabase/migrations/` returns exactly one file
- [x] **Every number in the file came from a tool, and the ones that go stale say so** — the cache sizes, free disk, compile times, migration counts, key fingerprints and PR numbers are all as printed. The database rows and the worktree list carry explicit *run it yourself* instructions, because they are the rows most likely to be wrong by the time anyone reads them

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | nothing | `docs/` is not served to anyone | unchanged; no route, component or policy touched |

- [x] Every role above tested — `n/a: nothing in this PR is reachable by any role`
- [x] A role that should not have access is blocked server-side — `n/a: nothing is served`

## 5. Cross-cutting

- [x] Nav entry correct — `n/a: not touched`
- [x] Manual updated and the topic reads correctly at `/manual` — `n/a: not touched.` The handover is for release managers, not shelter users
- [x] Translatable strings go through the translation path — `n/a: none added`
- [x] Mobile viewport (375px) — `n/a: no markup or styles`
- [x] Browser console clean — `n/a: nothing executes`
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: there are none.` No script reads `docs/release-handover.md`; it is read by people
- [x] Any shared file touched checked from a second, unrelated page — `n/a: no shared file touched.` **The one coupling that matters is documentary and was checked by reading**: the handover must not contradict `docs/release-procedure.md`, and on the one point where a previous edition did (the record PR being a gate) they agree
- [x] Nothing merged from `main` during `sync` was broken by this branch — the suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: this closes no backlog item.` **The three follow-ups `0.37.2` produced were put on the `backlog` branch**, not here: the `0227` check, the retention-reporting fix, and the two small defects
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: this PR decides nothing new.` The one judgement in it — that the permission gate rather than any software fault is the thing most likely to bite next — is argued in the file itself
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: an internal document for whoever runs the next release; no shelter user could notice it, and src/lib/releases.ts is untouched by this PR`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the handover were measured, not reasoned** — see §4's boundary list, where each retirement is tied to the output that justifies it. **Where something is not known, the file says so**: `0227`'s job is written as unverified, and the 4-byte and `x-lanna-cache` oddities are written as unexplained rather than attributed to a cause

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `n/a: this PR ships after the release it describes.` The release SHA it documents, `3e94268e`, is live on all four builds
- [x] Deployed SHA matches the tested SHA — verified during `0.37.2`: both hosts answer `0.37.2` @ `3e94268e`

### On the deployed build

- [x] Deployed to test — `n/a for this PR`; recorded for the release, test Pi and test Worker both `0.37.2` @ `3e94268e`
- [x] Smoke-tested on `test.lannacare.org` — `n/a for this PR`; the filled pass is in `docs/releases/2026-10-20.md`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today".` The dates in it are literals
- [ ] **For a boundary or banding change, both edges covered.** `n/a: no boundary change in this diff`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked, and this PR changes nothing served.` The release's own purge ran and was verified
- [x] **The file's own claims were re-checked against the backlog before it shipped** — the specific failure this edition exists to stop. `0224` confirmed closed; the `0227` items confirmed present on the `backlog` branch; the vet-calendar answer confirmed as Lutan's 2026-10-19 wording

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref matches production — `n/a for this PR`; recorded for the release as `dbkodyyxxhtygxcxmfcu (3e94268e)`
- [x] `strip-baked-env: removed N env var(s)` seen — `n/a for this PR`; **13 on both environments**, which is one of the three corrections this file carries
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`
- [x] **The release mail MUST NOT have gone out** — `n/a for this PR`; confirmed on both of the release's logs
- [x] Nothing in this PR can affect a deploy — **asserted, not assumed**: the diff touches two Markdown files under `docs/`, and no script, workflow or build step reads either

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither
- [x] `--env production --dry-run` run and clean — `n/a for this PR`; the release's three were `ok` with no warnings
- [x] For a **destructive or rewriting** migration only — `n/a: no migration in this PR`
- [x] Apply plan stated — `n/a: no migration in this PR`; the release's apply is complete

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this commit restores the `0.37.1` edition. **What that would not cover is the point of the file**: the previous edition contains three statements this release disproved, so a rollback would reinstate guidance that is wrong — telling the next manager to distrust a Pi banner that is now honest, to hand the purge to Lutan when the token exists, and to expect an env-var asymmetry that is gone. **A revert here is a documentation regression, not a safe default**, and anyone doing it should take the corrections across by hand

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | Medium (process, caught before it cost anything) | **The previous handover's open-items list was stale, and the staleness propagated.** It listed `0224`'s card check as outstanding when Lutan had closed it on 2026-10-19 and the tick was in `docs/backlog.md`. The claim was carried into `0.37.2`'s opening message and its cut test plan before being caught — not by a gate, because none reads this file, but by reading the backlog for an unrelated reason | **Fixed in two places.** The claim is corrected in `docs/releases/2026-10-20.md` and the item is retired in this handover with Lutan's words quoted. **Structurally**, *THE SECOND THING* now instructs the next manager to grep `docs/backlog.md` before repeating **any** open item from the file, including this edition's, and the opening-message recipe carries the same instruction at the point of use |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | — | — |

`n/a: there is nothing in this PR for a person to look at beyond reviewing the
wording.` Its factual claims are each tied to a tool's output in §4, and the one
genuinely unverified thing in the release — `0227`'s job — is recorded in the
handover as unverified and carried on the `backlog` branch, where it has an
owner. **It is deliberately not listed here**, because the runbook is explicit
that another item's outstanding work must not be given a second home in a plan
that cannot close it.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [ ] The manual list above is for a person to look at — n/a: the list is empty, for the reason given above

Manual verification by: n/a: documentation of a release that has already shipped and been verified; nothing to look at beyond the wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass
