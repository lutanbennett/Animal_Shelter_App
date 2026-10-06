# Release smoke test

Run this **once per production release**, not per feature. Copy it to
`docs/releases/<yyyy-mm-dd>.md`, fill it in against `lannacare.org` after the
deploy, and commit it on a feature branch and open a PR like any other change —
no exceptions, the record included (Lutan, 2026-10-03). It is a record, not a
gate, and nothing in CI checks it.

It deliberately lives outside `docs/test-plans/`, which holds per-feature
checklists and is what `scripts/check-test-plan.mjs` enforces. A release record
must not be able to satisfy a feature's gate.

**What this is for.** A per-feature test plan verifies one change in isolation.
It cannot catch two features interacting badly, and `main` takes several merges a
day. This list is short on purpose: the main paths through the app, checked on the
real production build, so a release that is broken in an obvious way cannot reach
users quietly. If it takes more than ten minutes it is too long — add depth to
the per-feature checklist instead.

Anything that fails here is a rollback decision, not a defect to log and move on
from. **Production is served by the Pi**, so the rollback is
`./scripts/pi/deploy-pi.sh --ref <previous release's SHA>` on the Pi (a rebuild, a few
minutes; docs/pi-hosting.md). `npx wrangler rollback --env production` reverts only the
Worker fallback, which answers when the Pi times out. Neither reverts migrations.

---

| | |
|---|---|
| Release date | |
| Deployed SHA | |
| PRs in this release | |
| Migrations applied | |
| Run by | |

## Before the deploy

- [ ] `main` is green and the SHA about to ship is known
- [ ] Every PR in this release has a completed `docs/test-plans/<feature>.md`. **List the PRs with `node scripts/release-prs.mjs <previous release's deployed SHA> <SHA to ship>`, then check each plan by hand** — `test-plan` reports red without blocking the merge, so an unchecked feature can reach `main`. **Never build the list from `git log --first-parent`**: a PR that reached `main` through an `origin/main` merge, squash or rebase has no merge commit there and is silently missed (#213 in `0.9.1`). If the script **exits non-zero** it names migrations/test plans that belong to no listed PR — a PR is missing. Find it on GitHub, add it to the list and the release record, and say so; do not tick this item against the list as printed
- [ ] **Phone width: `node scripts/check-phone-width.mjs`** ends `No page scrolls sideways.` Run it against a dev server on the SHA about to ship (`node scripts/worktree.mjs dev`), not against `lannacare.org`: it seeds long-named rows and throwaway logins, and refuses any database but dev. Exit 1 prints the page, the role, the language and the element that sticks out; that is a defect to fix or to file on the backlog and name here, not noise. `skipped` and `warning` lines are not failures. It covers six roles and the pages in its list at 375 px in English and Thai; it does not cover `/admin/security` (needs 2-step), pages behind records the seed does not create, or anything wider than 375 px
- [ ] **Phone width: `node scripts/check-phone-width.mjs`** ends `No page scrolls sideways.` Run it against a dev server on the SHA about to ship (`node scripts/worktree.mjs dev`), not against `lannacare.org`: it seeds long-named rows and throwaway logins, and refuses any database but dev. Exit 1 names the page, role, language and the element that sticks out: fix it, or file it on the backlog and name it in the record. `skipped` and `warning` lines are not failures. It covers six roles and its own page list at 375 px in English and Thai; not `/admin/security` (needs 2-step), pages behind records its seed does not create, or anything wider than 375 px
- [ ] If any migration ships: `node scripts/apply-migrations.mjs --env production --dry-run` clean, and applied **before** the deploy if code in this release reads it

## During the deploy

Two deploys ship a release: `npm run deploy:prod` (the Worker fallback) and
`./scripts/pi/deploy-pi.sh` on the Pi (what users are served). Both refuse a commit that
is not a cut release or whose database lacks a migration, so the checks above are not
skipped by going to the Pi directly. If either was run with `--force`, the reason is in
the record (the Pi: `~/lanna-deploy-overrides.log`) and below.

Read the output; do not assume it.

- [ ] `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (<sha>)` — the project ref is **production**, not dev, and the SHA matches what you meant to ship
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` present

## The app on `lannacare.org`

- [ ] **No Dev badge, and the palette is orange.** Teal with a green cast means the build is pointing at the dev database — stop and roll back. Note this is a one-way signal: `app-env.ts` renders anything that is not the known dev project as production, so the *absence* of the badge only rules out dev, it does not prove production. The deploy line above is the authoritative check
- [ ] Sign in with Google works
- [ ] Sign in with email and password works, and a user flagged for a password change is sent to `/account/password`
- [ ] `/residents` lists residents, and the count looks right rather than empty or suspiciously small
- [ ] One resident hub opens and its tabs load — info, medical, placement
- [ ] `/management/dashboard` renders its figures
- [ ] `/admin` opens for an admin and its sub-pages are reachable
- [ ] `/admin` says **Photo storage (Google Drive) is connected.** A red line there means every upload is failing; its small print is Google’s reason (an `invalid_grant` means the refresh token has expired or been revoked)
- [ ] Nav shows the right entries for the signed-in role, and no link 404s
- [ ] Browser console clean on the pages visited — no errors

## Signed out

Public pages are the live surface; internal screens are seen only by staff.

- [ ] `/` renders — hero, stats, featured resident
- [ ] `/adopt` lists residents, and no deceased or adopted animal appears
- [ ] One `/adopt/[id]` profile opens with its photo
- [ ] `/donate`, `/foster`, `/volunteer`, `/our-work` all render
- [ ] Checked **after a cache purge or a 10-minute wait** — anonymous GETs are edge-cached per data centre, so a stale page can hide a real break or invent one that is not there
- [ ] The edge cache is actually serving: load a public page twice **in a real browser** and see `x-lanna-cache: HIT` on the second. It matters because the cache is what keeps public pages off the CPU-limited render path while `ORIGIN_HOST` is empty. Do not check this with curl — curl sends no `locale` cookie, so it gets `BYPASS` every time and proves nothing either way

## Date handling

- [ ] Anything showing "today" is correct **for Thailand**, not UTC. Workers run in UTC wherever they are, so this is wrong for part of every day and is invisible on `next dev`. Worth checking deliberately during Thai evening, when the two dates differ

## Test gets the same release

Standing rule from 2026-09-24: **a production release also goes to test, from
the same commit.** Test is where `main` is exercised on the Workers runtime, so
it drifting *behind* production makes it useless as a pre-production check —
which is what happened on `0.1.0`, where production went to `0.1.0` while test
sat on `0.0.1`. Test being a few commits *ahead* between releases is fine and
expected; test being behind is the thing this prevents.

- [ ] **Check what is already on test before overwriting it.** `curl -s https://test.lannacare.org/api/releases/current`, and ask whether anyone is mid-test on it. Test holds one build, and it is sometimes deliberately an integration build that exists nowhere else — on 2026-09-23 it held `main` + cashflow + `claude/utc-today` for an overnight timezone check, and deploying over it would have destroyed the thing under test
- [ ] `npm run deploy:test` from the same commit as the production deploy
- [ ] `deploy: test → Supabase project qxkmhwybjggxvsfxsxbd (<sha>)` — the ref is the **dev** project and the SHA matches production's
- [ ] Both report the same version: `curl -s https://test.lannacare.org/api/releases/current` and the same on `lannacare.org`

Three things about this worth knowing rather than discovering:

- **Same code, different data.** Test runs the dev Supabase project; production
  runs the real one. Syncing them means the same build against different
  records, so test catches a broken build, a Workers-runtime problem or a
  UTC-in-Workers bug, and will not reproduce anything data-shaped. "Test and
  production are in sync" is a claim about code only.
- **Two builds, not one.** `next build` inlines the Supabase URL and anon key,
  so each environment needs its own build with its own values and `--skip-build`
  cannot be reused across them — reusing it would ship dev-pointing code to
  production. Budget twice the time.
- **A test deploy cannot mail anybody.** `RELEASE_MAIL_ENV` is `""` on test and
  there is no `RELEASE_MAIL` binding, so `worker/release-mail.mjs` refuses by
  construction. It prints who it *would* have mailed and why it did not, so
  deploying both environments cannot double-mail admins. Note the admin list
  comes from each environment's own database, so test's list is the dev
  project's and will not match production's.

Deploy **test first** where the release allows it: a build that is going to fail
should fail somewhere that is not the live site. Where production has already
gone out, bring test up straight afterwards rather than leaving it behind.

## Result

- [ ] All of the above either ticked or `n/a: <reason>`

Result: <pass | rolled back>

Run by: <name>  Date: <yyyy-mm-dd>

### What broke, if anything

| What | Where | Action taken |
|---|---|---|
| | | |
