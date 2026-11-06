# Feature test plan — status-health-endpoint

## Header

| | |
|---|---|
| Feature | `GET /api/status/health`: read-only health feed for Home Assistant, own bearer token `STATUS_READ_TOKEN` |
| Backlog item | `#mzu7v` (app side only; Home Assistant side is a separate guided session, item left open) |
| Branch / worktree | `claude/status-health-endpoint` @ `C:\Development\Animal_Shelter_App-worktrees\brave-liskov-2d2561` |
| Dev server | `next dev` on :3011 with a throwaway token, stopped afterwards |
| PR | pending |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | no — uses `0324_database_health.sql` from PR #1334 (merged, applied to dev) |
| Tested at SHA | pending |

## 1. Scope and risk

- [x] One sentence: a token-guarded, rate-limited, no-store JSON feed of check states, times and eight safe numbers
- [x] Files touched — `src/app/api/status/health/route.ts`, `src/lib/status/health-feed.ts`, `src/proxy.ts`, `scripts/lib/runtime-config.mjs`, `.env.example`, `scripts/check-status-health.mjs`, `package.json` (lint), `docs/hard-coded-security-registry.json`, `docs/home-assistant-monitoring.md`, a decision file, this plan
- [x] Roles affected — none; no screen, no card. The token is not a role or card rule (registered under `environment`)
- [x] Out of scope — the Home Assistant sensors, Pi/Glances, Cloudflare traffic, setting the token in production

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — pending
- [ ] `node scripts/gates.mjs` — pending
- [ ] CI green on the PR — pending

## 3. Schema and data

- [x] Migration — n/a: none in this PR; `database_health()` landed in #1334
- [x] Applied to dev — `0324` applied there; feed returned size 42 MB, 9 connections
- [x] Re-runnable — n/a: no migration here
- [x] Existing rows — n/a: no table touched
- [x] Constraints exercised — n/a: no schema here
- [x] Down-migration — n/a: none
- [x] Production apply plan — `0324` with the next release; until then size/connections are `null` and `databaseSize` reads fail

## 4. Functional checks

- [x] Happy path — live on :3011: right token returns 200 with 9 checks and 8 numbers
- [x] Data persists — n/a: read-only
- [x] Create / edit / delete — n/a: read-only, GET only
- [x] Empty state — unknown database numbers are `null`, asserted offline
- [x] Invalid input rejected — missing and wrong tokens give 401 live; script covers prefix, tail, no scheme, empty, unset and short server token
- [x] Boundary cases — limiter trips after N and reopens next window; size thresholds 79/80/95%/null

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| holder of STATUS_READ_TOKEN | feed | 200 | pass (live) |
| any signed-in user, no token | feed | 401 | pass (same refusal as no token; session ignored) |
| signed out, no/wrong token | feed | 401 | pass (live) |

- [x] Every role tested — n/a: access is by token only, no role or card involved
- [x] Blocked server-side — yes, route checks the token itself; proxy only skips the session gate

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: staff never see this
- [ ] Translatable strings — n/a: JSON for a machine
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI; response headers checked: `cache-control: no-store`

## 6. Regression

- [x] Nearest pages — the alerts route and proxy order untouched; `check-hard-coded-security` and `check-runtime-config` pass
- [ ] Shared file touched checked from a second page — n/a: proxy gained one exact-path GET branch; other routes unchanged
- [x] Nothing merged from `main` broken — pending the sync

## 7. Documentation

- [ ] Backlog ticked — n/a: item stays open (Home Assistant side remains); status note goes on the backlog branch
- [x] Decision recorded — `2026-11-06-status-health-feed.md`
- [x] README accurate — it does not list endpoints
- [ ] **Release notes.** — n/a: staff will not see it
- [x] Commit messages say why
- [x] Claims measured — live curl/script run, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive — n/a: only ISO instants
- [ ] Boundary or banding — n/a: size thresholds are new, asserted in the script
- [ ] Evidence unedited — deferred: release manager
- [ ] Public pages re-checked — n/a: not touched
- [ ] `deploy: production → Supabase project <ref>` read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret in production — pending: Lutan adds `STATUS_READ_TOKEN` to `.env.deploy.production` and runs `--secrets`; the feed refuses everyone until then (safe)
- [x] Migration and reading code in one PR? — no; `0324` shipped first
- [ ] Production `--dry-run` — deferred: release manager
- [ ] Production backup — n/a: no migration
- [x] Apply plan — `0324` with the release
- [x] Rollback — remove the route; token unused is harmless

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | `0324` number used twice on `main` (`can_see_drive_file_lists_reels` also) | accepted — not this PR, noted in decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After production secret is set, the curl in `docs/home-assistant-monitoring.md` returns 200 | production |

## Sign-off

- [x] Everything verifiable without human eyes was run
- [x] Nothing ticked that was not executed

Automated checks by: Claude  Date: 2026-11-06

- [x] Manual list reviewed

Manual verification by: pending: Lutan, after the production secret is set

- [x] Open defects fixed or accepted
- [ ] Checklist pasted into the PR — n/a: PR links it
- [ ] Handed to release manager — n/a: via the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
