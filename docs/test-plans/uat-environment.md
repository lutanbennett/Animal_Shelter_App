# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | A third environment, `uat`, in the app and the deploy tooling (plumbing only until the cutover) |
| Backlog item | `docs/backlog.md` → Deployment: "Add a third environment, `uat`, to the app and the deploy tooling" |
| Branch / worktree | `claude/uat-environment` @ `C:\Development\Animal_Shelter_uat-environment` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | `23f5ac3` (behaviour); gates re-run at `058ce43` after syncing `main` to `0d5c49c` (docs only) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `app-env` gains `uat` (production colours, a UAT badge, a PDF watermark) with its project ref left empty, and every deploy script gains `--env uat`, which refuses to deploy until the cutover sets that ref
- [x] Files/areas touched listed: `src/lib/app-env.ts`, `src/app/AppHeader.tsx`, `src/app/releases/page.tsx`, `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/archive/resident-summary-pdf.tsx`, `scripts/deploy.mjs`, `scripts/lib/env.mjs`, `scripts/backup.mjs`, `scripts/apply-migrations.mjs` (comments), `scripts/pi/deploy-pi.sh`, `scripts/pi/write-env.mjs` (comment), `wrangler.jsonc`, `package.json` (`deploy:uat`), README, backlog, decisions. None of PR #59's 24 `src/` files; no `worker/`, no `supabase/migrations/`
- [x] Roles affected identified: every signed-in role sees the header badge, and only on a UAT build, which cannot exist before the cutover. No role sees a change on dev, test or production today, except that PDFs archived from dev/test now carry a `DEV` watermark
- [x] Out of scope written down: the cutover itself (setting `UAT_PROJECT_REF`, moving routes, the new production project and domain, the Pi `lanna-care-uat` service, `.env.deploy.uat`). No thin top strip, because the badge was judged enough. No watermark on the archive's `index.html` either (the item asks only for PDFs). The PDF's pre-existing layout faults (name overlapping the subtitle, footer not rendering) show up on production output too and are left alone

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly and pushed, twice (`9f1bc76`, then `0d5c49c` after #65)
- [x] `npm run typecheck` — clean (exit 0)
- [x] `npm run lint` — clean (exit 0)
- [x] `npm run build` — succeeds (exit 0, captured to a log, not through a pipe; typecheck, lint and build all re-run after the second sync)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end:
  - `appEnvForSupabaseUrl` run through Node on the real module: the dev `.env.local` URL gives `dev`, the `dbkodyyxxhtygxcxmfcu` URL gives `production`, and an empty URL gives `production`. So today's production build is unchanged.
  - The summary PDF, rendered from the real component with `appEnv` `uat`, `dev` and `production` and then read back: `UAT` / `DEV` diagonal watermark on both pages and in the footer text, and nothing on production.
  - With app-env temporarily mapping the dev ref to `uat` (reverted before commit), `/` served `<html data-env="uat">` with `--primary: #ff9f0a` and `--background: #121212`, which are production's tokens, not the teal
- [ ] Data persists — n/a: nothing is stored; the environment is derived from the build
- [ ] Create / edit / delete — n/a: no records
- [ ] Empty state — n/a: no list or data surface
- [x] Invalid input is rejected with a readable message, not a crash. Each case exits 2 before any build or network call:
  - `deploy.mjs --env uat` with no `.env.deploy.uat` → "`.env.deploy.uat` is missing or empty"
  - `--env uat` pointed at `dbkodyyxxhtygxcxmfcu` → refused: app-env calls that project "production", and UAT has no project until the cutover
  - `--env test` pointed at the production ref → refused
  - `--env staging` → "must be one of test, uat, production"
  - `apply-migrations.mjs --env uat --status` → missing-file message
- [x] Boundary cases checked: the empty `UAT_PROJECT_REF` can't match any URL (guarded, so the empty string never becomes a prefix match on `https://.`). A Supabase URL that is neither known ref still falls back to `production`, so there's no badge

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | header badge | UAT badge only on a UAT build | n/a: no UAT build can exist before the cutover |
| staff | header badge | same | n/a: same |
| vet | header badge | same | n/a: same |
| volunteer | header badge | same | n/a: same |
| resident | header badge | same | n/a: same |
| signed out | header | no header at all (unchanged) | login page served with `data-env="uat"` and production colours, no header |

- [ ] Every role above tested — n/a: the badge is one branch in the shared header, the same for every role, and no UAT build exists to sign in to
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing staff can see changes until the cutover; the manual's `[UAT]`/`[Production]` mail wording is already right
- [x] Translatable strings go through the translation path: `uatBadge` / `uatBadgeTitle` are added to both `en.ts` and `th.ts` beside `devBadge`, and typecheck enforces that the two dictionaries have the same shape
- [ ] Mobile viewport (375px) — n/a: a three-letter badge in the slot the Dev badge already uses, with the same classes
- [x] Browser console clean on `/` at `http://localhost:3001` (no errors)
- [ ] Network clean — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work: `/` and the login page render. `/releases` label lookup typechecks with the widened `AppEnv`, and its unreleased-notes panel is still gated on `dev` alone, so UAT will not show it. The production-env PDF render has no watermark and no footer suffix. It was not diffed against a pre-change render; the only code path it takes is the `null` branch
- [x] Shared file checked from a second page: `app-env.ts` also drives `layout.tsx` (`data-env`), checked on the login page
- [x] Nothing merged from `main` during `sync` was broken by this branch: the `worktree.mjs` changes from #58 are untouched and `sync` itself ran with them

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (moved to Completed → Deployment)
- [x] Design choices appended to `docs/decisions.md`, dated 2026-09-23: what UAT is (database, Drive, domain), why the ref is empty, the Worker name, the DEV watermark, and the badge-consistency guard
- [x] `README.md` accurate: "Environments" now has the four-column table and a list of what the cutover changes, and "Deploying to Cloudflare" covers `deploy:uat` and the guard
- [x] Commit messages say why, not just what
- [x] Claims measured, not reasoned: every guard message quoted above was produced by running the script, and the PDF claims come from rendering it and reading it back

## 8. Pre-production gate

- [ ] Tested SHA is the tip of `main` at deploy time — n/a: release manager's, at deploy
- [ ] Deployed SHA matches the tested SHA — n/a: release manager's, at deploy
- [ ] Deployed to test — n/a: release manager's; nothing on test changes except the DEV watermark on archived PDFs
- [ ] Smoke-tested on `test.lannacare.org` — n/a: release manager's, after the deploy
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic touched
- [ ] Public pages re-checked after a cache purge — n/a: public pages untouched
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: release manager's, at deploy; the new badge check now also refuses a production deploy whose ref app-env would call dev
- [ ] `strip-baked-env` line seen — n/a: release manager's, at deploy
- [ ] New secret/env var in production — n/a: none added
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: `npx wrangler rollback --env production` covers it fully; nothing outside the Worker changes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Summary PDF: the name overlaps the subtitle line, and the fixed footer does not render. Both show on production output too, so they predate this change | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Header badge, signed in: **Dev** still shows on the dev build, and **UAT** shows (in production colours) with app-env temporarily mapping the dev ref to `uat`. Lutan signed in; Claude then took both screenshots on `/residents`: teal **DEV** badge, then orange **UAT** badge with title "UAT — acceptance testing, not the live site" and orange buttons. Temporary edit reverted | `http://localhost:3001` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-23

### Manual verification

- [x] Every item in the manual list was checked by a person, or the list is empty

Manual verification by: Lutan Bennett (reviewed the Dev / UAT badge screenshots and confirmed in chat; line written by Claude at his request)  Date: 2026-09-23

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after the PR is open

Result: pass with accepted defects
