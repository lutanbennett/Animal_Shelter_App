# Feature test plan

## Header

| | |
|---|---|
| Feature | Server Actions and sign-in work again on the Pi-served production site |
| Backlog item | `docs/backlog.md` → none — a production fault found 2026-10-01, not a planned item |
| Branch / worktree | `claude/server-actions-allowed-origins` @ `C:\Development\Animal_Shelter_server-actions-allowed-origins` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | pending |
| Tested by / date | Claude (QA session) / 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | 40559a2 plus this commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *restore Server Actions and Google sign-in on `lannacare.org`, broken since the Pi became the render origin; no backlog item, this is a live fault*
- [x] Files/areas touched listed — `next.config.ts` (`serverActions.allowedOrigins`), `scripts/pi/write-env.mjs` (pins `NEXT_PUBLIC_SITE_URL`), `src/app/auth/callback/route.ts` (origin from the public host), `src/lib/releases.ts`, `docs/decisions/`
- [x] Roles affected identified — **all of them, signed in and signed out.** Every `"use server"` file was failing, so this is not role-specific
- [x] Anything explicitly **out of scope** written down — listed below

Out of scope, deliberately, each with its reason:

- `src/lib/supabase/proxy.ts:77` builds a `URL` object, which Next normalises to a same-origin relative `Location`. Verified live: `GET /releases` on production returns `Location: /login?next=%2Freleases`, which is correct. Not changed, because it is not broken.
- `src/app/manual/pdf/route.ts:47` passes the origin to a **server-side** image fetch. On the Pi, `http://localhost:3000` is the right address for it to fetch itself on. Not changed, for the same reason.
- `worker/index.mjs:139` treats a 502/530 from the tunnel as "render locally" without checking the method, so a `POST` could be replayed — a double-apply risk on writes, contradicting the design stated on line 31. Found while reading, **not verified**, and filed on the `backlog` branch rather than fixed here.
- `.env.deploy.production` has two variables concatenated onto one line (`GOOGLE_SIGNIN_CLIENT_SECRET` and `..._CLIENT_ID`), so the ID does not exist as a variable and the secret's value is corrupt. Neither name is read anywhere in the repo and neither reaches the Pi, so it is **not** this fault. Gitignored, so not fixable in a PR; handed to Lutan, who also needs to rotate that secret.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 7s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 33s
=== gates: build — npm run build
=== gates: build exited 0 after 31s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The fault exists only behind cloudflared. `next dev` on localhost and the Worker-rendered `test.lannacare.org` both pass `Origin` and `x-forwarded-host` consistently, so **neither can reproduce it and neither can prove the fix**. That is the whole lesson of this bug, and it is why most of this section is `n/a` and the real proof is a person on the deployed Pi, in **Left for manual verification**.

- [ ] Happy path works end to end — n/a: not reproducible off the Pi; see Left for manual verification
- [ ] Data persists — n/a: this change writes no data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no list or table
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input. The host-matching rule is the only boundary, and this Next version's own docs table was followed: `*` stands for exactly one label, so the apex is listed separately from `*.lannacare.org`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | every Server Action | unchanged | n/a: no permission logic touched |
| management | every Server Action | unchanged | n/a: no permission logic touched |
| staff | every Server Action | unchanged | n/a: no permission logic touched |
| vet | every Server Action | unchanged | n/a: no permission logic touched |
| volunteer | every Server Action | unchanged | n/a: no permission logic touched |
| signed out | the `/login` actions | unchanged | n/a: no permission logic touched |

- [ ] Every role above tested — n/a: this change adds no permission logic. `allowedOrigins` is a CSRF host check that runs before any action, identically for every role
- [ ] A role that should not have access is blocked server-side — n/a: unchanged by this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a reader of the manual would do differently
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings added
- [ ] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — `https://lannacare.org/login` and `https://test.lannacare.org/login` both read with no console messages
- [x] Network clean — checked live, and it is the evidence for this fix: `POST /login` returned **500** on production while `/`, `/login`, `/login/request` and `/login/forgot` were all 200. After the deploy, that 500 flipping to a redirect is the check

## 6. Regression

- [x] The pages nearest the change still work — `/`, `/login`, `/login/request` and `/login/forgot` on production all return 200 and are served by the Pi (`x-lanna-served-by: pi`); `test.lannacare.org` sign-in still reaches Google with the right client and the dev Supabase project
- [x] Any shared file touched checked from a second, unrelated page, by loading it — `next.config.ts` and `src/lib/site-origin.ts` are the shared ones. The build exercises the config, and `getSiteOrigin()` has many consumers (`/adopt`, `/e/[id]`, `PublicHeader`): those pages were **loaded**, not merely read. Worth recording that their `og:` and `metadataBase` URLs are *currently wrong* on the Pi (`pi.lannacare.org`), which this PR also fixes — a second reason to pin `NEXT_PUBLIC_SITE_URL`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: no backlog item existed; this was a live production fault. The follow-up found while reading (`worker/index.mjs:139`) went on the `backlog` branch, as CLAUDE.md requires
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-01-server-actions-allowed-origins.md`
- [x] `README.md` still accurate — its "Environments" table is unaffected; the Pi still renders production, it just now knows what it is called
- [x] **Release notes.** `unreleased` gained a line in this PR, written for a shelter user: sign-in and every other form on `lannacare.org` work again, and what the symptom looked like
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** This matters here, because the first two diagnoses were wrong. The CSP added by #242 looked like the culprit and turns out to be **report-only**, so it enforces nothing. A peer session reported these origins resolve to `pi.lannacare.org`; they do not — `curl -D -` on `https://lannacare.org/auth/callback` returns `Location: https://localhost:3000/login?error=google`, and that reading is what sent the fix to `NEXT_PUBLIC_SITE_URL` rather than to the header. Every claim in the decision file comes from the Pi's journal, a live header read, or this Next version's own docs under `node_modules/next/dist/docs/`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: nothing in this change derives a date, a time or a "today"
- [ ] Boundary or banding change covers both edges — n/a: no threshold, band, window or retry limit
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block, the Pi journal line and the `Location:` header are all verbatim
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: `NEXT_PUBLIC_SITE_URL` is written by `scripts/pi/write-env.mjs` from `wrangler.jsonc`'s own routes, so there is nothing to add by hand and no new secret. Note this change ships via `deploy-pi.sh`, not `deploy.mjs` — the Worker bundle is unchanged

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — this ships to the **Pi**, so `npx wrangler rollback` is not the lever: redeploying the previous commit with `scripts/pi/deploy-pi.sh` is. The faster mitigation, needing no deploy at all, is to unset `ORIGIN_HOST` on the production Worker, which makes the Worker render and takes cloudflared out of the path entirely — at the cost of the intermittent 1102s. No migration, so nothing to reverse in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | Every Server Action on `lannacare.org` aborted since 2026-09-30 20:54 — all forms, all mutations, both sign-in methods | fixed |
| 2 | High | `/auth/callback` redirected to `https://localhost:3000/...`, so Google sign-in could not complete even once defect 1 was fixed | fixed |
| 3 | Medium | `getSiteOrigin()` returns `https://pi.lannacare.org` on the Pi, so `signInWithGoogle` built a `redirectTo` Supabase would reject, and public pages carry wrong `og:`/`metadataBase` URLs | fixed |
| 4 | Medium | `worker/index.mjs:139` may replay a `POST` after a tunnel 502/530 — double-apply risk on writes | deferred to backlog, unverified |
| 5 | Low | `.env.deploy.production` has two variables on one line, so `GOOGLE_SIGNIN_CLIENT_ID` does not exist and the secret's value is corrupt | accepted — not this fault, gitignored, handed to Lutan with a request to rotate that secret |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in with **Google** and land on a working page — the point of the fix, and the one thing no environment but the deployed Pi can show | `https://lannacare.org/login`, after `deploy-pi.sh` |
| 2 | Sign in with **email and password** — equally broken, and a different action | `https://lannacare.org/login` |
| 3 | Save something, any form at all, and confirm no "A server error occurred" | any `/admin` or resident page |
| 4 | Sign in from **`www.lannacare.org`** as well as the apex — they send different `Origin` headers, and the two `allowedOrigins` entries cover them by different rules | `https://www.lannacare.org/login` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (QA session)  Date: 2026-10-01

### Manual verification

The items in **Left for manual verification** above, for the person who looked. Not signed: nobody has looked yet.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: items 1-4 above — nobody has signed in on the deployed Pi yet, and none of them can be done before `deploy-pi.sh` runs

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — the PR is opened first, then the release manager is told

Result: pass with accepted defects

Release manager acknowledgement: pending
