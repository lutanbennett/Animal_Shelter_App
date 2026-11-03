# Feature test plan — `plan-day-priorities`

## Header

| | |
|---|---|
| Feature | `/plan-day` reads the Customer priorities ranking Lutan sets on the backlog page |
| Backlog item | `docs/backlog.md` → none: Lutan asked for it directly in chat on 2026-11-03 (*"Wire it up"*). The follow-up it produced — the page's generator is in no repository — is filed under `## Architecture` on the `backlog` branch |
| Branch / worktree | `claude/plan-day-priorities` @ `C:\Development\Animal_Shelter_plan-day-priorities` |
| Dev server | n/a: this PR changes a planner skill and two documents; there is no app surface to serve |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/1238 |
| Tested by / date | Claude Opus 5 (automated and scripted checks), 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | `86704671` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *`/plan-day` reads `priorities/ranking` first and plans his ranked items in his order.* It matches his instruction in chat rather than a backlog item, which the header records
- [x] Files/areas touched listed — `.claude/skills/plan-day/SKILL.md` (step 3 gains the read; ordering rule 1 reworded), `docs/backlog-handover.md` (its guidance on the panel was half wrong), `docs/decisions/2026-11-03-plan-day-reads-customer-priorities.md` (new). **No `src/`, no `worker/`, no `supabase/migrations/`, no shared lib**
- [x] Cards affected identified — **none.** Nothing in this PR grants, denies or gates anything, and no card, activity, policy or route is touched. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — the panel's own fixes (the pick control, the drag ordering, the `titles` map) are in `.local/gen-backlog.mjs` and its templates, which are **gitignored and therefore not in this PR**; that is recorded in the decision file and filed as its own backlog item. The ranking document itself is not moved into the repository: it is Lutan's live preference, not source

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, and the branch pushed
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, every `<N>` is `0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 7s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 103s
=== gates: test — npm test
=== gates: test exited 0 after 16s
=== gates: build — npm run build
=== gates: build exited 0 after 43s
gates: typecheck=0 lint=0 test=0 build=0
```

  **Said precisely, because the evidence should not be read as stronger than it is:** that run was taken at commit `71777096`. The only change after it is `86704671`, which adds **two lines of markdown prose** to the skill. No gate reads prose — `typecheck`, `lint`, `test` and `build` do not open `.claude/skills/` or `docs/` — so the run stands as evidence for the tree at the tested SHA. An earlier, separate full run at the pre-commit tree also passed all four.
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The behaviour this PR changes is read by a `/plan-day` session, not by a browser. What **could** be executed is the data contract the skill now depends on, and that was driven against the real published artifact rather than reasoned about.

- [x] Happy path works end to end — the document the skill reads was fetched with `ArtifactData` get (`priorities`/`ranking`) and returned `order` and `titles` in the documented shape, with Lutan's own 8 ranked items
- [x] Data persists — reload the page and the change is still there: a pick made in the page was read back from the database afterwards, and survived a reload and a republish
- [x] Create / edit / delete all exercised — a pick was added (write), reordered by dragging (rewrite in a new order, confirmed changed in the database), and the test document deleted afterwards so Lutan started from empty
- [x] Empty state renders sensibly — the absent document is the ordinary case; the skill is explicit that `No document` or an empty `order` means nothing is picked and is not a failed read. Verified: the collection read empty before any pick and the page showed *"Nothing picked yet."*
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the skill takes no input; the only writer is the page, and the planner is told never to write to the document
- [x] Boundary cases checked — the one that bites is an id matching no open item, which happens whenever an item is retitled. Handled explicitly: the `titles` map records the wording, and the skill requires the planner to name it and ask rather than drop it

### Role access matrix

n/a: this PR touches no route, card, policy or page, so there is no access surface to tabulate. The ranking document is read with the signed-in user's own access through `ArtifactData`, and the artifact is private to Lutan.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a — no access surface in this PR | n/a | n/a | n/a |

- [ ] Every login above tested — n/a: no access surface in this PR
- [ ] A login that should not have access is blocked server-side — n/a: no access surface in this PR

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; nothing in `src/app/NavLinks.tsx` is touched
- [ ] Manual updated and the topic reads correctly at `/manual` — n/a: the manual is for shelter staff; this is a planner skill no shelter user meets
- [ ] Translatable strings go through the translation path — n/a: no user-facing string in this PR
- [ ] Mobile viewport (375px) — n/a: no rendered surface in this PR
- [ ] Browser console clean — n/a: no rendered surface in this PR
- [ ] Network clean — n/a: no rendered surface in this PR

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a page is the amended skill section itself; it was read back in place after the edit and reads correctly in sequence (the ranking, then the backlog file, with a lead-in between them)
- [x] Any shared file touched checked from a second, unrelated place — `.claude/skills/plan-day/SKILL.md` is shared by every planner run. The amendment script **refused to write** until each of its three anchors matched exactly once, and the resulting diff is **41 insertions and 4 deletions with no line-ending churn**, which is the evidence that nothing else in a 1,500-line file moved. A CRLF mismatch was caught by that same guard on the first attempt and nothing was written
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and all four gates passed afterwards

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this work had no backlog item; it came from Lutan directly. The follow-up it produced was filed on the `backlog` branch, which is where new items belong
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-03-plan-day-reads-customer-priorities.md`, which records why the ranking outranks file order, why it stays a steer rather than an override, the rename trap and the three faults that had made the panel non-functional
- [x] `README.md` still accurate — unchanged by this PR and still correct; it does not describe the planner skill or the backlog page
- [ ] **Release notes.** — n/a: a planner skill and two documents. No shelter user can see any of it, and `src/`, `worker/`, `src/lib/manual/` and `src/lib/i18n/` are untouched
- [x] Commit messages say why, not just what — the main commit leads with the fact that the panel told Lutan it was read while nothing read it
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the central claim (*nothing reads the ranking*) was established by searching `.claude/`, `scripts/` and `docs/`, not inferred. The claims about the panel were measured on the real published artifact and confirmed by reading the artifact database, after two earlier conclusions drawn from a stubbed re-run proved wrong. The decision file records that failure rather than hiding it

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing in this PR is deployed; a skill and two documents ship by being on `main`
- [ ] Deployed SHA matches the tested SHA — n/a: nothing in this PR is deployed
- [ ] Deployed to test — n/a: nothing in this PR is deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in this PR is deployed
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic in this PR
- [ ] Boundary or banding assertions cover both edges — n/a: no threshold, band or boundary in this PR
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: a deploy-time check and there is no deploy; the gates block in section 2 is nonetheless pasted exactly as the run printed it
- [ ] Public pages re-checked after a cache purge — n/a: no public page is touched
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` line seen — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var
- [ ] Migration ordering — n/a: no migration
- [ ] Rollback position stated — n/a: no deploy. Reverting the commit restores the previous skill text; nothing is applied, built or served from this PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | The panel's script scanned the page for items **before they existed**, so no pick control was ever drawn, for anyone, in any view — since the panel was written | fixed (in `.local/`, outside this PR; recorded in the decision file) |
| 2 | Medium | Drag ordering listened on the handle and depended on pointer capture, so a real drag silently did nothing when capture was not granted | fixed (in `.local/`, outside this PR) |
| 3 | Medium | The panel told Lutan *"Claude reads this list when it plans each day's work"* while nothing read it | fixed by this PR |
| 4 | Low | A retitled item's pick detached silently, with nothing recording what he had meant | fixed: the page records each pick's wording, and the skill requires the planner to name it and ask |
| 5 | Low | The page's generator and templates are untracked in `.local/`, so these fixes exist in no repository and no backup | deferred to backlog (`## Architecture`, filed 2026-11-03) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the next `/plan-day` run actually orders the day from the ranking, and says so where a sequencing rule overrides his order | the next planning round |
| 2 | That the panel is comfortable to use on a phone — the drag handle is built on pointer events so touch works, but it was driven with a mouse, and a 30px handle on a small screen is a judgement only he can make | the pinned Lanna Care Backlog page, on his phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-11-03

### Manual verification

Manual verification by: pending: the two rows above — the next `/plan-day` run has not happened yet, and the phone check is Lutan's to make. **Not signed by Claude on his behalf**

Result: pass
