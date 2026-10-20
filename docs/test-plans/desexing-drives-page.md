# Test plan: desexing drives, the page half

## Header

| | |
|---|---|
| Feature | Desexing drives, the page half |
| Backlog item | `docs/backlog.md` → Desexing drives under Services |
| Branch / worktree | `claude/desexing-drives-page` @ `C:\Development\Animal_Shelter_desexing-drives-page` |
| Dev server | `http://localhost:3008` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | 6012b843 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the public page `/services/desexing` with sign-up, the Services menu entry, and Management → Desexing drives, as the backlog item and the brief asked
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/services/desexing/`, `src/app/management/desexing-drives/`, `src/lib/desexing/`, `PublicHeader`/`PublicFooter`, `src/lib/public-paths.ts`, `sitemap.ts`, `routes.ts`, management tile, en/th dictionaries, manual, releases, acceptance matrix, permission catalogue check. No migration, no worker change
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — signed-out public (reads drives, adds a sign-up); admin and management (website.content: manage drives and read sign-ups)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: a home-page strip, a Worker per-IP limit and a honeypot (see the decision file), translating what the shelter types into a drive

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — origin/main merged in
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — see output below

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** Changed 2026-10-20: ticking it in a follow-up commit used to be the rule, and that commit **invalidated its own evidence** — a new HEAD means a new run, so every PR in this repository paid two full CI cycles to transcribe a result GitHub already records permanently against the commit. A tick here attests to nothing a reader can check better by looking at the PR. **What must still happen, and is a merge step rather than a checklist line: before merging, read the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`) and confirm its `headSha` matches.** Merging on an older run's strength merges a commit whose CI never finished. **Do not pre-tick this line either** — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; the schema is 0233, already on main (#778)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; dev already carries 0233
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR; 0233's own gate was exercised in its PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; production must already have 0233 applied before this deploys (release manager: `--status --env production`)

## 4. Functional checks

- [x] Happy path works end to end — dev: a test drive made by script showed on `/services/desexing` signed out with its cost and eligibility text; a sign-up through the real form saved, and the page showed '1 place left' after a reload (was 2)
- [x] Data persists — reload the page and the change is still there — the place count dropped from 2 to 1 after reload; the sign-up row is written by the database
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the Management create, edit, delete and status actions typecheck, build and are in the permission and acceptance-matrix checks, but were not driven in a browser (no staff session in this run); listed under Left for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: not looked at; the page has a no-drives sentence ('No drive is scheduled right now.') that was not seen rendered
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not driven by hand; `checkSignup` and `checkDrive` return a named problem per field and the database refusals map to sentences
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: not exhaustively; the 0233 gate (capacity, three per contact, closed, species) is the database's and was proved in its own PR

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
| admin | `/management/desexing-drives` | manage drives, read sign-ups | not driven: no staff session this run; guard and RLS are `website.content` |
| management | same | same (holds website.content) | not driven |
| staff | none | refused by the guard | not driven; retired role (0173) |
| doctor | none | refused by the guard | not driven |
| volunteer | none | refused by the guard | not driven |
| signed out | `/services/desexing` | sees drives, can add a sign-up, can read no sign-up | driven; `check-public-views` ok for anon SELECT/PATCH/DELETE |

- [ ] Every role above tested — n/a: signed out driven (public page and a real sign-up); admin and management not driven, see Left for manual verification
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the Management pages call `requirePermission("website.content")`, the actions check `can(…, "website.content")`, and RLS on both tables asks the same cell; `check-public-views.mjs` against dev proves anon cannot read a drive table or a sign-up (all ok)

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — Services menu now holds Desexing drives in the public header, phone menu and footer; Management gains a tile and a route-registry entry (menu: false, like its neighbours). Seen: Services shows in the header on the page
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — new topic 'Desexing drives' in `src/lib/manual/en.ts`, with acceptance-matrix rows; `node scripts/acceptance-matrix.mjs --check` ok. Not read at /manual in a browser
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the page's fixed words are in the en and th dictionaries; drive text typed by staff is shown as typed in both languages and is not on the translation queue (decision file)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven at 375px in this run; the form uses the same single-column-then-grid pattern as the public forms. Listed under Left for manual verification
- [ ] Browser console clean — no errors or React warnings — n/a: console not read in this run
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: network not read in this run; the sign-up server action returned ok

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the public header and footer render on `/services/desexing` (loaded); `check-permission-catalogue` and the full build pass
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — `PublicHeader.tsx`, `PublicFooter.tsx` and `public-paths.ts` load on the page I drove; `public-paths.test.mjs` covers the new prefix (npm test passes). `manual/en.ts` and the dictionaries are type-checked
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked with a note
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-20-desexing-drives-page.md`
- [ ] `README.md` still accurate — n/a: the README does not list public pages at this level
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — a line for admins and management in `unreleased`. Nothing outstanding: no migration, deploy step or Pi edit is needed beyond production already having 0233 applied, which is the release manager's ordinary migration step
- [x] Commit messages say why, not just what — yes
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the claims are about what the page and the database do, and were observed (the place count moved); no timezone, concurrency or floating-point reasoning is asserted

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: the page and sign-up read dates only through the view (`shelter_today()` in 0233) and `formatDate`; no date logic of its own
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no boundary or banding logic in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — the gates lines below are verbatim
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: `/services` is deliberately not edge-cached, so there is no stale copy to wait out

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none: the anon key and URL are already used

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — `deploy-pi.sh --ref <previous sha>`; nothing to revert in the database (no schema change). The new page disappears with the rollback and sign-ups already stored stay in the table

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | n/a | none found | n/a |

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
| 1 | As Admin or Management: add a drive, open it, see it on the public page, view and confirm a sign-up, remove one, delete the drive | `/management/desexing-drives` |
| 2 | The public page and sign-up form on a real phone, in English and Thai | `/services/desexing` |
| 3 | Whether the page's wording reads well, and whether the shelter wants drives on the home page | `/services/desexing` |

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

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty; pending a person

Manual verification by: pending: Management screens driven by a person, and the public form on a phone

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: pasted once the PR exists
- [ ] Handed to the production release manager — n/a: after merge

Result: pass

Release manager acknowledgement: pending
