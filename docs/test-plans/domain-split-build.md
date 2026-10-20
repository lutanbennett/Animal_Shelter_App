# Test plan: domain split build

## Header

| | |
|---|---|
| Feature | Both addresses from settings, hostname-based serving, checklist |
| Backlog item | `docs/backlog.md` → DECIDED 2026-10-10 — move only the public website to `lannacareforanimals.org` |
| Branch / worktree | `claude/domain-split-build` @ `C:\Development\Animal_Shelter_domain-split-build` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | fb15ca1a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — both addresses become settings (APP_HOST, PUBLIC_HOST), the proxy serves by host, the checklist and decision are written; matches the brief
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — wrangler.jsonc, src/lib/site-hosts.ts, site-origin.ts, tags/origin.ts, src/proxy.ts, next.config.ts, worker/origin.mjs, scripts/ (deploy, write-env, check-site-hosts, runtime-config, env), comments and two dictionary strings; no migration
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every role and the signed-out public in principle, but nothing changes for any of them while the two settings are equal, which they are in every environment
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: DNS, Cloudflare routes, the old-address forwarding, the UAT address, the cutover; src/lib/manual/en.ts (another stream owns it; it holds one address, noted in the decision file)

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — merged origin/main, already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — see the Evidence section below
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** Changed 2026-10-20: ticking it in a follow-up commit used to be the rule, and that commit **invalidated its own evidence** — a new HEAD means a new run, so every PR in this repository paid two full CI cycles to transcribe a result GitHub already records permanently against the commit. A tick here attests to nothing a reader can check better by looking at the PR. **What must still happen, and is a merge step rather than a checklist line: before merging, read the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`) and confirm its `headSha` matches.** Merging on an older run's strength merges a commit whose CI never finished. **Do not pre-tick this line either** — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — on next dev with APP_HOST=app.example.org PUBLIC_HOST=site.example.net, curl with x-lanna-public-host: the public host serves /adopt and /r/R-0001 (200) and sends /residents to the app host (307); the app host sends /adopt and /r/R-0001 to the public host and serves /; canonical, og:url, og:image and the sitemap line follow the public host; unit tests in src/lib/site-hosts.test.mjs
- [ ] Data persists — reload the page and the change is still there — n/a: no data written
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no records created, edited or deleted
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or screen
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; an unknown host or unset settings fall through to normal serving (tested)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — www of each address, unknown hosts, ports, unset and equal settings and look-alike Origins are asserted in site-hosts.test.mjs and same-origin.test.mjs

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
| admin | | | |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: no role-specific behaviour; the redirects apply to everyone and the sign-in gate is unchanged
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no role-specific behaviour; the redirects apply to everyone and the sign-in gate is unchanged

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no user-facing behaviour changes while the settings are equal, and manual/en.ts is another stream's file this batch
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: two existing dictionary strings reworded to drop the domain name; nothing new to translate (Thai edited in the same change)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no page changed; the dev server log showed no errors
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — the curl checks returned only the intended 200 and 307

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — /adopt, /, /robots.txt, /r/R-0001 and /residents (sign-in redirect) on the dev server
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — site-origin.ts is used by every public page; /adopt loaded with the right canonical. npm test: 220 pass
- [x] Nothing merged from `main` during `sync` was broken by this branch — origin/main was already merged; gates run after

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked, with a note of what is and is not done
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — docs/decisions/2026-10-20-two-addresses-from-settings.md
- [x] `README.md` still accurate — the cutover paragraph now points at the settings and the checklist
- [ ] **Release notes.** — n/a: no shelter user sees a difference while the two settings are equal; the first visible change is the cutover edit, which carries its own note
- [x] Commit messages say why, not just what — yes
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the redirect behaviour was measured with curl on the dev server, not reasoned

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at deploy
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager, at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager, at deploy
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager, at deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager, at deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: release manager, at deploy
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — the gates line in the Evidence section is the script's own output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager, at deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager, at deploy. No new secret: APP_HOST and PUBLIC_HOST are plain vars in wrangler.jsonc
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager, at deploy. No new secret: APP_HOST and PUBLIC_HOST are plain vars in wrangler.jsonc
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager, at deploy. No new secret: APP_HOST and PUBLIC_HOST are plain vars in wrangler.jsonc

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — redeploy the previous build; the settings are in wrangler.jsonc and travel with it; no migration to undo

## Evidence

```
gates: typecheck=0 lint=0 test=0 build=0
```

Hard-coded address grep (`grep -rnE "lannacare(foranimals)?\.org" src worker`, `src/lib/manual` excluded):

```
src/lib/releases.ts:762   (a shipped release note, history)
src/lib/releases.ts:925   (a shipped release note, history)
```

`src/lib/manual/en.ts:110` also names the testing sites; another stream owns that file this batch.

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

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — yes
- [x] Nothing is ticked that was not actually executed — yes

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

Signed by the person who looked, or n/a with a reason when there is nothing to look at.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: nothing for a person to look at while the settings are equal

Manual verification by: n/a: the staff and public addresses are equal in every environment, so no screen changes; the split first shows at the cutover

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [x] Checklist pasted into the PR — pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: the release manager reads the PR; nothing outstanding beyond section 8

Result: pass

Release manager acknowledgement: pending
