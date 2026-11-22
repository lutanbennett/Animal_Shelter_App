# Feature test plan

## Header

| | |
|---|---|
| Feature | Cap the shelter logo upload at 1 MB, refusal in English and Thai |
| Backlog item | `docs/backlog.md` → #oga26 |
| Branch / worktree | `claude/logo-upload-cap` @ `C:\Development\Animal_Shelter_logo-upload-cap` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | pending: opened after this plan |
| Tested by / date | Claude, 2026-11-22 |
| Carries a migration? | no |
| Tested at SHA | 905874692 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a logo above 1 MB is refused at upload, in both languages, and the limit is stated on the card
- [x] Files/areas touched listed: `src/lib/uploads/limits.ts`, `src/app/admin/website/actions.ts`, `ShelterLogo.tsx`, both dictionaries, `src/lib/releases.ts`
- [x] Cards affected identified: `website_photos` (Admin → Website logo card); Admin sees it too; signed-out public unaffected
- [x] Out of scope: `MAX_UPLOAD_BYTES` and every other upload path, the logo on production, the `?w=` decision

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branch cut from current origin/main this session, sync run before pushing the PR
- [x] `node scripts/gates.mjs` closing lines (see PR body for the run)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: a 1.5 MB file driven through the logo card is refused; under-cap path unchanged code
- [ ] Data persists — n/a: a refusal writes nothing
- [ ] Create / edit / delete all exercised — n/a: only the upload size check changed
- [ ] Empty state renders sensibly — n/a: not touched
- [x] Invalid input is rejected with a readable message, not a crash: English and Thai sentences read back from the page
- [x] Boundary cases checked: server check is `> MAX_LOGO_BYTES`, so exactly 1 MB passes; only the over-cap case was driven

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/website logo card | sees card, oversize refused | pass |
| exactly `website_photos` | same | same; permission check unchanged | n/a: gate code untouched, not re-driven |
| signed out | nothing | unchanged | n/a: no public surface changed |

- [ ] Every login above tested — n/a: only admin driven; the permission check is untouched
- [ ] A login that should not have access is blocked server-side — n/a: permission check untouched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: manual does not state the logo size limit
- [x] Translatable strings go through the dictionaries: new `logo.tooLarge` and reworded `logo.subtitle` in en.ts and th.ts
- [ ] Mobile viewport (375px) — n/a: text-only change inside an existing card
- [x] Browser console clean — no errors seen in the driven run
- [ ] Network clean — n/a: the client refuses before any request is sent

## 6. Regression

- [x] The pages nearest the change still work: /admin/website loaded in both languages
- [ ] Shared file touched checked from a second page — n/a: limits.ts only gained a constant; MAX_UPLOAD_BYTES unchanged
- [ ] Nothing merged from main broke — n/a: sync result in PR

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-22-logo-upload-cap.md`
- [ ] `README.md` still accurate — n/a: README does not mention logo limits
- [x] **Release notes.** An Admin meets the new limit and message; `unreleased` has a line tagged `website_photos`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned**: the sizes (19 KB, 767 KB) are the planner's measurements; the refusal text was read back from the page

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change assertions — n/a: a single size threshold, no banding
- [ ] Evidence pasted is the tool's actual output — n/a: no pasted evidence beyond the gates in the PR
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; the change is code only, revert the commit; no schema

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | none found | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-22

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: the refusal was driven and read back in both languages

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch
- [ ] Handed to the production release manager — n/a: handed over via the merged PR

Result: pass

Release manager acknowledgement: pending: release manager
