# Release smoke test

Run this **once per production release**, not per feature. Copy it to
`docs/releases/<yyyy-mm-dd>.md`, fill it in against `lannacare.org` after the
deploy, and commit it on whatever branch is to hand — it is a record, not a gate,
and nothing in CI checks it.

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
from: `npx wrangler rollback --env production` reverts the Worker in seconds, but
does **not** revert migrations.

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
- [ ] Every PR in this release has a completed `docs/test-plans/<feature>.md`. **Check this by hand** — `test-plan` reports red without blocking the merge, so an unchecked feature can reach `main`
- [ ] If any migration ships: `node scripts/apply-migrations.mjs --env production --dry-run` clean, and applied **before** the deploy if code in this release reads it

## During the deploy

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

## Result

- [ ] All of the above either ticked or `n/a: <reason>`

Result: <pass | rolled back>

Run by: <name>  Date: <yyyy-mm-dd>

### What broke, if anything

| What | Where | Action taken |
|---|---|---|
| | | |
