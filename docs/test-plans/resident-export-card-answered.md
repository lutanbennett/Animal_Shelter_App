# Feature test plan

## Header

| | |
|---|---|
| Feature | Record Lutan's ruling that downloading the whole resident list needs no card of its own |
| Backlog item | `docs/backlog.md` → no item; this was an open question in `docs/card-access-faults.md`, not a backlog item (see §7) |
| Branch / worktree | `claude/resident-export-card-answered` @ `C:\Development\Animal_Shelter_resident-export-card-answered` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (not started — see §2) |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (Daily Planner session) / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | `f6a90912` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — n/a: documentation only, and per Lutan's standing instruction of 2026-10-28 all analysis is by card rather than role; the cards that reach the download are named in the decision file and none of them changes in this PR
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

**One sentence:** records his answer — the whole-list resident download needs no separate card
because the resident read already is the gate — in the fault log's decisions table, and corrects the
neighbouring paragraph that still said a question he had already answered was open.

**Files touched:** `docs/card-access-faults.md`, `docs/decisions/2026-10-28-resident-download-needs-no-card.md`,
`docs/test-plans/resident-export-card-answered.md`. **No `src/`, no `worker/`, no migration, no
shared lib.**

**Explicitly out of scope:** any change to who can download the resident list. His answer is that
the present behaviour is correct, so **nothing was built on purpose**. Narrowing the export would
mean giving the resident list a second, narrower activity, and he declined that.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 130s

gates: typecheck=0 lint=0 test=0 build=0
```

**Dev server deliberately not started.** There is no code in this PR for it to serve, so running one
would prove nothing. Ticking a browser check against a documentation change is the false-assurance
failure this checklist exists to prevent.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration and no query changed
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: nothing to apply; this PR is three documentation files

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no behaviour changed, so there is no path to walk
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface in this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface in this PR
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface in this PR
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input in this PR
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input in this PR

**What was verified instead, and it is the substance of this PR:** that the claim being written down
is true of the code. `src/app/residents/export/route.ts:29` was read directly and asks
`can(perms, "resident.record", "read")` and nothing else. That is a read, not a browser check, and
it is recorded as a read.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | unchanged | unchanged | not exercised — no code changed |
| management | unchanged | unchanged | not exercised — no code changed |
| staff | n/a — role retired by `0173` | n/a | n/a |
| doctor | unchanged | unchanged | not exercised — no code changed |
| volunteer | unchanged | unchanged | not exercised — no code changed |
| signed out | unchanged | unchanged | not exercised — no code changed |

- [ ] Every role above tested — n/a: no code path changed, so there is nothing a login could exercise differently before and after this PR
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: the server check is untouched; this PR records that it is correct, and deliberately does not weaken or re-test it

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added or changed
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a shelter worker does changes, so no manual topic is affected
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings in this PR
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface in this PR
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface in this PR
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI surface in this PR

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: the change is three markdown files; no page is near it
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched; `docs/card-access-faults.md` is a record, not a module, and nothing imports it
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: there is no backlog item for this; it was an open question inside `docs/card-access-faults.md`, and `grep` for a resident-download card item found none. Deliberately not filed as a new item either, because his answer closes it rather than opening work
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nothing a shelter user can see changes. No card gains or loses the download, no page changes, and no migration ships. This PR records a ruling that the existing behaviour is correct, so a note would describe a change that did not happen
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

**On that last line, because it is the whole point of this PR:** the claim written down is that the
export route asks only the resident read. That was established by reading `route.ts:29`, not by
reasoning from the fault log's description of it — which is the discipline the 2026-10-28 handover
asks for after five faults of the opposite shape.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date or time logic in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary, threshold or band in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only tool output quoted is the gates line in §2, pasted unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover**

**Rollback:** reverting this PR removes three documentation files and restores the fault log's
previous text. **It cannot break the running app**, because no code, schema or configuration ships
in it. What a revert *would* do is put back a paragraph saying a question he has answered is still
open, and lose the record of his ruling — so the risk of reverting is higher than the risk of
shipping.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `docs/card-access-faults.md` said *"not yet answered"* for the Add-medical-photos question, which Lutan had answered the same day and which was already built as migration `0279` | fixed in this PR — corrected in place rather than deleted, so the superseded text is visible |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | |

The change is three markdown files recording a decision Lutan made in chat and a code reading
anyone can repeat with one `sed`. **There is no surface for a person to look at**, and the one thing
a person might want to confirm — that his words are quoted correctly — is quoted verbatim in the
decision file for him to read in the PR itself.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: documentation only — no UI, no behaviour change, and nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing to deploy; this PR ships three documentation files and no code, schema or configuration

Result: pass

Release manager acknowledgement: n/a: no deployable change in this PR
