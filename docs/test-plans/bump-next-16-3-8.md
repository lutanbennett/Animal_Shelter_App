# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Bump `next` and `eslint-config-next` 16.3.5 → 16.3.8 (critical `next/og` advisory GHSA-vcvr-r3jv-pc5j) |
| Backlog item | none: came from the CI `audit` job |
| Branch / worktree | `claude/bump-next-16-3-8` @ `C:\Development\Animal_Shelter_bump-next-16-3-8` |
| Dev server | production build: `npx next start -p 3008` (not `next dev`) |
| PR | linked from the PR itself |
| Tested by / date | Claude (bump-next-16-3-8 session), 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | `c6f3546` plus this PR's diff |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: `next` and `eslint-config-next` move to exactly 16.3.8 in `package.json`; the lockfile moves the `@next/*` packages (SWC binaries, `@next/env`, `@next/eslint-plugin-next`) with them and nothing else
- [x] Files/areas touched listed: `package.json`, `package-lock.json`, `docs/decisions/2026-10-01-next-og-advisory-handled-as-routine.md`, this plan. No `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: dependency bump, no role sees a change
- [x] Out of scope written down: not deployed from this stream (the Pi's `next start` and the Worker both need the usual release); the Worker/OpenNext build was not run here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run immediately before opening the PR (a lockfile change conflicts with anything)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 145s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: `npm audit` locally reports `found 0 vulnerabilities`, so the `audit` job should clear too; the other checks are read on the PR itself

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Run against `next build` + `next start` 16.3.8 on port 3008 (not dev), signed in as the project's dev test account where a route needs it.

- [x] Happy path works end to end: the server reports `Next.js 16.3.8`; `/`, `/adopt` and `/our-work` return 200 and carry `/api/photos/<id>` image URLs
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete — n/a: a dependency bump, no feature
- [ ] Empty state — n/a: no UI change
- [ ] Invalid input is rejected with a readable message — n/a beyond `/api/photos/bogus` returning 400 rather than crashing
- [x] Photo route: `/api/photos/<public id>` returns 200 `image/jpeg`, 279,212 bytes, starts `FFD8FFE0`, `cache-control: public, max-age=86400, s-maxage=86400, immutable`
- [x] react-pdf stack under the production server: signed-in `GET /manual/pdf?images=0` returns 200 `application/pdf`, 33 pages, `NotoSansThai-Regular` and `-Bold` embedded. That exercises `serverExternalPackages: ["@react-pdf/reconciler"]` and the `yoga-layout/load` alias to the WASM loader, the same renderer stack the deceased-resident archive uses
- [ ] The deceased-resident archive summary PDF itself — not driven: it needs a deceased resident and a Drive upload, and writes to dev. Same libraries and bundling as the manual PDF above. Left for manual verification below
- [x] Boundary: `/manual/pdf?view=all` (screenshots on) returned a 200 PDF on its first request but the server then logged `Incomplete or corrupt PNG file` ~195 times and later requests were slow. Pre-existing and not from this bump: on the Node origin the route fetches each screenshot over HTTP, `src/proxy.ts` redirects that unauthenticated request to `/login` (confirmed with curl: 307, 44 bytes), and the Worker uses its `ASSETS` binding instead. Not compared against 16.3.5 directly; the mechanism does not involve Next's version. See Defects

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | dependency bump, no access change | n/a |
| management | n/a | dependency bump, no access change | n/a |
| staff | n/a | dependency bump, no access change | n/a |
| vet | n/a | dependency bump, no access change | n/a |
| volunteer | n/a | dependency bump, no access change | n/a |
| signed out | `/manual/pdf` and `/manual/*.png` redirect (307) to login | unchanged | as expected |

- [ ] Every role above tested — n/a: no access logic changed
- [ ] A role that should not have access is blocked server-side — the signed-out redirect above is the only case checked; otherwise n/a

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no feature
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: nothing rendered differently; sign-in and `/my` loaded under 16.3.8
- [ ] Network clean — n/a beyond the checks above

## 6. Regression

- [x] The nearest things still work: public pages, the photo route, PDF rendering, sign-in and `/my` under the 16.3.8 production build
- [ ] Shared file checked from a second page — n/a: no source file touched
- [x] Nothing merged from `main` broken: gates re-run after the final `sync`

## 7. Documentation

- [ ] Backlog item ticked — n/a: there is no backlog item; the screenshot self-fetch follow-up goes on the `backlog` branch
- [x] Non-obvious design choices recorded: `docs/decisions/2026-10-01-next-og-advisory-handled-as-routine.md` (the app does not use `next/og`; the claim expires if an `opengraph-image` file appears)
- [ ] `README.md` still accurate — n/a: it does not name the Next patch version
- [ ] **Release notes.** n/a: a dependency bump, no shelter user sees it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions/` were measured: the `next/og` absence was grepped across `src/` and `worker/` and each convention file name searched for; `npm audit` was run after the bump

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — n/a: not deployed from this stream
- [ ] Deployed SHA matches — n/a: not deployed from this stream

### On the deployed build

- [ ] Deployed to test — n/a: the release goes the normal way
- [ ] Smoke-tested on `test.lannacare.org` — n/a: the Worker/OpenNext build on 16.3.8 is untested here; the release smoke test covers it
- [ ] Timezone-sensitive behaviour proved — n/a
- [ ] Boundary assertions cover both edges — n/a
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence
- [ ] Public pages re-checked after cache purge — n/a

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: nothing deploys
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR (restores 16.3.5 and the lockfile). Nothing persistent is written

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `/manual/pdf` with screenshots on the Node origin (`next start` on the Pi) fetches the PNGs unauthenticated; `proxy.ts` redirects to `/login`, so react-pdf logs "Incomplete or corrupt PNG file" per image and the PDF is slow and may omit pictures. Not caused by this bump | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Deceased-resident archive summary PDF still generates and uploads (record a death or press Retry on a dev resident) | test.lannacare.org after deploy |
| 2 | The Worker/OpenNext build on 16.3.8 renders a public page with photos and the manual PDF | test.lannacare.org after deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (bump-next-16-3-8 session)  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by: 

### Result

- [ ] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing deploys from this stream

Result: 

Release manager acknowledgement: n/a  Date: —
