# Feature test plan — `0.40.0`: the production sign-in checks are done

## Header

| | |
|---|---|
| Feature | Record that Lutan completed all ten production sign-in checks, closing the `0.40.0` checklist, and update the handover for the changeover |
| Backlog item | `docs/backlog.md` → none; keeping the record and handover true is `docs/release-procedure.md` paperwork rule 4 |
| Branch / worktree | `claude/handover-0-40-0-signins` @ `C:\Development\Animal_Shelter_cut-release-0-40-0` — the release's own worktree, reused per paperwork rule 2. **Its folder name does not match its branch**, so cleanup by name will miss it, and `worktree.mjs done` must never be `--force`d against it |
| Dev server | not started; this PR changes two documents and no page |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-24 |
| Carries a migration? | no |
| Tested at SHA | `388a98ef` |

**Not a gate.** `0.40.0` shipped, was verified and has been recorded. This closes the last ten
checklist lines with the only signature that could close them — his — and leaves the handover
correct for whoever picks it up next.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the ten `pending: Lutan` lines in the `0.40.0` record become ticked and attributed to him, the summary line stops saying ten are pending, and the handover's START HERE and open list are brought in line; no backlog item, this is rule 4
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly three, all documentation: `docs/releases/2026-10-24-0-40-0.md`, `docs/release-handover.md` and this plan. **No code of any kind**
- [x] Roles affected identified — **none.** Nothing here is reachable by any role; `docs/` is not served
- [x] Anything explicitly **out of scope** written down — **the two items that remain his are not touched**: the Thai wording of the Units screen and booking a real vet visit on production. Neither was claimed, and neither is implied by "sign ins done"

### The scope of his words was confirmed before anything was ticked

**This is the substance of the PR, not a procedural note.** He wrote *"sign ins done"*. The
record's list has **ten** lines, of which exactly **two** are sign-in lines (Google, and email and
password). "Sign ins done" could honestly mean either, and the two readings differ by eight
ticks against someone else's name.

`CLAUDE.md` is explicit: *Manual verification* is signed **only by the person who looked**, and
**a signature that does not correspond to someone having looked is worse than none** — it turns
an unknown into a false assurance, and it is the first artifact anyone reaches for when
something has gone wrong. So he was asked which he meant, and answered **all ten**. **Ticked on
that answer, and the record says so.** Had the question not been asked, the likely outcome was
eight false ticks in permanent git history.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `388a98ef` minutes before the edit. **The reuse check was run**, since this is a reused worktree: `require('next/package.json').version` reads **16.4.2** against `package.json`'s **16.4.2**
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — see below, unedited, all four numbers read
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 7s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 71s
=== gates: test — npm test
=== gates: test exited 0 after 15s
=== gates: build — npm run build
=== gates: build exited 0 after 60s
gates: typecheck=0 lint=0 test=0 build=0
```

**The handover trim (159 lines to 146) landed after this run started**, which is markdown only. Said plainly because a documents-only PR skips the heavy CI jobs, so these local gates are the only ones that run and there is no second pass to catch a late edit. Established on an earlier release rather than assumed here: no gate parses `release-handover.md` or the release records.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. Next free is `0254`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a for this PR; recorded for the release: production **254 of 254**, `No drift`
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — the edit's job is to be true and complete. **Both halves were verified mechanically rather than read over**: the ticking script refused unless it matched **exactly ten** lines (`expected to tick exactly 10 lines`), matching on the unticked box **and** the `pending: Lutan` marker so no unrelated line could be caught; and afterwards `grep -c "pending: Lutan"` on the record returns **0**
- [x] Data persists — n/a in the UI sense; the standing-in check is that both edits are in the diff and committed
- [ ] Create / edit / delete all exercised — n/a: a record is appended to and corrected, never deleted; the handover is rewritten each release
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash — the ticking script **throws before writing a byte** if the count is not ten or the summary line is missing, so a partial tick is impossible. `check-test-plan.mjs` validates this plan and exits 0
- [x] Boundary cases checked — the handover's **line ceiling**, and it was breached again and caught again: **159 lines** after writing the closure in, over rule 4's 150, trimmed to **146**. **Measured after the edit rather than assumed from the last figure** — the same discipline that caught the 152-line breach in the previous PR. The trim compressed the two method traps, which the release record holds in full, rather than dropping a finding

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | nothing in this PR | no change | neither document is served by the app |

- [ ] Every role above tested — n/a: no surface
- [ ] A role that should not have access is blocked server-side — n/a: no new page or permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched
- [ ] Translatable strings go through the translation path — n/a: no user-facing string. **The Thai wording of the Units screen remains #891's open item** and is deliberately not claimed here
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no page driven for this PR
- [ ] Network clean — n/a: no page driven for this PR

## 6. Regression

- [x] The pages nearest the change still work — n/a in the UI sense. The nearest thing is the record itself, and the ten lines were **ticked in place** with their text intact, so what was checked still reads as what was checked
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is three documents beyond `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice. Confirming the scope of a signature before writing it is an existing standing rule, not a new one
- [x] `README.md` still accurate — unchanged; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody outside this repository reads a record or a handover, and nothing a user sees changed
- [x] Commit messages say why, not just what — the commit records whose checks these were, that the scope was confirmed first and why that mattered, and what remains open
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the tick count is asserted by a script that refuses any number but ten, the residual is `grep -c` returning 0, and the one claim that could only come from a person — that he looked at all ten — is **his answer, quoted, not inferred from "sign ins done"**

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `388a98ef`. **This PR ships no build**; `0.40.0` is live and unchanged by it
- [x] Deployed SHA matches the tested SHA — n/a for this PR, and settled for the release by the **code-identity check** that replaced the SHA counter: clean on all three pairs

### On the deployed build

- [ ] Deployed to test — n/a: documents only; no deploy follows this PR
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no clock is read; the dates are literal strings
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band. The line ceiling in section 4 is a budget, not a behaviour
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block below, plus the script's own `ticked 10 lines` and the `grep -c` result
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: `PUBLIC_SITE` is `locked` and this PR changes nothing served

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy follows this PR; the release's line is in the record
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy follows this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration, no data touched
- [ ] Apply plan stated — n/a: nothing to apply

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores two documents and changes nothing served. **What it does not cover:** it would put back ten `pending: Lutan` lines for checks he has actually done, which is a false *negative* in the record and would see him asked for them again. That is the failure this PR exists to prevent, in the other direction

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Nothing in this PR. **The near-miss is worth recording**: "sign ins done" was about to be read as all ten without asking, which would have put eight ticks against his name for checks whose scope he had not confirmed | **Avoided by asking a one-line question** before writing anything. He answered all ten, so the outcome is the same — but it is the same *because it was checked*, not because the guess would have been right |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — this PR changes two documents and no page, route or permission | — |

**The two items still open are not copied here.** The Thai wording belongs to #891's plan and
booking a vet visit is a standing item; both are named in the handover. A second home is how an
open item stops being closed anywhere.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, and that is a statement about **this PR**: two documents, no surface. **The ten checks it records were performed by Lutan on production**, which is why they are attributed to him with his words and the date, and why the scope was confirmed before any of them was ticked

Manual verification by: n/a: this PR's own surface is two documents and no page, so there is nothing for a person to look at. The ten production checks it records were done by Lutan on 2026-10-24, all ten, scope confirmed with him in chat before any was ticked; nothing is signed on his behalf

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: written by the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-24
