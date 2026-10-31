# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover, edition `519` |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping required by `.claude/skills/plan-day/SKILL.md` step 8 at nine streams since the last edition, not a backlog item |
| Branch / worktree | `claude/planner-handover` @ `C:\Development\Animal_Shelter_planner-handover` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (not started — no code changed) |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (Daily Planner session) / 2026-10-31 |
| Carries a migration? | no |
| Tested at SHA | `13f995c8` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **rewrites `docs/planner-handover.md` from edition `510` to `519`**, as the skill requires at nine streams; the one-sentence description is the commit subject
- [x] Files/areas touched listed — **`docs/planner-handover.md` only.** No routes, no `worker/`, no `supabase/migrations/`, no shared libs. `git show --stat` is one file
- [x] Roles affected identified — **none.** The file is a developer document in a git repository; it is not served by the app and no role can reach it. Not admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer, public_viewer or signed-out
- [x] Anything explicitly **out of scope** written down — out of scope: `CLAUDE.md`, the `plan-day` skill, `docs/backlog.md` and `.plan-day.md`. The handover **outranks none of them** and says so in its own opening lines. Four facts it recommends be promoted into the skill are named in it as recommendations and were deliberately **not** applied here, because editing the skill is a change of behaviour for every future session and belongs in its own reviewed PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`, then pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed:

```
=== gates: build exited 0 after 252s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. `0292` is owned by the `pi-failover-schema` stream this batch and this branch must not claim it
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this change reads and writes no database at all
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. The rollback for a document is `git revert`
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour. The file's only consumer is a human or a future Claude session reading it from the repository
- [ ] Data persists — n/a: no runtime behaviour, nothing is written
- [ ] Create / edit / delete all exercised — n/a: no runtime behaviour
- [ ] Empty state renders sensibly — n/a: no runtime behaviour
- [ ] Invalid input is rejected with a readable message — n/a: no runtime behaviour, no input
- [ ] Boundary cases checked — n/a: no runtime behaviour. The one measurable property of this file is its length, checked below under section 7

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | the file is not served by the app | n/a: repository document |
| management | nothing | as above | n/a: repository document |
| staff | nothing | retired role (`0173`) and in any case the file is not served | n/a: repository document |
| doctor | nothing | as above | n/a: repository document |
| volunteer | nothing | as above | n/a: repository document |
| signed out | nothing | as above | n/a: repository document |

- [ ] Every role above tested — n/a: `docs/` is not served by the app, so there is no URL for any role to reach
- [ ] A role that should not have access is blocked server-side — n/a: no route exists to block. Note the repository is PUBLIC, which is the real access question here, and it is answered under section 7: the file names no real person and carries no credential

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no page added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched, and deliberately so — `CLAUDE.md` names it as the cross-stream conflict file and two live streams are near it this batch
- [ ] Translatable strings go through the translation path — n/a: a developer document, never shown to a shelter user and never translated
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface, no browser involved
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — **checked by `build`, which compiled every route from a tree containing this change and exited 0.** There are no "pages nearest" a document in `docs/`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched. The one file changed is imported by nothing (`grep -rn "planner-handover" src/ worker/` finds no reference; it is read by people, not by code)
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.`, so nothing was merged in, and gates passed afterwards

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this closes no backlog item. The handover is required by the skill at a stream count, and `CLAUDE.md` is explicit that the two handover documents are bookkeeping rather than reviewed work
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choices. The document's own content is the record, and the four facts it recommends promoting into the skill are named in it as recommendations for the next planner rather than as decisions taken here
- [x] `README.md` still accurate — unchanged by this PR and it makes no claim about the handover's contents
- [ ] **Release notes.** — n/a: no shelter user can see a planner document; it is read only by the next planning chat
- [x] Commit messages say why, not just what — the commit subject names the subject of the edition and the body says what the round measured and why it matters
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the document is from a `stream-usage:` PR comment, read from the stream's own live process and quoted as recorded: six token figures, six message figures, and the six floors derived as `tokens − messages` (102,168 · 102,168 · 103,241 · 103,245 · 103,245 · 103,245). **The one claim that is explicitly NOT measured is labelled as such** — the "does the environment hold what the proof needs?" rule is stated as one reading, with the instruction to say so when quoting it. The length figure (163 lines) was taken with `wc -l` after the final edit, not estimated — four previous editions stated a length they had not measured

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date, time or clock logic anywhere in this change; it is prose in a markdown file
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary, threshold, rounding rule, retry window, pagination limit or permission cutoff is changed. The token bands discussed in the document are advice to a future planner, not code
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The `gates:` block in section 2 is copied verbatim from the run, including its elapsed time
- [ ] Public pages re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no secret, no environment variable, no configuration added or read

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this one commit restores edition `510` exactly, and nothing else is affected: no schema, no deployed artefact, no Worker bundle, no Pi build. **What it does not cover:** nothing. This file is read by people and imported by no code, so reverting it has no runtime consequence at all. **It also does not need a deploy to take effect** — the next planning chat reads the file from the repository

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | First draft measured **170 lines** against the skill's ~150 target. Trimmed to **163** by cutting content that duplicated `.plan-day.md` (the migration-slot contention) and compressing two passages, per the skill's rule that the lever on length is cutting content rather than rewording | accepted — the skill makes 150 a target and not a hard gate, and explicitly says not to spend round-trips trimming or to trade accuracy for the number |
| 2 | minor | A quoted bash heredoc collapsed double backslashes while writing a helper script earlier in this session, so `[^"\\]` reached node as `[^"\]` and died on an invalid regular expression | fixed — rewrote the script with the Write tool; recorded in the handover as a trap for the skill's list, which is the durable fix |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-31

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planner document with no UI surface, read only by the next planning chat; `CLAUDE.md` records that Lutan has never reviewed a handover and that asking him to merge one made a gate out of bookkeeping

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a as a gate, and stated for the record: this PR ships no code, so there is nothing for the release manager to deploy or verify. It merges on green CI without an approval round-trip, by `CLAUDE.md`'s rule covering the two handover documents

Result: pass with accepted defects

Release manager acknowledgement: n/a: no code ships in this PR, so there is nothing to deploy
