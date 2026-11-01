# Feature test plan

## Header

| | |
|---|---|
| Feature | Dictionary sentences name the permission an action needs instead of a role, in English and Thai (42 keys), including the two "only an admin can withdraw a death" strings |
| Backlog item | `docs/backlog.md` → **ABOUT THIRTY MORE USER-FACING STRINGS…** and **TWO MORE STRINGS STILL TELL A USER "ONLY AN ADMIN CAN WITHDRAW"** (Security) |
| Branch / worktree | `claude/access-wording-roles` @ `C:\Development\Animal_Shelter_access-wording-roles` |
| Dev server | n/a: copy only, not driven in a browser |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | 204c5acd |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — role-named access sentences now name the catalogue permission, in both languages
- [x] Files/areas touched listed — `src/lib/i18n/dictionaries/en.ts`, `th.ts`; one code comment in `src/app/residents/[id]/deceased/DeceasedBanner.tsx`; a decision file; backlog
- [x] Roles affected identified — by card: none gains or loses access; only the words shown at a refusal or in a card description change
- [x] Anything explicitly **out of scope** written down — no access change, `can.ts` and the Admin rule untouched, dictionary key names not renamed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main` before the PR; see Evidence
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration, no UI surface, no code reads new columns
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: copy only; the strings were checked by reading each against the code that asks the permission (decision file)
- [ ] Data persists — n/a: nothing stored
- [ ] Create / edit / delete all exercised — n/a: no behaviour changed
- [ ] Empty state renders sensibly — n/a: the empty-state sentences are longer; no layout rule changed
- [ ] Invalid input is rejected with a readable message — n/a: refusals unchanged, only their wording
- [ ] Boundary cases checked — n/a: none

### Role access matrix

Analysis by card, not by role (`CLAUDE.md`).

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| any | any page | unchanged: no check, route or policy edited | n/a: copy only |

- [ ] Every role above tested — n/a: no access changed
- [x] A role that should not have access is blocked server-side — unchanged; no server or database check was edited (diff touches the two dictionaries, one comment and docs)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual's access prose was settled by #1147 and agrees with the new sentences
- [x] Translatable strings — all 42 keys changed in both `en.ts` and `th.ts`; `node scripts/check-thai-dictionary.mjs` passes
- [ ] Mobile viewport (375px) — n/a: some sentences are longer but no layout was changed
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] The pages nearest the change still work — typecheck, lint, test and build pass over the dictionaries
- [ ] Any shared file touched checked from a second page — n/a: no shared code touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run on the final tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: ticked on the `backlog` branch, not in this PR (the item's pile (B) and the Drive strings keep it partly open)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-access-wording-roles.md`
- [x] `README.md` still accurate — it does not describe this
- [ ] **Release notes.** — n/a: a shelter user would see slightly different refusal wording only, and nobody would notice the change in what they can do
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Each permission was read from the code that asks it; the Drive strings are recorded as not established

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing derives a date
- [ ] Boundary or banding change covers both edges — n/a: no threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — see **Evidence**
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert this PR; only wording changes, nothing else to undo

## Left for manual verification

| What | Where | Who |
|---|---|---|
| The Thai of all 42 keys: own-written, unreviewed (84 edits) | `th.ts`, listed on the existing "A NEW THAI STRING SHIPPED UNREVIEWED" backlog item | a Thai reader |

Automated checks by: Claude  Date: 2026-11-01

Manual verification by: pending: a Thai reader has not read the new Thai

## Result

Result: pass

## Evidence

```
gates: typecheck=0 lint=0 test=0 build=0
(tested at 204c5acd; check-thai-dictionary.mjs: every Thai entry translated, wordless or allowed by name)
```
