# Feature test plan

## Header

| | |
|---|---|
| Feature | Pi failover (D): put every write on 13 of the 17 `src/app/admin/**` action files through `runWriteAction()`; add nothing to `WRAPPED_WRITE_PATHS` |
| Backlog item | `docs/backlog.md` → **PI FAILOVER: (D) IS BLOCKED, AND NOT BY THE SWEEP…** (Next up) |
| Branch / worktree | `claude/write-paths-admin` @ `C:\Development\Animal_Shelter_write-paths-admin` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | 4862f4a7 (plus this plan's own commit) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed — 13 action files and 18 client components under `src/app/admin/**`; one new `scripts/check-wrapped-write-paths.mjs`; one decision file; the backlog item's title and note. No `worker/`, no `supabase/migrations/`, no change to `src/lib/write-requests.ts` or `src/lib/action-result.ts`
- [x] Roles affected identified — **by card, not by role** (`CLAUDE.md`): the writes touched are gated by the cards granting `facility.enclosures`, `reference.types`, `item settings` (`canEditItemSettings`), the shop and website cards, and Admin-at-2-step for Who does what and Stocktaking. **No gate was changed**: every `can(...)`, `hasAdminRole()` and `hasTwoStep()` check is exactly as it was, and no control's visibility changed
- [x] Anything explicitly **out of scope** written down — nothing added to `WRAPPED_WRITE_PATHS` (so no behaviour change at all); `website`, `security`, `status` and `security/verify` not converted; the shared header's writes and `src/app/management/**` not touched. All four are in the decision file, sections 3 and 8

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration. The `0292` functions this stream calls were re-proved against real rows anyway: `node scripts/prove-write-requests.mjs` passes (output under **Evidence**)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Driven on `/admin/zones` as Admin on dev, reached by clicking through from Settings, with
`requestAnimationFrame` confirmed firing first. The other twelve files were **not** driven
individually — see **Left for manual verification**.

- [x] Happy path works end to end — two zones added through the form; both saved
- [x] Data persists — reloaded `/admin/zones`, both rows still there
- [x] Create / edit / delete all exercised (whichever the feature has) — create (form, `useWriteForm`) and move (direct call, `useWriteCall`) both driven on zones; `wrD-zone-9kyz8` moved 18 → 17. Edit and delete not pressed; they are the same `useWriteCall` shape as move
- [x] Empty state renders sensibly — unchanged by this stream; the zones list was non-empty, and no rendering code was touched
- [x] Invalid input is rejected with a readable message, not a crash — a create with a duplicate name answered `{"ok":false,"error":"duplicate key value violates unique constraint \"zones_name_key\""}` rather than throwing
- [x] Boundary cases checked — the boundary that matters here is the request id itself: a replay of the identical request returned the **stored** first result and wrote nothing; the same request with a **fresh** id ran the body and was refused by the unique index. That pair is the proof, and the control that makes it mean anything

### Role access matrix

**Not re-run, and deliberately.** This stream changed **no** permission check and **no** control's
visibility — only how an already-permitted write *calls* into the database. Re-running the matrix
would measure the gates that were already there. It would also be **analysis by role**, which
`CLAUDE.md` forbids: the cards are what carry these writes, and they are listed in section 1.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/zones` and the other 12 converted pages | unchanged | unchanged; zones driven, writes succeed |
| management | — | unchanged | n/a: no gate changed |
| staff | — | retired role (`0173`) | n/a |
| doctor | — | unchanged | n/a: no gate changed |
| volunteer | — | unchanged | n/a: no gate changed |
| signed out | — | unchanged | n/a: no gate changed |

- [ ] Every role above tested — n/a: no permission check and no control's visibility was changed, so there is nothing new for a role to be able or unable to do
- [x] A role that should not have access is blocked server-side — every action's `can(...)` / `hasAdminRole()` / `hasTwoStep()` guard is **inside** the `runWriteAction` body, exactly where it was inside `runAction`, so a refusal still happens server-side before any write. Confirmed by reading all 13 files' diffs

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added, removed or moved
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a reader of the manual can see changed, and that file belongs to `manual-access-by-cards` this batch
- [ ] Translatable strings — n/a: no new user-facing string. The three words `runWriteAction()` needs (`somethingWentWrong`, `saveUnknown`, `reloadToSave`) already exist in both dictionaries from stream (C)
- [ ] Mobile viewport (375px) — n/a: no markup or layout changed; the only client-side changes are hook calls and the arguments passed to actions
- [x] Browser console clean — no errors or React warnings on `/admin/zones` beyond those caused by this stream's own `window.fetch` instrumentation, which was removed; see the note in the decision file, section 4
- [x] Network clean — the POSTs to `/admin/zones` returned 200. The `net::ERR_ABORTED` entries seen mid-session were caused by the `fetch` patch used to read the request body, not by the app

## 6. Regression

- [x] The pages nearest the change still work — `/admin` (the Settings hub, which links all of them) and `/admin/zones` loaded and behaved normally
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file was changed. `src/lib/action-result.ts`, `src/lib/use-write-form.ts` and `src/lib/write-requests.ts` are **used** by this stream and **not edited** (`git diff --stat` confirms); the only non-`src/app/admin/**` file added is a new script that nothing imports
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates and the 412-test suite pass after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — **not ticked, on purpose**: 13 of 17 files, and the blocker found means (D) is further from done than the item claimed. The title was rewritten so it alone says what is open, and a dated note records what was converted and what is left
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-write-paths-admin-sweep.md`
- [x] `README.md` still accurate — it does not describe write paths or `WRAPPED_WRITE_PATHS`; nothing in it became untrue
- [ ] **Release notes.** — n/a: nothing was added to `WRAPPED_WRITE_PATHS`, so every page behaves exactly as it does today and no shelter user can notice anything. Even if a path had been listed, production is behind on `0292` and the Worker is not redeployed, so a note would be false until that ships (`docs/decisions/2026-10-11-release-note-truth-rule.md`)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The central claim — that the shared header puts unwrapped writes on every address — is backed by a script that derives it from the import graph (`scripts/check-wrapped-write-paths.mjs`) and was confirmed in the browser (the Assistant button is drawn in the header on `/admin/zones`). The replay/fresh-id pair in section 4 is the measured output of two real requests, pasted unedited into the decision file

## 8. Pre-production gate

**This change alters no runtime behaviour** (nothing was listed), so there is nothing on a deployed
build that could differ. The deploy-time lines are still `deferred:` rather than `n/a:`, because the
deploy has not happened and saying "did not apply" would be the lie the template warns about.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — deferred: release manager. Nothing in this change derives a date; the only new value is a v4 uuid
- [ ] Boundary or banding change covers both edges — deferred: release manager. The boundary here is the request id, proved both ways in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — see **Evidence**
- [ ] Public pages re-checked after a cache purge — deferred: release manager. No public page is touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — deferred: release manager. This change adds none

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration in this PR. **But read this before deploying:** the code this stream extends calls `claim_write_request()` and `finish_write_request()`, which are `0292`, and production has not had `0292` applied. `scripts/deploy.mjs` already refuses a deploy whose migrations are not all applied, so the ordering is enforced mechanically rather than by this line
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — nothing was added to `WRAPPED_WRITE_PATHS`, so reverting this PR changes no runtime behaviour; it only returns 13 action files to `runAction`. The Pi rollback is `./scripts/pi/deploy-pi.sh --ref <sha>`; `npx wrangler rollback --env production` reverts only the Worker. Neither reverts migrations, and this PR has none

## Evidence

```
node scripts/prove-write-requests.mjs
write_requests proofs: all passed against test (project qxkmhwybjggxvsfxsxbd), nothing kept.
The Management API does not return notices, so a pass is the absence of a raised exception;
any failed proof arrives as an error naming its number. See the header for what each one is.
```

```
node scripts/check-worker-origin.mjs
ok   /admin/units is wrapped
ok   a near miss is not wrapped
ok   the Worker default and the browser wait agree on the Pi attempt
ok   wrapped POST, origin answers 504: rendered locally with its body
ok   wrapped POST, origin takes the write then drops the connection: rendered locally
ok     …and the write really had arrived at the Pi as well
ok   wrapped POST, origin accepts and never answers: rendered locally after ORIGIN_TIMEOUT_MS
ok   unwrapped POST, origin accepts and never answers: still waiting well past ORIGIN_TIMEOUT_MS
ok   wrapped POST, the Pi answers: passed through, never rendered locally
ok   wrapped GET, origin answers 504: rendered locally, as every GET always has
ok   Pi, right key: let through
ok   Pi, wrong key: refused
ok   Pi, no header: refused
ok   Pi, empty header: refused
ok   Worker (key in process.env, no PHOTO_CACHE_DIR), no header: let through, else the site locks itself out
ok   next dev (neither set): let through
ok   Pi without ORIGIN_KEY: no check
ok   src/proxy.ts calls originKeyRefuses before updateSession
ok   the Pi's env file carries ORIGIN_KEY
all cases ok
```

```
node scripts/check-wrapped-write-paths.mjs
LISTED /admin/units  (5 unwrapped)
    NOT  src/app/account/theme/actions.ts  setOwnTheme
    ok   src/app/admin/units/actions.ts  createUnit, updateUnit, setUnitArchived
    NOT  src/app/assistant/actions.ts  assistantMove, assistantBookClinicVisit, …
    NOT  src/app/assistant/interpret.ts  interpretRequest
    NOT  src/app/assistant/lookups.ts  assistantLookup
    NOT  src/lib/i18n/set-locale.ts  setLocale

THE WHOLE-PAGE RULE IS BROKEN on these listed paths:
  /admin/units: src/app/account/theme/actions.ts, src/app/assistant/actions.ts, src/app/assistant/interpret.ts, src/app/assistant/lookups.ts, src/lib/i18n/set-locale.ts
A listed path with an unwrapped write is the #250 double write. Take it off the list or wrap the writes.
```

The browser proof on `/admin/zones`, as the browser reported it:

```
POST /admin/zones  _1___writeRequest=98c74928-1af8-4ff8-97de-f7445e30d964
replay (identical request): {"ok":true,"success":"Created zone \"wrD-zone-37m7x\"."}
fresh id (the control):     {"ok":false,"error":"duplicate key value violates unique constraint \"zones_name_key\""}
rows afterwards:            18 wrD-zone-9kyz8 | 19 wrD-zone-37m7x   (two creates, two rows; the replay made none)
```

The `gates.mjs` closing lines are pasted into the PR body at the commit they were run against.

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **High (not live)** | `/admin/units` is on `WRAPPED_WRITE_PATHS` while twelve unwrapped, non-idempotent assistant writes are reachable at that address through the shared header, plus `setOwnTheme` and `setLocale`. A Worker replay of one of those is the #250 double write | **Accepted and reported, not fixed.** Not reachable in production: it is behind `0292`, which production has not had applied, and `scripts/deploy.mjs` refuses the deploy until it is. Taking the path off the list would empty it and fail `check-worker-origin.mjs:204`, and weakening that check was out of scope. Recorded in the decision file §1, in the backlog item, and in `scripts/check-wrapped-write-paths.mjs`, which reports it on every run |
| 2 | Low | Three admin addresses reach writes under `src/app/management/**` through shared components (`ItemUnits`, `TranslationPanel`), so an admin-area stream cannot finish them | Deferred to backlog — it is a sequencing fact about the (D) programme, recorded in the decision file §2 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The twelve converted pages other than zones: press each write once and confirm it still saves. They share one proven mechanism and all pass typecheck, lint and the suite, but only zones was actually driven | `/admin/blood-test-types`, `/admin/procedure-types`, `/admin/immunization-types`, `/admin/medications`, `/admin/enclosures`, `/admin/stocktaking`, `/admin/recent-changes`, `/admin/shop`, `/admin/diets` (+ `[id]`, `ingredients`, `ingredients/[id]`), `/admin/who-does-what` (+ `features`), `/admin/facility-map` |
| 2 | The two file uploads specifically, because their request id is attached by hand rather than by `useWriteForm` | Shop → a link's photo; Facility map → Add plan and Replace plan |
| 3 | Who does what, because its writes change permissions and it is the one screen that can lock an administrator out. A card add, a card remove and a drag that reorders | `/admin/who-does-what` (Admin at the authenticator-app step) |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looks may tick it; the three items wait for a person

Manual verification by: pending: the twelve converted pages other than zones have not been pressed by a person, the two uploads have not been exercised, and Who does what has not been driven

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing here changes a deployed build's behaviour, and the release manager's own pre-deploy pass covers section 8

Result: pass with accepted defects

Release manager acknowledgement: n/a
