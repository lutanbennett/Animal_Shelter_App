# Feature test plan — visitor-count-live

## Header

| | |
|---|---|
| Feature | The Website visitors tile: query tested against the live Cloudflare API, counted per day, and a missing value named with the machine it is missing from |
| Backlog item | `docs/backlog.md` → `## Admin` → "System status: set up the visitor count" (progress note, **not ticked**: the Pi deploy is outstanding); the BUG item "the Website visitors tile still says *Not set up* on production" is on the `backlog` branch only, so it is not on this branch to tick |
| Branch / worktree | `claude/visitor-count-live` @ `C:\Development\Animal_Shelter_visitor-count-live` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | `ecbaf62b` (code at `68772f66`; later commits are docs and this plan) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `countVisitors()` is run against Cloudflare for the first time, groups by date so its visitor figure is the per-day sum the tile describes, and a missing value names itself and the machine (red on production) — the BUG item's steps (1) and (3); its steps (2) and (4) are the Pi deploy, handed over below
- [x] Files/areas touched listed: `src/lib/status/usage.ts`, `src/app/admin/status/page.tsx`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `README.md`, `docs/pi-hosting.md`, `docs/backlog.md`, `docs/decisions/2026-10-10-visitor-count-live.md`
- [x] Roles affected identified: admin only (`/admin/status` is admin-only and unchanged in that respect)
- [x] Anything explicitly **out of scope** written down: copying the two values onto the Pi and running `deploy-pi.sh` (production, release manager with Lutan's go); filtering by host with `httpRequestsAdaptiveGroups`; the §7 process question (its own `## Architecture` item); editing the shipped 0.25.0 note

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (#521's handover changes, no conflicts)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 162s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: a dev server whose process was given the two values from the laptop's `.env.deploy.production` (read by a wrapper script, never on a command line), fetched `/admin/status?days=7|30|90` as a throwaway admin. Tile text as rendered: `Website visitors OK 5361 page views; 804 visitors, counted per day and added up.` (7), `OK 16742 page views; 3534 visitors…` (30), the same for 90. The throwaway admin was deleted at the end
- [ ] Data persists — reload the page and the change is still there — n/a: the tile writes nothing; it reads Cloudflare on each (minute-cached) load
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only tile
- [x] Empty state renders sensibly: with neither value on a dev laptop, the real page reads `Website visitors Not in use Not set on this computer: CLOUDFLARE_ANALYTICS_TOKEN, CLOUDFLARE_ZONE_ID missing from .env.local.` at all three ranges. Zero visitors: the counts branch renders whatever the daily groups sum to, so an empty range is `0 page views; 0 visitors`, green, never "not set up"
- [x] Invalid input is rejected with a readable message, not a crash: a wrong token through the real `countVisitors()` gives `fail` with `Cloudflare analytics: Authentication error`
- [x] Boundary cases checked: the real `countVisitors()` under `runCheck`, run with the environment set per case — both values on production → `ok` at 7, 30 and 90; neither on the Pi (production) → `fail`, `CLOUDFLARE_ANALYTICS_TOKEN and CLOUDFLARE_ZONE_ID are not set on the Pi.`, file `.env.deploy.production`; only the token missing on the Pi → `fail`, names just that key; neither on a dev laptop → `off`, file `.env.local`. Range limit probed directly: 365 days answers, 366 is refused (`cannot request a time range wider than 52w1d1h`), so 90 is far inside it

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/status` | tile renders | HTTP 200, tile as above |
| management | — | unchanged by this PR | n/a: the page's role guard is not touched |
| staff | — | unchanged by this PR | n/a: the page's role guard is not touched |
| doctor | — | unchanged by this PR | n/a: the page's role guard is not touched |
| volunteer | — | unchanged by this PR | n/a: the page's role guard is not touched |
| signed out | `/admin/status` | sent to sign-in | `/login?next=%2Fadmin%2Fstatus%3Fdays%3D7` in the browser pane |

- [ ] Every role above tested — n/a: only the tile's contents changed; who may open `/admin/status` did not, and the signed-out redirect was seen
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual does not describe the visitor tile's set-up text
- [x] Translatable strings go through the translation path: the three new messages are in both `en.ts` and `th.ts` with the same shape (typecheck enforces it)
- [ ] Mobile viewport (375px) — n/a: the tile layout is unchanged; only one paragraph's wording differs, and it wraps (`break-words` is not needed, it has spaces)
- [ ] Browser console clean — n/a: checked by server-side fetch, not in the browser pane, because sign-in there would mean typing a password
- [ ] Network clean — n/a: same reason; the server answered 200 at all three ranges

## 6. Regression

- [x] The pages nearest the change still work: the other usage tiles on the same `/admin/status` fetches rendered (sign-ins, records, uploads, assistant), HTTP 200 at all three ranges
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the dictionaries changed only inside `admin.status.usage.visitors`; nothing else reads those keys (`grep visitors.off` finds nothing left)
- [x] Nothing merged from `main` during `sync` was broken by this branch: the sync brought in docs only, and the gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked; the tile shows a number on lannacare.org only after the Pi deploy, so the item gets a progress note instead (it was half-ticked once already, which is how 0.25.0's note went out)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-10-visitor-count-live.md`): what Cloudflare answered at each range, the plan limit, why it is red on production, how the Pi is recognised
- [x] `README.md` still accurate: the System status paragraph now describes the named-missing tile
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: 0.25.0’s admin note already says the tile shows a number, and this is what makes that true; Lutan ruled in chat on 2026-10-10 that no correcting line is needed because nobody had opened System status before the fix. The claim in that note was checked against the real page here (§4, 7/30/90 days) and holds on lannacare.org once the Pi has the two values (§8, handover table)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned**: every figure in the decision file (662 vs 803, 52w1d1h, data from 2026-09-21) is from Cloudflare's actual answers in this session

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (expect the grey/red "Not set on the Cloudflare Worker…" text unless the test Worker has the pair; either is a correct answer, "Not set up" is not)
- [ ] **Timezone-sensitive behaviour proved** — n/a: dates are Cloudflare's UTC days, as before; nothing derives a Thai "today"
- [ ] **Boundary assertions cover both edges** — n/a: no threshold or band; the range edges are covered in §4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** (tile text and gate lines above, copied from the runs)
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager. No new variable; but **`CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID` must also be in the Pi's `~/Animal_Shelter_App/.env.deploy.production` before `deploy-pi.sh`**, or the tile is red on production and the release note is false again

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager. Code-only; `deploy-pi.sh --ref <previous sha>` reverts it. The two lines in the Pi's values file are harmless to leave behind either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | With no `dimensions`, Cloudflare returned one group for the whole range, so "visitors, counted per day and added up" was not what the number was (662 vs 803 over 7 days) | fixed: `dimensions { date }` |
| 2 | major | A missing value on production was grey and told the admin to set "Worker secrets" — the instruction that sent the values to the wrong machine | fixed: names the keys, the machine and the file; red on production |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the two lines are copied into the Pi's `~/Animal_Shelter_App/.env.deploy.production` and `deploy-pi.sh` has run: the Website visitors tile on lannacare.org Settings → System status is **green with a number** at 7, 30 and 90 days, not red | lannacare.org `/admin/status`, Lutan |
| 2 | The Thai wording of the three new messages reads naturally | `/admin/status` in Thai, a Thai-reading admin |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; the Pi deploy has not happened

Manual verification by: pending: the tile showing a number on lannacare.org after the Pi deploy, and the Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending  Date: —
