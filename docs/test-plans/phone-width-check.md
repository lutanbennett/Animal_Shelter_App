# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `scripts/check-phone-width.mjs`: a 375 px overflow guard, run by hand and in the release smoke test |
| Backlog item | `docs/backlog.md` → Mobile: A 375 px overflow check, so a page that scrolls sideways fails before it ships |
| Branch / worktree | `claude/phone-width-check` @ `C:\Development\Animal_Shelter_phone-width-check` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3022` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-05 |
| Carries a migration? | no |
| Tested at SHA | `ba8dd34f` (gates re-run after syncing `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a script that opens each page at 375 px in English and Thai, as several roles, against long-named seed data, and fails naming the element that scrolls the page sideways
- [x] Files/areas touched listed: `scripts/check-phone-width.mjs` (new), `docs/release-smoke-test.md`, `docs/decisions/2026-10-05-phone-width-check.md`, `docs/backlog.md`. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: no app role is affected; the script signs in as six throwaway dev logins (admin, management, staff, vet, volunteer, head_of_medical) and deletes them
- [x] Out of scope written down: fixing the three pages it found (filed on the `backlog` branch), 44 px tap targets (offered, filed), `/admin/security` (needs 2-step), widths other than 375 px, and wiring it into `gates.mjs` or CI on purpose

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, as printed:
  ```
  === gates: build exited 0 after 137s
  gates: typecheck=0 lint=0 build=0
  ```
  `grep -c check-phone-width scripts/gates.mjs package.json` prints 0 for both: the script is not wired into the gates or any npm script
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

All run against dev (`qxkmhwybjggxvsfxsxbd`; the script refuses any other project) and a dev server on port 3022.

- [x] Happy path works end to end: seeds rows, creates six logins, signs each in, measures, prints, cleans up. Full run: `326 page view(s) measured (admin, management, staff, vet, volunteer, head_of_medical; en + th), 242 skipped because the role cannot open them, 0 warning(s). 10 page view(s) overflow.`
- [x] Data persists — cleanup was checked in place of persistence: `--clean` after a killed run removed 2 residents, 1 contact, 1 vet, 1 enclosure, 1 zone and the throwaway logins, and a following run left nothing behind
- [x] Create / edit / delete all exercised: create (seed rows, logins) and delete (cleanup, `--clean`); there is no edit
- [x] Empty state: a page no role can open is reported `skipped` and does not fail; redirects (`/home` to `/admin`, `/appointments` to `/no-access`, `/admin/security` to the 2-step page) are skips
- [x] Invalid input is rejected with a readable message: unknown `--roles` / `--locales`, a non-dev project, or a server that is not running exit 2 with what to do
- [x] **A guard nobody has seen fail is not a guard.** With the base-layer rule `.grid { grid-template-columns: minmax(0, 1fr) }` removed from `src/app/globals.css` (restored afterwards with `git checkout`), `--roles=admin --locales=en` reported `FAIL admin en /vets scrolls sideways by 373 px` at `span.shrink-0.whitespace-nowrap … "Nothing scheduled"` and `FAIL admin en /contacts … by 234 px`, exit 1. With the rule restored the same pages pass. `/enclosures` was not in that run (Git Bash rewrote the first `--pages=/…` argument into a Windows path; the usage comment now says to prefix `MSYS_NO_PATHCONV=1`), so the 117 px Enclosures case was not re-created
- [x] Boundary cases: a long enclosure, zone, vet clinic, contact name, email and address, and a long resident name are seeded; the Thai run measures the app's own Thai labels against the same English data
- [x] Red is real: in the full run there were 0 warnings, and each FAIL is a page that does scroll (the Carer picker was inspected: `select#carerId` 595 px wide)

### Role access matrix

Not an app feature, but the script is role-dependent, so which roles opened which pages is the coverage evidence.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the list except `/admin/security` (2-step) and `/appointments` | measured | 3 pages overflow |
| management | management pages and day-to-day screens | measured | 3 pages overflow |
| staff | day-to-day screens | measured | rehome overflows |
| vet | the vet's own set | measured | none overflow |
| volunteer | the volunteer set | measured | none overflow |
| signed out | n/a: public pages are not in the list | n/a | n/a |

- [x] Every role above tested (head_of_medical was run too; signed out is n/a)
- [ ] A role that should not have access is blocked server-side — n/a: this script measures width and treats a refusal as a skip; it does not test access

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling; the release smoke test is its manual and was updated
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: this is the check for it; no page changed
- [ ] Browser console clean — n/a: no app page changed
- [ ] Network clean — n/a: no app page changed

## 6. Regression

- [x] The nearest things still work: `manual-screenshots.mjs` is untouched, and `gates.mjs` runs without the script
- [x] Shared files touched (`docs/release-smoke-test.md`, `docs/backlog.md`) re-read after editing; one line added to each
- [x] Nothing merged from `main` during `sync` was broken: typecheck, lint and build exit 0 on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the three overflowing pages and the tap-target option are on the `backlog` branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-05-phone-width-check.md`: roles and why, how accounts are made, the seed data, where it runs and does not
- [ ] `README.md` still accurate — n/a: it does not describe the scripts folder
- [ ] **Release notes.** n/a: a developer guard run by hand; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The role subset is a judgement and is written as one; the 326 / 242 / 10 counts and the +373 / +234 px figures are from the runs above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing deploys, a script run by hand
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** — n/a: not a boundary change; the 1 px tolerance is rounding slack only
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: nothing deploys
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added; it reads the existing dev service-role key from `.env.local`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. Nothing is deployed and no schema changed. A run killed half-way can leave `ZZ Width` rows and `phonewidth-*` logins in dev; `node scripts/check-phone-width.mjs --clean` removes them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Rehome page: Carer picker 595 px wide, page scrolls +244 px (admin, management, staff; English and Thai) | deferred to backlog (Mobile) |
| 2 | low | `/management/medications` and `/management/diets`: "Stock between counts" link is `shrink-0` at 377 px, +88 px | deferred to backlog (Mobile) |
| 3 | low | A run killed half-way left seed rows and logins in dev | fixed: `--clean` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs a person to look: every behaviour is a command with an exit code, run above. Optional: run `node scripts/check-phone-width.mjs` once and read the output.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-05

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no visual surface; the output is text with an exit code

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: n/a (tooling only)  Date: 2026-10-05
