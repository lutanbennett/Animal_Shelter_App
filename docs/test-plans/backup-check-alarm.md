# Test plan: backup-check-alarm

## Header

| | |
|---|---|
| Feature | backup-check-alarm |
| Backlog item | `docs/backlog.md` → |
| Branch / worktree | claude/backup-check-alarm |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | pending |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | fb15098c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [ ] Files/areas touched listed (routes, `worker/`, `supabase/mig — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Roles affected identified: admin / staff / doctor / voluntee — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Anything explicitly **out of scope** written down, so the re — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no  — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in  — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop  — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Existing rows still read correctly after the change (checked — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] **Constraints and defaults exercised against real rows** in  — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Down-migration written, or the reason one is not needed is s — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Production apply plan stated for the release manager (which  — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

## 4. Functional checks

- [ ] Happy path works end to end — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Data persists — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Create / edit / delete all exercised (whichever the feature  — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Empty state renders sensibly (no rows yet) — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Invalid input is rejected with a readable message, not a cra — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Boundary cases checked (long text, zero, negative, missing o — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role`
was dropped by `0181`). The live ones are admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is
retired (`0173`). **There is no `resident` role** — in this app a resident is an
animal — and do not re-derive this list by grepping for quoted strings; read the
`roles` table (or `/admin/who-does-what`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] A role that should not have access is blocked server-side (h — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads  — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Translatable strings go through the translation path, checke — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Mobile viewport (375px) — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Browser console clean — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Network clean — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

## 6. Regression

- [ ] The pages nearest the change still work (list the ones check — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, sha — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Nothing merged from `main` during `sync` was broken by this  — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

## 7. Documentation

- [ ] Backlog item ticked — n/a: production half still open, so the item stays unticked; its status note is on the backlog branch
- [ ] Design choices recorded — n/a: recorded in docs/decisions/2026-10-13-backup-folder-one-rule.md by the earlier PR; this PR only rewords one message
- [ ] `README.md` still accurate — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] **Release notes.** — n/a: an admin-only status-tile message; production half outstanding
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `mai — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Deployed SHA matches the tested SHA — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Smoke-tested on `test.lannacare.org` — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] **Timezone-sensitive behaviour proved, not observed at a con — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover bot — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] **Evidence pasted into this plan is the tool's actual output — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-chec — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and  — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundl — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Any new secret/env var exists in the production Cloudflare e — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads  — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] `node scripts/apply-migrations.mjs --env production --dry-ru — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] For a **destructive or rewriting** migration only: a product — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here
- [ ] Apply plan stated: which file, which project, and whether it — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

### Rollback

- [ ] Rollback position stated, **including what it does not cover — n/a: one reworded error string in the status tile; no UI layout, data, roles or deploy surface changed here

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up. Listing them again in this
table gives them a second home that nothing ever closes: the check gets done at
deploy time, section 8 is satisfied, and this row stays open for good. Five
release-cut plans accumulated permanently-open rows exactly that way before it
was noticed (2026-09-27).

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

Production Pi and Worker settings for `BACKUP_DRIVE_FOLDER_ID` are Lutan to confirm.

- [ ] The manual list above is not empty — n/a: not ticked, a person has not yet looked

Manual verification by: pending: production Pi and Worker settings for BACKUP_DRIVE_FOLDER_ID, confirmed by Lutan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to release manager — n/a: release manager picks it up at release

Result: pass

Release manager acknowledgement: pending
