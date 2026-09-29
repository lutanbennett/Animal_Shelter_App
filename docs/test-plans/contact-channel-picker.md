# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Settings → Website picker for the preferred contact channel, and one `preferredChannels` helper behind every public contact button |
| Backlog item | `docs/backlog.md` → Settings → Website: let the shelter choose its preferred contact channel |
| Branch / worktree | `claude/contact-channel-picker` @ `C:\Development\Animal_Shelter_contact-channel-picker` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | linked from the PR itself |
| Tested by / date | Claude (contact-channel-picker session), 2026-09-29 |
| Carries a migration? | no (schema was `0111`, PR #210) |
| Tested at SHA | `cc85b5a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the picker and `preferredChannels(content)` exist, and the profile bar, get-in-touch card, footer and phone menu all use it
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/site/channels.ts` (new); `src/app/admin/website/` (picker, form, action); `src/app/adopt/` header, nav, footer, `SitePageView`, `[id]/page.tsx`; dictionaries en and th; manual; releases; docs
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin edits the setting; the signed-out public sees the result
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the picker's browser interaction and each button opening the right app on a real phone are left for manual verification; no new column

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — `origin/main` merged cleanly (only `docs/backlog.md` changed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — `gates: typecheck=0 lint=0 build=0` 

  ```
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: `0111` landed in #210; no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — on dev with the list set to `{whatsapp,messenger}`: `/foster`'s card read WhatsApp, Messenger, LINE with `wa.me` and `m.me` links and the hint "Reach us on WhatsApp, Messenger, or LINE"; an animal profile's bar read "Ask on WhatsApp" opening `wa.me/66812345678?text=Visiting%20Markey`
- [ ] Data persists — reload the page and the change is still there — n/a: the picker's save was not driven (admin sign-in is Google only); the stored list was set by SQL on dev and read back by the public pages. The save itself is on the manual list
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: one setting edited, nothing created or deleted; the save is on the manual list
- [x] Empty state renders sensibly (no rows yet) — cleared channels one by one on dev: WhatsApp cleared → bar became Ask on Messenger; Messenger and LINE cleared too, Instagram set → Ask on Instagram opening the profile; preferred `{phone}` → only Book a visit (a call), no duplicate button. Dev row restored to `{line}` afterwards
- [x] Invalid input is rejected with a readable message, not a crash — unknown or repeated names in `preferred_channels` are dropped by the action and the helper; a listed channel with no value is skipped when read, never a save error
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: a six-value list with no free text; empty list and unset channels are covered by the line above

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Website picker | can edit (`hasAdminRole` in the action, unchanged) | not driven, see manual list |
| management | — | n/a: page and action are admin-only, unchanged | n/a |
| staff | — | n/a: as above | n/a |
| vet | — | n/a: as above | n/a |
| volunteer | — | n/a: as above | n/a |
| signed out | `/foster`, `/adopt/<id>` | buttons in the chosen order (fetched on dev) | pass |

- [ ] Every role above tested — n/a: only the settings form is role-gated and its gate is untouched; the public result was fetched signed out
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: the action's `hasAdminRole` check is unchanged

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav entry added
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — a Preferred way to contact us step in the public website topic, and the bar's wording on the resident profile line; the manual has no Thai file
- [x] Translatable strings go through the translation path, checked at `/management/translations` — new site strings are in both dictionaries (`contactChannels`); no admin-typed text, so nothing new for the queue
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven; on the manual list for a person with a phone
- [ ] Browser console clean — no errors or React warnings — n/a: the admin form was not opened in a browser (Google sign-in); public pages returned 200 with no server errors in the dev log
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: as above

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/foster`, `/adopt` and an animal profile on dev, default `{line}`: card, footer and bar carry the same content as before (LINE first, then phone, then email)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — the header, footer and dictionaries are loaded by every public page; `/foster` and a profile were loaded, not read
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync merged only a backlog edit

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked, with the feature-half note
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — appended 2026-09-29
- [x] `README.md` still accurate — the README does not describe contact settings
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — a line added to `unreleased` in `src/lib/releases.ts`
- [x] Commit messages say why, not just what — yes
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the fallback behaviour and prefilled links were read back from the running dev pages, not reasoned

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager at deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: no date or time logic
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no threshold or banding
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — the gates line below is the script's own output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager after deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager at deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover**. `npx wrangler rollback --env production` reverts the Worker in seconds; it does **not** revert migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — `wrangler rollback --env production` reverts the Worker; nothing to revert in the database, since this PR adds no schema and the column it reads already exists

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `typecheck` caught the picker reading a `.number` that a failed WhatsApp check does not have | fixed before commit |

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
at it, separately from deploying?** A vet's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | Settings → Website shows the picker under the contact fields, listing only channels with a value; the arrows reorder; Save; reload keeps the order; then the public page follows it | `/admin/website` on dev (admin, Google sign-in) |
| 2 | Clear the LINE id in the form and save: LINE leaves the picker and the public bar falls back to the next channel | `/admin/website`, then an animal profile |
| 3 | On a phone, each button opens the right app: Ask on LINE, Messenger, WhatsApp (message typed), Instagram profile, Call, Email | an animal profile on a phone, once each channel is set |
| 4 | The picker rows read well at 375px and in Thai | `/admin/website` on a phone, with the language set to Thai |

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

Automated checks by: Claude (contact-channel-picker session)  Date: 2026-09-29

### Manual verification

Signed only by the person who looked; Claude does not sign it. Left `pending:` until then.

- [ ] n/a: the list above is not empty and nobody has looked yet, so this stays unticked until they do

Manual verification by: pending: the admin picker in a browser and each channel's button on a real phone (rows 1 to 4 above)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch and the PR links to it
- [ ] Handed to the production release manager — n/a: nothing is released by this PR alone; the release manager's pre-deploy pass reads it

Result: pass

Release manager acknowledgement: n/a: acknowledged at release time
