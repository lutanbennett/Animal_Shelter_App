# Feature test plan — cron-job-confirmed

## Header

| | |
|---|---|
| Feature | Record that `0227`'s retention job **is** scheduled on production, and correct the `0.38.0` handover and record, which both say it is open |
| Backlog item | `docs/backlog.md` → already ticked by another session with the same confirmation; **nothing to tick here** |
| Branch / worktree | `claude/cron-job-confirmed` @ `C:\Development\Animal_Shelter_cron-job-confirmed` |
| PR | **#780 — guessed #777 and was WRONG**, re-read from `gh pr create`'s own output and corrected here. Three other streams opened PRs between the guess and the create. The guess is written down precisely so being wrong is visible; the record-PR streak of six was for release PRs opened minutes after their cut, which is a quieter moment than this one |
| Dev server | not driven — documents only |
| Tested by / date | Claude Opus 5 / 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two documents say an item is open; Lutan closed it minutes after they merged, so they are corrected before anyone reads them
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/release-handover.md` and `docs/releases/2026-10-20.md`, plus this plan. **Documents only**: no `src/`, no `worker/`, no `scripts/`, no migration, no workflow
- [x] Roles affected identified — none; no shelter user can reach either file
- [x] Anything explicitly **out of scope** written down — **the backlog is not touched**: another session already ticked the item with the same confirmation, and a second edit would be duplication. **The "make the job report on itself" item stays open and is deliberately left open** — the job is confirmed working *today*, which is not the same as it announcing a future failure, and conflating the two would close a real piece of work that nobody has done

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `620060fe`, which was the tip
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — `n/a: a documents-only diff.` **This is the first PR to use the gate added hours earlier in #776**: `node scripts/check-docs-only.mjs --base origin/main` answers `docs-only: true`, so CI runs `changes` and `test-plan` and skips the other seven. Running a full local build to prove two markdown files compile is the cost that change exists to remove. **The gate's answer is pasted under §4**, so the claim is checked rather than asserted
- [ ] CI green on the PR (runs the same three) — `n/a: not yet — the PR does not exist at this commit.` Per the template as amended in #776, this line stays `n/a` and is **not** ticked in a follow-up commit; confirming the run's `headSha` against HEAD is a merge step instead

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR, and none in flight here.` Production is `233 applied, 0 pending`, `No drift`. The subject of this PR is `0227`, applied two releases ago and now **confirmed installed** rather than merely recorded as applied.

## 4. Functional checks

Two markdown documents. There is no behaviour to drive.

- [x] Happy path works end to end — both files render as markdown, and the corrected passages are the ones that were wrong: the handover's "In flight" section and item 18, and the record's "Still open" list. Checked by grepping for every remaining mention of `0227`, the cron job and `check-cron-job` and reading each one, rather than editing the first match
- [x] Data persists — `n/a: nothing is written at runtime`
- [ ] Create / edit / delete all exercised — `n/a: no such surface`
- [x] Empty state renders sensibly — `n/a: neither document has an empty state`
- [x] Invalid input is rejected with a readable message, not a crash — `n/a: no input path`
- [x] Boundary cases checked — **the claim is quoted verbatim, not paraphrased**: `check-cron-job (production): ok — purge-assistant-actions is active, 17 3 * * *, and the function exists.` is Lutan's actual output, which is the whole evidence for this PR

### The docs-only gate, exercised for the first time

```
docs-only: true — 3 path(s), all documents
  docs/release-handover.md
  docs/releases/2026-10-20.md
  docs/test-plans/cron-job-confirmed.md
The heavy jobs will skip; test-plan still runs.
```

- [x] **The expected CI shape is stated before the run, so it can be wrong**: `changes` and `test-plan` run; `check`, `migration-numbers`, `new-policy-role-names`, `script-integrity`, `cards-count`, `audit` and `public-views` all skip. **If `check` or `public-views` runs on this diff, the gate is broken and this PR is the evidence** — recorded here rather than being quietly accepted either way

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, signed in or out | nothing in this PR | no change | no route, component, policy or view touched |

- [x] Every role above tested — tested at the level this change operates at: the diff touches only `docs/`
- [x] A role that should not have access is blocked server-side — `n/a: nothing here is served`

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) — `n/a: not touched`
- [x] Translatable strings go through the translation path — `n/a: internal English documents`
- [x] Mobile viewport (375px) — `n/a: no markup or styles`
- [x] Browser console clean — `n/a: nothing here reaches a browser`
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: there are no pages.` The nearest thing is the CI gate, and this PR is its first live exercise; the expected skip list is written down above
- [x] Any shared file touched checked from a second, unrelated page — `n/a: neither document is imported by anything`
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `620060fe` and changes no code

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: already ticked by another session, with the same confirmation.` **Checked rather than assumed**, by reading the line before deciding not to edit it. **Checked the other way too**, per "tick what else your work closed": the neighbouring "make the job report on itself" item is **not** closed by this and is deliberately left open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing was decided here.` This records an answer Lutan gave; the decisions it rests on are already filed
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: internal documents — no shelter user could notice a correction to a release handover, and `src/lib/releases.ts` is untouched`
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the one claim in this PR is a command's output, quoted as printed

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `620060fe`; **nothing is deployed by this PR**, and `0.38.0` @ `8d385e10` remains live on all four targets
- [x] Deployed SHA matches the tested SHA — `n/a: this PR ships no code and triggers no deploy`

### On the deployed build

- [x] Deployed to test — `n/a: no deploy`
- [x] Smoke-tested on `test.lannacare.org` — `n/a: no deploy.` `0.38.0`'s smoke test is in `docs/releases/2026-10-20.md`
- [x] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — **this one is not `n/a`, and it is the substance of the PR.** The job's schedule is `17 3 * * *`, which pg_cron evaluates in the **database's** clock, not a browser's or Thailand's. The confirmation asserts the schedule string matches exactly, which is what `check-cron-job.mjs` compares; **no claim is made here about what local hour that is**, because nothing in this PR established it
- [x] **For a boundary or banding change, the assertions cover both edges** — `n/a: no boundary change.` `0227`'s 2-day and 90-day cutoffs were exercised on their own branch and are unaffected
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — both blocks are: the gate's classification and Lutan's `check-cron-job` line
- [x] Public pages re-checked after a cache purge — `n/a: nothing deployed, and `PUBLIC_SITE` is locked`

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read — `n/a: no deploy in this PR`
- [x] `strip-baked-env` seen — `n/a: no deploy`
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: none added.` **Worth stating plainly: this PR adds no permission rule either.** The read stayed refused; Lutan ran the command himself
- [x] The release mail — `n/a: no deploy, no mail.` `0.38.0`'s went out and was confirmed delivered

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration here.` **But named because it is adjacent:** the job this PR confirms **deletes live rows every night, permanently and with no undo**. That is Lutan's retention decision working as intended rather than a risk — and it is now confirmed to be really running, which is the first time that has been true of it
- [x] Apply plan stated — `n/a: nothing to apply`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this commit restores two documents to a state that says an answered question is open. **That is the only risk here, and it is the risk this PR exists to remove**: nothing deployed changes, and the production job is unaffected either way, because a markdown file cannot schedule or unschedule anything

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **Medium (the exact failure the repo has a rule about)** | **`0.38.0`'s handover and record merged saying an item was open, and it was closed roughly an hour later** — so the next release manager would have raised with Lutan a question he had already answered. This is the `0224` failure mode of 2026-10-19 repeating in a new place: not a stale *backlog* item this time, but a stale *handover* | **Fixed here, before anyone read it.** Both documents corrected, and the handover now opens its In flight section with "NOTHING is open from `0.38.0`". The underlying cause — paperwork slow enough to be overtaken — is what #776 addressed |

No defect is in shipped code.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Video playback on a real iPhone and a real Android** — carried forward from `0.38.0` and still the release's one substantive gap | A resident's Photos section on `lannacare.org`, on a real phone |

## Sign-off

- [x] All of the above either ticked or `n/a: <reason>`

Automated checks by: Claude Opus 5  Date: 2026-10-20

Manual verification by: n/a: two corrected documents, whose single factual claim is a command Lutan ran himself and whose output is quoted verbatim above; there is nothing further for a person to look at

Result: pass
