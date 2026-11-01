# Feature test plan

## Header

| | |
|---|---|
| Feature | Translations propose, app half: a login holding `propose_translations` alone opens Management → Translations and proposes, with no Approve or Reject; the Worker and `draft-label-thai.mjs` sign in as a machine login (built inert) |
| Backlog item | `docs/backlog.md` → **SPLIT PROPOSING A THAI LABEL FROM APPROVING ONE** (Security) |
| Branch / worktree | `claude/translations-propose-app` @ `C:\Development\Animal_Shelter_translations-propose-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | 8cb39ea9 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the route entry, page guard and propose control follow `translations.propose`; the Worker and the script sign in as a machine login
- [x] Files/areas touched listed — `src/lib/permissions/routes.ts`; `src/app/management/translations/{page,actions,TranslationQueue}`; `worker/translations.mjs` (+ test), `worker/index.mjs`; `scripts/draft-label-thai.mjs`; `docs/backlog.md`; a decision file
- [x] Roles affected identified — by card: `propose_translations` newly opens the screen and the propose control; `translations` (manage) sees exactly what it saw before
- [x] Anything explicitly **out of scope** written down — the machine login, its production card, the secrets and the Worker deploy (Lutan's); `write-requests.ts` and `src/lib/assistant/**` untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran, nothing new to merge from `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration (`0296` was applied by #1160)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration; `0296` still has to reach production, which is Lutan's step 1 in the decision file

## 4. Functional checks

Driven on dev, port 3002, with `dev-signin.mjs --cards propose_translations`, reached by clicking Home, Management, then the Translations tile.

- [x] Happy path works end to end — the tile is drawn, the screen opens, the only button on it is Propose, a proposal landed
- [x] Data persists — the Waiting tab shows "Proposed by you" for the proposal, and the label left the Missing list
- [ ] Create / edit / delete all exercised — n/a: only proposing exists for this card; approve and discard are the other card's and were not touched
- [ ] Empty state renders sensibly — n/a: no list rendering changed
- [ ] Invalid input is rejected with a readable message — n/a: the action's blank-text refusal is unchanged
- [ ] Boundary cases checked — n/a: no boundary changed

### Role access matrix

Analysis by card, not by role (`CLAUDE.md`).

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `propose_translations` alone | Management → Translations | opens; Propose only; no Save, Approve, Reject | confirmed on dev |
| `translations` (manage) | same | unchanged: Save, Propose, Approve, Reject | n/a: not re-driven; its controls still ask `translations.manage` and 0296 gave that card proposing |
| neither | same | refused by the page guard | n/a: guard is `requireAnyPermission` over the two; not re-driven |

- [ ] Every role above tested — n/a: by card; the one-card login was driven, the others follow from the same two checks
- [x] A role that should not have access is blocked server-side — the page guard is `requireAnyPermission`, the action checks `translations.propose`, and the database refuses approve and discard (#1160's `prove-translations-propose.mjs`)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: the tile comes from the same route entry; no nav change
- [ ] Manual updated — n/a: the Translating topic already describes Propose
- [ ] Translatable strings — n/a: no new string
- [ ] Mobile viewport (375px) — n/a: no layout changed, controls only drawn or not
- [x] Browser console clean — no error shown across the drive
- [x] Network clean — the proposal call completed with no refusal shown

## 6. Regression

- [x] The pages nearest the change still work — Management hub and the Translations screen with the Missing and Waiting tabs
- [ ] Any shared file touched checked from a second page — n/a: `routes.ts` gains one `alsoActivity`; the Management hub, which reads it, was loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged; gates run on the final tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`, with the machine login's three production steps left named
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-translations-propose-app.md`
- [x] `README.md` still accurate — it does not describe this
- [ ] **Release notes.** — n/a: the outstanding step is `0296` and the card on production plus the machine login and Worker deploy (Lutan's); a note now would promise users something production cannot do yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The browser drive and the worker tests were run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — deferred: release manager. Nothing here derives a date
- [ ] Boundary or banding change covers both edges — deferred: release manager. No threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — see **Evidence**
- [ ] Public pages re-checked after a cache purge — deferred: release manager. No public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — deferred: Lutan. `LABEL_DRAFT_EMAIL`, `LABEL_DRAFT_PASSWORD` (secret) and `SUPABASE_ANON_KEY` are new and unset; the Worker skips labels until they are

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration here; the code reads `0296`, which must be on production before the card is given out
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration; see the decision file for Lutan's three steps

### Rollback

- [x] Rollback position stated — reverting this PR restores the old gate on the screen; nothing here is schema, so there is nothing else to undo. The Worker half is inert until secrets are set

## Left for manual verification

| What | Where | Who |
|---|---|---|
| The Worker signing in and proposing, and `draft-label-thai.mjs --login`, against a real login: none exists yet | production, after Lutan's three steps | Lutan |

Automated checks by: Claude  Date: 2026-11-01

Manual verification by: pending: the machine login does not exist; the Worker and `--login` paths are unit-tested only, not run against a real login

## Result

Result: pass

## Evidence

```
gates: typecheck=0 lint=0 test=0 build=0
```

`node --test worker/translations.test.mjs`: 9 pass, 0 fail. `check-permission-catalogue.mjs` ok; `check-hard-coded-security.mjs` clean before and after.
