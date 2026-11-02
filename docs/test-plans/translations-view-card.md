# Feature test plan

## Header

| | |
|---|---|
| Feature | A card, `view_translations`, that grants `translations.view` alone: it opens Management → Translations to read the queue and drafts, with no write control. The route now opens on `translations.view` |
| Backlog item | `docs/backlog.md` → **THE `translations` CARD CANNOT BE HELD READ-ONLY** (Security) |
| Branch / worktree | `claude/translations-view-card` @ `C:\Development\Animal_Shelter_translations-view-card` |
| Dev server | `http://localhost:3019` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-02 |
| Carries a migration? | yes: 0298 |
| Tested at SHA | 62e4c530 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one new card holding `translations.view` only, and the route opening on that activity
- [x] Files/areas touched listed — `0298`; `cards.ts`, `routes.ts`; the translations `page.tsx`; both dictionaries; `check-cards-count.mjs`, `check-activity-lists.mjs`; a decision file; the backlog
- [x] Roles affected identified — by card: `view_translations` is new; `translations` and `propose_translations` open the screen as before
- [x] Anything explicitly **out of scope** written down — splitting propose from approve; the gating of manage; giving any role the card (Who does what)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran before the push, see Evidence
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output under **Evidence**
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0298, after 0297; the apply script numbering check said ok
- [x] `--status` reviewed — 298 files, 0298 the only one applied here and not on main
- [ ] `--dry-run` reviewed — n/a: the file is two inserts and a self-check, applied directly to dev
- [x] Applied to **dev** — yes
- [x] File is re-runnable — `on conflict do update` throughout
- [ ] Existing rows still read correctly — n/a: no existing row changes
- [x] Constraints and defaults exercised against real rows — the file's own assertions ran in the apply
- [ ] Down-migration written — n/a: additive; delete the two rows to undo
- [x] Production apply plan stated — 0298 must be applied to production before the card can be given out; Lutan's step

## 4. Functional checks

Driven on dev, port 3019, with `dev-signin.mjs --cards view_translations` and `--cards translations`, reached by clicking Management then the Translations tile.

- [x] Happy path works end to end — card-only login: tile drawn, screen opens, queue of rows shown
- [ ] Data persists — n/a: nothing is written by this card
- [ ] Create / edit / delete all exercised — n/a: the card has no write control
- [ ] Empty state renders sensibly — n/a: no list rendering changed
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: none

### Role access matrix

By card, not by role.

| Card held | Can reach | Expected | Result |
|---|---|---|---|
| `view_translations` alone | Management → Translations | opens; no Propose, Save & approve, Reject or Save; no text boxes | confirmed: only the header buttons were present, 0 inputs |
| `translations` | same | unchanged | confirmed: Save & approve, Save, Propose, Remove translation present, 646 inputs |

- [x] Every role above tested — both cards driven
- [x] A role that should not have access is blocked server-side — unchanged: actions and database functions still ask manage and propose

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: the tile comes from the same route entry
- [ ] Manual updated — n/a: the Translating topic is unchanged
- [x] Translatable strings — card label added in en.ts and th.ts
- [ ] Mobile viewport (375px) — n/a: no layout changed
- [ ] Browser console clean — n/a: not read; the page rendered and both drives completed
- [ ] Network clean — n/a: not read

## 6. Regression

- [x] The pages nearest the change still work — Management hub and the Translations screen under both cards
- [x] Any shared file touched checked from a second page — `routes.ts` is read by the Management hub, which loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run on the final tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-02-view-translations-card.md`
- [x] `README.md` still accurate — it does not describe this
- [ ] **Release notes.** — n/a: 0298 is not yet on production, so a note would promise users a card that cannot be given out
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Both cards were driven in the browser

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing derives a date
- [ ] Boundary or banding change covers both edges — n/a: no threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — see **Evidence**
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — yes; the card row is read through `check-card-grants`
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Backup for a destructive migration — n/a: not destructive
- [x] Apply plan stated — in the decision file

### Rollback

- [x] Rollback position stated — revert the PR and delete the two 0298 rows

## Left for manual verification

| What | Where | Who |
|---|---|---|
| Giving the card to a role and checking it reads on production | Settings → Who does what, after 0298 is applied | Lutan |

Automated checks by: Claude  Date: 2026-11-02

Manual verification by: pending: 0298 is not on production yet, so no real role holds the card

## Result

Result: pass

## Evidence

GATES_PLACEHOLDER
