# Feature test plan — pi-visitor-count

## Header

| | |
|---|---|
| Feature | The Pi gets `CLOUDFLARE_ANALYTICS_TOKEN` / `CLOUDFLARE_ZONE_ID`, from one optional-secrets list shared with the Worker deploy |
| Backlog item | `docs/backlog.md` → System status: set up the visitor count (note added, not ticked: the live tile is still to be seen) |
| Branch / worktree | `claude/pi-visitor-count` @ `C:\Development\Animal_Shelter_pi-visitor-count` |
| Dev server | n/a — no page changed; `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | to be opened from this branch |
| Tested by / date | Claude, 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | f08b62aa |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `scripts/lib/optional-secrets.mjs` (new), `scripts/pi/write-env.mjs`, `scripts/deploy.mjs`, `README.md`, `docs/pi-hosting.md`, `src/lib/releases.ts` (release note only), backlog note, decision file. No route, no `worker/`, no migration
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — admin only (the System status page is admin-only)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — copying the two lines into the Pi's `.env.deploy.production` and running `deploy-pi.sh` is Lutan's step after merge; the Cloudflare query itself has never run against the live API and is not tested here (the auto-mode classifier refused that call as a production read)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 203s

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

- [x] Happy path works end to end — `write-env.mjs --env production` run in a scratch folder (copies of the script, `scripts/lib/` and `wrangler.jsonc`; fake `.env.local` and `.env.deploy.production` holding the required keys plus `ORIGIN_KEY`, `CLOUDFLARE_ANALYTICS_TOKEN`, `CLOUDFLARE_ZONE_ID`; `process.platform` forced to `linux`). The written `.env.production.local` contained `CLOUDFLARE_ANALYTICS_TOKEN=cftok` and `CLOUDFLARE_ZONE_ID=zone1` and no `ORIGIN_KEY` line. `src/lib/status/usage.ts` reads both from `process.env`, which is what `next start` loads that file into
- [ ] Data persists — reload the page and the change is still there — n/a: no data written; the generated file is rewritten on every Pi deploy by design
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create/edit/delete
- [x] Empty state renders sensibly (no rows yet) — the same scratch run had no `BACKUP_DRIVE_FOLDER_ID` set and wrote no line for it, as before: unset optional values are skipped, not written empty
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: optional values are passed through unchecked, as `BACKUP_DRIVE_FOLDER_ID` always was; a wrong token shows as a red tile with Cloudflare's message (redacted by `redactSecrets`)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: missing optional fields covered under empty state; nothing else has a boundary

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | access unchanged — no route or permission touched | n/a |
| management | n/a | unchanged | n/a |
| staff | n/a | unchanged | n/a |
| doctor | n/a | unchanged | n/a |
| volunteer | n/a | unchanged | n/a |
| signed out | n/a | unchanged | n/a |

- [ ] Every role above tested — n/a: no route, page or permission changed; only deploy scripts
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: nav not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no behaviour a user operates changed; the tile simply starts working
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new UI strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI change
- [ ] Browser console clean — no errors or React warnings — n/a: no UI change
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page changed; the scripts nearest it: `node --check` passes on `scripts/deploy.mjs` and `scripts/pi/write-env.mjs`; `deploy.mjs` still pushes `OPTIONAL_SECRETS` (now imported, same four names); the scratch `write-env.mjs` run still produced every required key, the actions key, `PUBLIC_SITE`, `NEXT_PUBLIC_SITE_URL` and `PHOTO_CACHE_DIR`
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared UI file touched; `src/lib/releases.ts` gained one note and the build that renders it passed
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync merged nothing ("Already up to date.")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — not ticked, deliberately: "System status: set up the visitor count" also asks to see the tile working, which needs the Pi step after merge. A *Partly done* note says what this PR closed and what is still open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-10-one-optional-secrets-list.md`
- [x] `README.md` still accurate — System status paragraph now says both copies of `.env.deploy.production`; `docs/pi-hosting.md` Day to day gained the rule
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — "the Pi never got them" measured by the scratch run (before the change the script had no path for those keys; after, the file carries them); "nothing on the Pi uses `ORIGIN_KEY`" checked by grep: its readers are `worker/origin.mjs` and `checkOrigin()` in `src/lib/status/health.ts`, which returns `off` without `ORIGIN_HOST`, and `ORIGIN_HOST` is not written to the Pi's file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic touched
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the `gates:` lines above are as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: Lutan — already true on the Worker (`wrangler secret list --env production`, 2026-10-10); the Pi's `~/Animal_Shelter_App/.env.deploy.production` needs the same two lines before `deploy-pi.sh`

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — `./scripts/pi/deploy-pi.sh --ref <previous sha>` on the Pi; the only effect of rolling back is the tile going back to "Not set up". Removing the two lines from the Pi's `.env.deploy.production` and redeploying does the same without a rollback. No schema involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | `write-env.mjs` and `deploy.mjs` kept separate optional lists, so the Pi never got the visitor-count values | fixed — one shared list |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the two lines are in the Pi's `.env.deploy.production` and `deploy-pi.sh` has run, the Website visitors tile shows a number (red means the token needs Zone → Analytics → Read on lannacare.org) | lannacare.org → Settings → System status |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the one item needs the Pi deploy after merge

Manual verification by: pending: the Website visitors tile on lannacare.org after the Pi deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over when the PR is merged

Result: pass

Release manager acknowledgement: pending: after merge
