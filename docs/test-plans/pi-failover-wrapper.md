# Feature test plan

## Header

| | |
|---|---|
| Feature | Pi failover (C): the shared write wrapper and the Worker replay rule |
| Backlog item | `docs/backlog.md` → Next up → **PI FAILOVER** |
| Branch / worktree | `claude/pi-failover-wrapper` @ `C:\Development\Animal_Shelter_pi-failover-wrapper` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened from this branch; see the PR body for the per-deliverable account |
| Tested by / date | Claude (stream `pi-failover-wrapper`) / 2026-10-31 |
| Carries a migration? | no — `0292` landed with stream (B) and is already on `main` |
| Tested at SHA | `a326e70e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

**One sentence:** a write that goes through `runWriteAction()` carries a request id the database
refuses a second time, so the Worker may now serve a write the Pi did not clearly answer instead of
refusing it.

**Touched:** `src/lib/action-result.ts` (new `runWriteAction()`), `src/lib/write-requests.ts` (new),
`src/lib/use-write-form.ts` (new), `src/lib/use-kept-form.ts` (one optional parameter),
`worker/origin.mjs`, `worker/index.mjs` (header comment), `src/app/admin/units/` (the one proven
path: `actions.ts`, `CreateUnitForm.tsx`, `UnitsTable.tsx`), the `common` block of both i18n
dictionaries, `scripts/check-worker-origin.mjs`, `scripts/test-support/` (a `next/navigation`
stand-in), `src/lib/action-result.test.mjs` (new), and the docs. **No migration.**

**Roles affected: none.** This change alters no access check. `/admin/units` keeps
`canEditItemSettings` exactly as it was, the `units` table's own write policy is untouched, and the
two database functions are gated on `holds_app_role()` — "is this login in the app at all" — which
every signed-in login already passes and which is card-derived since `0259`. No role key, no role
name and no role column is read anywhere in this change.

**Out of scope, deliberately:** (D), the other 56 `runAction` call sites. Only `/admin/units` is
wrapped and only `/admin/units` is on `WRAPPED_WRITE_PATHS`; every other path behaves exactly as it
did before this PR, which `scripts/check-worker-origin.mjs` asserts in both directions.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 170s

gates: typecheck=0 lint=0 test=0 build=0
```

Also run, and green:

```
node scripts/check-worker-origin.mjs      → all cases ok (30 cases, 10 of them new)
node scripts/prove-write-requests.mjs     → all passed against test, nothing kept
npm test                                  → tests 395, pass 395, fail 0
node scripts/check-backlog-sections.mjs   → ok — 59 open items, all above `## Completed`
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; `0292` landed with stream (B)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; `0292` was applied to dev on 2026-10-31 by stream (B)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; nothing this PR writes changes an existing column
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR, and the two functions this code calls are exercised against real rows by `node scripts/prove-write-requests.mjs`, re-run and passing at this SHA
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR. **But the ordering matters the other way round and is in section 8:** `0292` must be applied to production before this code deploys

## 4. Functional checks

Driven in the browser pane as Admin on dev (`dev-signin.mjs admin --port 3006`), reaching
`/admin/units` by clicking Settings and then Units — never by typing the address — with
`requestAnimationFrame` confirmed firing before anything was recorded.

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [x] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows yet) — n/a: the units list is never empty on dev and this PR does not change what the page renders, only how its three saves reach the database
- [x] Invalid input is rejected with a readable message, not a crash
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

What was actually driven, and the numbers:

1. **The id travels.** The POST to `/admin/units` carried
   `_1___writeRequest=f9bcf3e0-5fee-4813-9be7-95319e4d0fcc`, a v4 uuid, and the save succeeded
   ("Added the unit …"). The unit is in the list after a reload.
2. **A replay returns the stored first result.** The identical request was re-sent, as the Worker
   would after a failed Pi attempt: `{"ok":true,"success":"Added the unit \"wr-replay-…\""}` — the
   **first** attempt's own answer, and no second unit.
3. **The control that makes (2) mean something.** The same request with a **fresh** id answered
   `{"ok":false,"error":"There is already a unit called \"wr-replay-…\""}`, so the body genuinely
   runs for a new id and the unique index genuinely refuses the duplicate.
4. **The rows agree.** `write_requests` on dev holds exactly three rows for `units.createUnit` — two
   `ok:true` and the control's `ok:false`, all finished. The replay created no row.
5. **Invalid input** (a duplicate name) is the refusal in (3), in words, and the refusal is itself
   stored, so replaying a refused save is refused the same way.
6. **Boundary cases** are covered by assertion rather than by typing: `src/lib/action-result.test.mjs`
   drives a missing id, a malformed id, an unrecognised claim answer, a claim that errors, a finish
   that fails, a thrown body and a Next redirect through the wrapper. `n/a` on dates and numbers —
   this change carries neither.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/units` | add, rename and archive a unit | driven end to end; all three saves wrapped and working |
| management | unchanged | whatever `canEditItemSettings` already allowed | not driven; no access check in this PR changed |
| staff | — | retired role (`0173`) | n/a |
| doctor | unchanged | whatever `canEditItemSettings` already allowed | not driven; no access check in this PR changed |
| volunteer | unchanged | whatever `canEditItemSettings` already allowed | not driven; no access check in this PR changed |
| signed out | `/admin/units` | refused by the proxy, as before | not driven; the proxy gate is untouched |

- [ ] Every role above tested — n/a: this change alters no access check, so a per-role pass would measure the gate that stream (B) and `0259` already set rather than anything in this PR. `canEditItemSettings` on `/admin/units` and the `units` write policy are byte-for-byte unchanged, and the two new database calls are gated on `holds_app_role()`, which every signed-in login passes. Admin was driven end to end
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: unchanged by this PR. The server-side refusal is `refusal()` in `src/app/admin/units/actions.ts`, which still runs first inside every wrapped body, and the table's own write policy behind it

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added or moved; `NavLinks.tsx` is not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a person does changes. The two new sentences appear only when a save cannot be confirmed, and they say what to do in themselves
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: that page manages database rows (the `translations` queue and `label_translations()`), not the code dictionaries. The two new strings, `common.saveUnknown` and `common.reloadToSave`, were added to **both** `en.ts` and `th.ts` in this PR
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout, markup or styling changed; the only new text replaces an existing refusal sentence in the same `<p>`
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

Console and network were read in the pane across the three saves above: the only POSTs were the
three server actions to `/admin/units`, all 200, and no console errors or React warnings.

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**
- [x] Nothing merged from `main` during `sync` was broken by this branch

Pages loaded: `/my` and `/admin` (both after the change, by clicking through), and `/admin/units`
itself. `/my` is the second, unrelated page for the shared files — it renders through the same
layout and i18n dictionary that gained the two `common` strings, and through `useKeptForm`'s module
graph; it rendered with the signed-in header and the tasks list intact. `sync` merged stream
`translations-labels-schema`'s migrations and docs (`0293`, `0294`) with no conflict and no
overlapping file; the full gates were run after the merge, not before.

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item is **not** ticked on purpose, because (D) remains. Its head was rewritten so it reads correctly without its last paragraph: it said "(C) is the next thing to build" and now says (D) is all that is left, with a (C) DONE block naming what shipped
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: the README describes neither the write path nor the Worker's fallback rule, so nothing in it became wrong
- [ ] **Release notes.** — n/a: `0292` is not on production (four migrations are pending there), so a note telling admins that saves now survive the Pi being off would be false until it is applied and the Worker redeployed. `CLAUDE.md` forbids ticking this line while a manual step is outstanding, and the note belongs in the PR that closes that step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

On that last line, because it is the one this PR leans on hardest: the claim that a shared wrapper
cannot give the one-transaction guarantee is not reasoned from the type signature alone — it was
read out of three real write paths and a count of the 62 `.rpc(` call sites, and the repo's own
prior statement of the constraint is quoted in the decision file. The claim that the replay
short-circuits before the body is not inferred from the code either: the control in section 4.3 is
what rules out the unique index having done the work.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this change derives a date or a "today". The only clock it reads is `setTimeout` for the 30 s wait, which is a duration and not a wall time, and `now()` inside `finish_write_request()`, which stream (B) owns
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: there is no band. The one threshold is the 30 s wait, and it is asserted as an identity (`WRITE_WAIT_MS === ORIGIN_ATTEMPT_MS + WORKER_FALLBACK_MS`) in `src/lib/action-result.test.mjs`, so it cannot drift from the Worker's own timeout without failing
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or environment variable. `ORIGIN_TIMEOUT_MS` already exists in `wrangler.jsonc` on both environments and keeps its value of 20000

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR. **The ordering runs the other way and it is the one thing to read before deploying this:** `0292` must be live on production **before** this code, or every wrapped save fails outright (`claim_write_request` does not exist) while the Worker is newly willing to replay. `scripts/deploy.mjs` already refuses a commit whose migrations are not all applied, and `0292` is on `main`, so the guard holds without anything new; `docs/release-procedure.md` section 5 now says why this one matters
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR, and `0292` is purely additive
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR. `0292` is stream (B)'s and is already part of the four pending on production; it must be applied **before** this deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**

**Rollback:** `./scripts/pi/deploy-pi.sh --ref <previous sha>` on the Pi, and
`npx wrangler rollback --env production` for the Worker. **What it does not cover:** nothing, as it
happens — this PR carries no migration, so there is no schema to unwind, and the Worker and the Pi
can be rolled back independently without making anything worse. A Worker rolled back while the Pi
still runs the new code simply returns to refusing a write the Pi did not answer, which is where
production is today. A Pi rolled back while the Worker runs the new code is the one combination to
avoid: the Worker would replay a write to a `/admin/units` whose code does not claim an id. Roll the
Pi and the Worker back together, or the Worker first.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A `useWriteCall` shared between two actions sends one attempt's id to a different action, which the database refuses. Found while wiring `UnitsTable.tsx` | fixed — one per action, with the reason beside it, and the rule written into the hook's own documentation |
| 2 | low | An unwrapped write still has no origin timeout, so it hangs against a wedged Pi | accepted — it has nowhere to fall back to, so bounding it would turn a wait into a refusal and nothing else. It closes path by path as (D) sweeps, and `check-worker-origin.mjs` asserts the hang so nobody "tidies" the two branches to match |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The two new sentences read well to a shelter user in English and in Thai: *"We couldn't tell whether that saved. Press Save again to find out — it will not be saved twice."* and *"This page needs reloading before it can save. Reload it and try again."* Claude wrote both, including the Thai | `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `common.saveUnknown` and `common.reloadToSave` |
| 2 | The failover now works for a real outage, not only against throwaway origins on 127.0.0.1: stop `lanna-care` on the Pi and save a unit on `/admin/units`. It should save rather than being refused | the Pi — this is test (3) of *PI TESTS AT THE PI*, Lutan's, and needs `0292` live on production first |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stream `pi-failover-wrapper`)  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the Thai and English wording of the two new sentences, and the real-outage save at the Pi once `0292` is live on production

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: not yet cut into a release
