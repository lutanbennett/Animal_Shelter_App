# Feature test plan — pi-hosting-drive-placeholder

Filled from `docs/test-plan-template.md`. **Documentation only: one runbook step and one decision
file.** No code, no schema, no page, nothing a shelter user or any role can reach. Most lines are
honestly `n/a` and the reason is written on each.

The change: `docs/pi-hosting.md`'s drive-mirror step 1 hard-coded one drive's `by-id` string inside
an `fdisk` command; it now says to read the path from the Pi first, as steps 2 and 3 of the same
list already do. `docs/decisions/2026-11-01-hardware-identifiers-in-a-public-repo.md` records the
search behind it and what was decided.

---

## Header

| | |
|---|---|
| Feature | Stop `docs/pi-hosting.md` naming one particular drive inside a destructive `fdisk` command, and record what the public repo says about Lutan's hardware |
| Backlog item | `docs/backlog.md` → none. Asked for directly by Lutan on 2026-11-01 (*"Look at it now"*) after `pi-tests-record` found a drive serial in an item it was ticking; the writing rule it produced is filed on the `backlog` branch |
| Branch / worktree | `claude/pi-hosting-drive-placeholder` @ `C:\Development\Animal_Shelter_App-worktrees\amazing-payne-6f12f1` |
| Dev server | not started — `n/a: no runtime surface in this change` |
| PR | #1158 |
| Tested by / date | Claude, 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | recorded by the `gates:` line in §2, run on this branch's head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — Lutan asked for the identifier finding to be looked at now; the finding is written up and the one line that was actually wrong is fixed
- [x] Files/areas touched listed: `docs/pi-hosting.md` (one numbered step), `docs/decisions/2026-11-01-hardware-identifiers-in-a-public-repo.md` (new), `docs/test-plans/pi-hosting-drive-placeholder.md` (new). **No `src/`, no `worker/`, no `scripts/`, no `supabase/migrations/`**
- [x] Roles affected identified — **none.** Nothing here is reachable by any role, signed in or out
- [x] Anything explicitly **out of scope** written down — §"What was decided" of the decision file: no rotation (nothing to rotate), no rewriting of the historical records that quote a LAN address, and no history rewrite. Each has its reason

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from `origin/main` at this commit, so there was nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing line, as printed:

  ```
  gates: typecheck=0 lint=0 test=0 build=0
  ```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, no database access
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The change is prose. What *can* be checked is that the instruction it replaces the literal with is
true on the real Pi, and that is the one thing left for a person — the file it points at
(`/etc/default/lanna-spare`) was read on the Pi on 2026-10-31 and does record the drive, but this
stream did not run the new wording's commands itself.

- [ ] Happy path works end to end — n/a: no executable change. The runbook step is for Lutan at the Pi and is listed below for a person
- [ ] Data persists — n/a: no page, no data
- [ ] Create / edit / delete all exercised — n/a: no page, no action
- [ ] Empty state renders sensibly — n/a: no page
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: nothing in this change has a boundary

### Role access matrix

Nothing in this change is reachable by a role: two documents, no route, no action, no column.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this change | no change | no change |
| management | nothing in this change | no change | no change |
| staff | retired role (`0173`) | no change | no change |
| doctor | nothing in this change | no change | no change |
| volunteer | nothing in this change | no change | no change |
| signed out | nothing in this change | no change | no change |

- [ ] Every role above tested — n/a: there is nothing any role can reach in this change
- [ ] A role that should not have access is blocked server-side — n/a: no route, action or RPC

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no page added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: a Pi runbook step is not in the shelter users' manual
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no page
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — no page is near it; `build` compiled every route at exit 0
- [x] Any shared file touched checked from a second, unrelated page — n/a is not the honest word: no shared file is touched. `docs/pi-hosting.md` is read by people, not imported by code (`grep -rn "pi-hosting" src worker` finds nothing)
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is cut from `origin/main`, so nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this change closes no backlog item. It was asked for directly, and the writing rule it produced is a new item on the `backlog` branch, which is where new items belong
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-01-hardware-identifiers-in-a-public-repo.md`, which records what was searched, what each published identifier is actually worth, and the five things decided (including the three deliberate *inactions* and why)
- [x] `README.md` still accurate — it says nothing about the drive-mirror partition step or about hardware identifiers, so nothing needed changing
- [ ] **Release notes.** — n/a: no shelter user sees any of this. Two documentation files; nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched
- [x] Commit messages say why, not just what — the commit leads on the destructive-command fault rather than on the serial, because that is the reason the line was wrong even with no public repo
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the decision file's "nothing secret has ever been committed" is the result of actual scans, and it names them so they can be re-run: `git log --all --diff-filter=A --name-only` for env/credential/key files on every branch, and `git log --all -p` filtered for `eyJ…`, `sb_secret_…`, `sb_publishable_…` and service-role-shaped strings. Both came back empty. The repo's public-since date (2026-09-18) is from `gh repo view`, not from memory

## 8. Pre-production gate

**Nothing in this change reaches a deployed build**: two documentation files, no code, no schema. So
these are `n/a` rather than `deferred` — no deploy-time check is waiting on anyone.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing ships to a deployed build
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy follows

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no code is served
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no code is served
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date or time logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or band
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: there is no deploy-time output to paste; the `gates:` line in §2 is the script's own closing line copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var; this change removes a value rather than adding one

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert`, with no deploy and no migration involved. **What it does not cover:** it would put a literal drive back inside an `fdisk` command, which is the fault, so the correct response to a problem here is a fix forward. And it would not un-publish the serial: that string is in git history on a public repository and stays there whatever any file says, which is precisely why this PR is a documentation correction and not a security remedy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | `docs/pi-hosting.md` drive-mirror step 1 named one particular drive's `by-id` inside an `fdisk` command, so the command points at the wrong disk once that drive is replaced — the same fault the section guards against elsewhere by insisting on UUIDs and never `/dev/sda` | fixed in this PR |
| 2 | Low | A drive serial, four LAN addresses and two device models are published in a repository that has been public since 2026-09-18 | accepted, with reasons in the decision file: none is a credential, the Pi's address is already stale, and git history keeps them regardless. The step-1 occurrence is removed as a side effect of defect 1; the records that quote an address are deliberately left alone |
| 3 | — | **Looked for and NOT found, recorded because its absence is the reassuring part:** any committed credential — env file, tunnel credentials JSON, private key, JWT or service-role-shaped string — on any branch, anywhere in history | no action needed; the scans are named in §7 so they can be re-run rather than re-derived |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The new step-1 wording works on the real Pi — that `cat /etc/default/lanna-spare` (or `ls -l /dev/disk/by-id/ \| grep usb`) gives the path the `fdisk` command then needs. The file was read on the Pi on 2026-10-31 and does record the drive, but this stream did not run the new wording end to end, and the step it belongs to is an unfinished one Lutan runs at the Pi | `docs/pi-hosting.md`, "Drive mirror → One-time setup", step 1 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (`pi-hosting-drive-placeholder`)  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; only the person who looks may tick it

Manual verification by: pending: the one row above, which Lutan meets the next time he runs the drive-mirror setup at the Pi. It does not block this PR — the wording it replaces is the one that is wrong

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing here ships to production; no deploy, no migration, no release note

Result: pass with accepted defects

Release manager acknowledgement: n/a: no production step follows from this PR
