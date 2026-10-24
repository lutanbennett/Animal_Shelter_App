# Feature test plan — `0.40.1` manual sign-off

## Header

| | |
|---|---|
| Feature | Record Lutan's manual verification of the two screens `0.40.1` shipped as a stated gap: sign both feature plans in his name at his request, and correct the record and handover so they stop saying the items are open |
| Backlog item | `docs/backlog.md` → none; this is `docs/test-plan-template.md`'s sign-off rule and `CLAUDE.md`'s two-signatures rule being applied after the fact |
| Branch / worktree | `claude/signoff-0-40-1` @ `C:\Development\Animal_Shelter_signoff-0-40-1` (a fresh worktree; the release's own was removed at the end of the release and no leftover was free) |
| Dev server | not started; four markdown files and no page |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-24 |
| Carries a migration? | no |
| Tested at SHA | `29a5f91b` |

**Nothing about the running application changes.** `0.40.1` is live and unaffected; this PR
changes what four documents say about who checked what.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — sign items 1 and 2 of `stocktaking-switches-app` and items 1 and 4 of `who-does-what-features-app` in Lutan's name, mark the rest **STILL OPEN**, and update `docs/releases/2026-10-24-0-40-1.md` and `docs/release-handover.md` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — four, all under `docs/`: the two feature test plans, the release record, the handover. No code, no route, no migration, no shared lib
- [x] Roles affected identified: admin / management / second_in_command / head_of_maintenance / head_of_medical / doctor / volunteer / public_viewer — **none.** Nothing in `src/` or `worker/` reads these files and no role can reach them in the app
- [x] Anything explicitly **out of scope** written down — this PR does **not** claim the three remaining table rows were checked, does not touch the ten production sign-in checks (still not done), and does not alter either release note, which were already true

### The risk in this PR is a false signature, and that is the only risk

A signature that does not correspond to someone having looked is, in `CLAUDE.md`'s words,
*"worse than none: it turns an unknown into a false assurance, and it is the first artifact
anyone reaches for when something has gone wrong."* So the two conditions were established
before anything was written:

1. **He looked.** *"Bothe tested and working - switches and who does what"*, 2026-10-24, unprompted, after the release.
2. **He explicitly asked for the plans to be signed in his name** — asked as a direct question, because `CLAUDE.md` permits Claude to sign that line only on both conditions and requires the line to say so. Both signature lines say so.
3. **The scope was confirmed before anything was ticked.** "Working" could have meant the buttons and not the Thai, so he was asked that separately and answered that the Thai is fine too. This is the identical question `0.40.0` recorded needing, where *"sign ins done"* could have meant two of ten lines.

**And the scope was then honoured against the tables rather than the headline.** Each plan's
*Left for manual verification* table holds more rows than the two items the release tracked:
three in one, four in the other. Only the rows his words cover are ticked. **Three are marked
STILL OPEN**, and the checklist line above each signature is left **unticked** for that reason
rather than ticked on a partial pass.

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` at `29a5f91b` minutes before the edits; `git status -sb` showed no divergence
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — n/a: **documents-only, so the heavy CI jobs skip by design** (`check-docs-only.mjs`; paperwork rule 1 forbids touching code to make a check run). The four gates ran in full on the cut at `c7bfb7fb`, which is what `0.40.1` was built from
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-docs-only.mjs --base origin/main` reports **docs-only: true** — measured, not assumed
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it, and passed, **including against the two plans this PR edits** — which is the check that matters here, since an edited signature line is exactly what that script validates

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration. Next free is `0257`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — nothing to apply; production reads **`257 applied, 0 pending`** and was re-read after the release
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [x] Applied to **dev** and recorded in `schema_migrations` — n/a for this PR; dev reads 257 of 257 with `No drift`
- [ ] File is re-runnable — n/a: no migration in this PR
- [x] Existing rows still read correctly after the change — no data change. `No drift` on both databases after the release, unchanged by this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no schema in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — n/a as a plan; already executed and verified during `0.40.1`

## 4. Functional checks

- [x] Happy path works end to end — all four documents render as markdown; both edited tables still parse with their columns intact, and both signature lines are single lines in the form `check-test-plan.mjs` expects, proved by running it
- [x] Data persists — committed on this branch and pushed by the post-commit hook; `git status -sb` reports no unpushed commits afterwards
- [ ] Create / edit / delete all exercised — n/a: this is an edit only; nothing is created or deleted
- [ ] Empty state renders sensibly (no rows yet) — n/a: no data surface
- [x] Invalid input is rejected with a readable message, not a crash — the relevant validator is `check-test-plan.mjs`, and it is known to reject a malformed signature (it refused a `deferred:` reason outside the pre-production gate on the `0.40.0` cut plan). It passes on both edited plans
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — **the boundary here is partial completion**, which is the whole subject of the PR: two tables each partly done, signed for exactly the done rows and not the rest, with the summary checkbox left unticked. The handover's length boundary was re-measured after editing (below)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | nothing | these files are not served by the app | unchanged — no route, page or permission in this PR |

- [ ] Every role above tested — n/a: a documents PR with no route, page or permission
- [ ] A role that should not have access is blocked server-side — n/a: same

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; these are session-facing documents
- [ ] Translatable strings go through the translation path — n/a: no user-facing string. **The Thai wording this PR records as verified is #903's and #906's**, already shipped and unchanged here
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no page was driven
- [ ] Network clean — n/a: no page was driven

## 6. Regression

- [x] The pages nearest the change still work — none exist; and `0.40.1` was re-checked live while this PR was being written: `/api/version` still answers `0.40.1` @ `254cd948` on production
- [x] Any shared file touched checked from a second, unrelated page — the two feature plans are read by `check-test-plan.mjs`, which is the second reader and was run; the record and handover are read by future sessions, and both were re-read end to end after editing to confirm they no longer contradict the plans
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged. **`main` had moved** since the record landed (a backlog grooming, `docs/backlog.md` only), which was read rather than assumed and is noted in the handover

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item, and `docs/backlog.md` is deliberately untouched so as not to collide with the grooming that just merged. The three remaining table rows stay in their own plans, where their signatures hold them, rather than being copied to the backlog — a second home is how an open item stops being closed anywhere
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing new was decided. The rule applied is `CLAUDE.md`'s existing two-signatures rule; the one durable lesson of this release was already promoted into `docs/release-procedure.md` by #908
- [x] `README.md` still accurate — unchanged; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: four documents read by sessions, not by users. **And the two release notes are unaffected**: both describe what the screens do, both screens were now verified by a person, and the one open check (item 2) would bear on the *extent* of the grouping rather than on anything either note claims
- [x] Commit messages say why, not just what — the commit records both conditions that permitted signing, that the scope was confirmed first, and which rows were deliberately left open
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the claims here are about what a person said and did, so the evidence is his own words, quoted verbatim in the record rather than paraphrased. **The one thing not inferred from them is the most important**: that "both tested and working" does *not* cover the cross-role check, which was therefore left open and flagged in the handover as the row that matters

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `29a5f91b`. **This PR ships no code and deploys nothing**
- [x] Deployed SHA matches the tested SHA — already settled for `0.40.1`: all four builds from `254cd948`, code-identity check clean
- [x] **Every PR in this release has a completed test plan** — 11 PRs, checked by hand and recorded. **This PR improves that position**, by replacing two `pending:` signatures with scoped real ones

### On the deployed build

- [x] Deployed to test — done during the release, from `254cd948`
- [x] Smoke-tested on `test.lannacare.org` — done during the release; re-confirmed `0.40.1` on both environments while writing this PR
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives "today"; the dates are the literal `2026-10-24`
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no band or threshold. The purchasing arithmetic behind the switch was driven on both sides by #903 and is unchanged
- [x] **Evidence pasted into these documents is the actual source, unedited** — Lutan's confirmation is quoted verbatim, including its typo, rather than tidied into something he did not type
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: `PUBLIC_SITE` is `locked`, re-read during the release

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — read during the release as `dbkodyyxxhtygxcxmfcu (254cd948)`
- [x] `strip-baked-env: removed N env var(s)` seen in the deploy output — 14 on both environments
- [x] **The release mail did NOT go out, and this PR cannot send one** — it touches no code and runs no deploy; `0.40.1` is `major: false` and both deploys confirmed it
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none
- [x] **Merging this PR cannot change what is served** — four markdown files, merged after the release is live

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, neither
- [x] `--env production --dry-run` run and clean — done during the release, all three `ok`
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [x] Apply plan stated — already executed: `257 applied, 0 pending`, `No drift` both databases

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **reverting the commit is the whole rollback**: four markdown files, nothing served, no migration, no mail. It would restore two `pending:` signatures and re-open two items in the record, which is a documentation state rather than a production one. `0.40.1` itself is unaffected either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **"Both tested and working" would have closed five table rows if taken at face value**, three of which nobody has checked — including the cross-role check that bears on what the release note actually promises | **not accepted as a closure.** Only the rows his words cover are ticked; three are marked **STILL OPEN**, the summary checkbox above each signature is left unticked, and the handover names item 2 as the one that matters. This is the `0.40.0` scope lesson applied rather than re-learned |
| 2 | low | **The two feature plans' tables were richer than the release tracked.** The record and handover carried two headline items; the plans hold seven rows between them | **fixed by reading the tables rather than the headline.** Worth noting for future releases: *Left for manual verification* is the authoritative list, and a release record that summarises it can understate what is open |
| 3 | low | **`main` moved after the record merged** — a backlog grooming (`docs/backlog.md` only) | **read, not assumed.** No application code differs, production still serves `254cd948`, and the handover's "re-measure first" line was updated to say `main` has since moved twice |
| 4 | medium | **Editing an already-shipped test plan makes `check-test-plan.mjs` re-judge its release-notes line against the NEW diff, which can never satisfy it.** Both edited plans went red on the first run: *"release-notes line is ticked, but `unreleased` gained no line in this PR"*. Both ticks were **correct when written** — the notes existed in `unreleased` then, and have since shipped into `releases` | **fixed honestly rather than worked around, and the checker was right.** Each line is now unticked with a reason that preserves what it originally said, names the PR and commit that earned the tick, and explains that no later diff can satisfy it. **The temptation to resist was deleting or rewriting the original claim** to make the red go away, which would have falsified two shipped PRs' records. This is structurally the same as the documented *"a cut PR cannot tick the release-notes line"* rule, and it will catch anyone who signs a plan after its release has shipped — which is now the normal way a `pending:` signature gets closed. **Worth promoting into `docs/test-plan-template.md` if it recurs**; left as a finding here rather than a rule on one occurrence |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none **for this PR** — four markdown files, no page, route or permission. **The three rows this PR leaves open stay in their own plans**, where their own signatures hold them, and are named in the record and the handover. They are not copied here, because a second home is how an open item stops being closed anywhere | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty for this PR, which edits four documents and no page. **This is not a claim about the three rows the PR leaves open**, which are recorded as open in the two plans, the record and the handover

Manual verification by: n/a: this PR edits four documents and no page, so there is nothing for a person to look at. What it records — Lutan's verification of two screens on 2026-10-24, signed in his name at his explicit request and scoped to what he confirmed — is signed on those screens' own plans, not here

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: this plan was written by the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-24
