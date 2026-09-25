# Feature test plan

## Header

| | |
|---|---|
| Feature | Lock UAT (lannacare.org) and test.lannacare.org behind sign-in |
| Backlog item | `docs/backlog.md` → Next up → "Lock UAT (lannacare.org) and test.lannacare.org behind sign-in — no public access until go-live." (on `backlog`, not yet on `main` — ticked there after merge) |
| Branch / worktree | `claude/uat-login-gate` @ `C:\Development\Animal_Shelter_uat-login-gate` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | #123 |
| Tested by / date | Claude, 2026-09-25 |
| Carries a migration? | no |
| Tested at SHA | branch at `main` @ `4dc8e10` plus this PR's changes (the working tree the gates and browser checks ran on) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — with `"PUBLIC_SITE": "locked"` on a Worker, a signed-out visitor sees a sign-in landing page at `/` and is sent to `/login?next=…` from every other page except `/login`, `/login/forgot`, `/auth/callback`, `/privacy` and `/robots.txt`, and every response is `noindex`; set on test, uat and production (lannacare.org until the cutover)
- [x] Files/areas touched listed — `src/lib/public-site.ts` (new), `src/lib/public-paths.ts`, `src/lib/supabase/proxy.ts`, `src/app/page.tsx`, `src/app/LockedLanding.tsx` (new), `src/app/robots.ts` (new), i18n `login.locked`, `wrangler.jsonc`, `scripts/pi/write-env.mjs`, a comment in `worker/index.mjs`, manual sign-in note, README, decisions, releases
- [x] Roles affected identified: signed-out public only; every signed-in role sees what it saw before
- [x] Anything explicitly **out of scope** written down — Open Graph previews of locked pages stop working on UAT and test (expected; the landing page deliberately has none). The Worker edge cache may serve a pre-deploy copy of a public page for up to 10 minutes. Removing the var from the production block is the cutover's job, flagged in `wrangler.jsonc`, README and decisions

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 596s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — PR #123, run 36130551414 after syncing `main`: check, migration-numbers, test-plan all pass

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

Locked mode was exercised on `next dev` with `PUBLIC_SITE=locked` in a
temporary `.env.development.local` (removed afterwards), then again with it
gone. Signed-out responses, `curl -D -` against `http://localhost:3009`:

```
Locked:
/                  HTTP/1.1 200 OK x-robots-tag: noindex, nofollow
/adopt             HTTP/1.1 307 Temporary Redirect location: /login?next=%2Fadopt x-robots-tag: noindex, nofollow
/our-work          HTTP/1.1 307 Temporary Redirect location: /login?next=%2Four-work x-robots-tag: noindex, nofollow
/friends           HTTP/1.1 307 Temporary Redirect location: /login?next=%2Ffriends x-robots-tag: noindex, nofollow
/privacy           HTTP/1.1 200 OK x-robots-tag: noindex, nofollow
/login             HTTP/1.1 200 OK x-robots-tag: noindex, nofollow
/login/forgot      HTTP/1.1 200 OK x-robots-tag: noindex, nofollow
/r/R-0001          HTTP/1.1 307 Temporary Redirect location: /login?next=%2Fr%2FR-0001 x-robots-tag: noindex, nofollow
/e/abc?x=1         HTTP/1.1 307 Temporary Redirect location: /login?next=%2Fe%2Fabc%3Fx%3D1 x-robots-tag: noindex, nofollow
/api/photos/abc    HTTP/1.1 307 Temporary Redirect location: /login?next=%2Fapi%2Fphotos%2Fabc x-robots-tag: noindex, nofollow
/robots.txt        HTTP/1.1 200 OK x-robots-tag: noindex, nofollow
/residents         HTTP/1.1 307 Temporary Redirect location: /login?next=%2Fresidents x-robots-tag: noindex, nofollow
User-Agent: *
Disallow: /

Unlocked:
/            HTTP/1.1 200 OK
/adopt       HTTP/1.1 200 OK
/r/R-0001    HTTP/1.1 200 OK
/robots.txt  HTTP/1.1 200 OK
/residents   HTTP/1.1 307 Temporary Redirect location: /login?next=%2Fresidents
User-Agent: *
Allow: /
```

- [x] Happy path works end to end — signed out and locked: landing page at `/`, Sign in goes to `/login`, a scanned `/r/R-0001` reaches `/login` with `<input name="next" value="/r/R-0001">` in the form. The sign-in itself and the return to the scanned page are existing `next` handling and are left for manual verification (Claude does not enter passwords)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete
- [ ] Empty state renders sensibly (no rows yet) — n/a: the landing page reads no data at all
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; `PUBLIC_SITE` values other than `locked` (or unset) leave the site open, as checked unlocked
- [x] Boundary cases checked — `/e/abc?x=1` keeps its query string through `next`; `/privacy` open, `/api/photos/` closed; locked `/` HTML carries `<meta name="robots" content="noindex, nofollow">`, no `og:` tags and no `/api/photos/` URLs; unlocked `/` still has its `og:title`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything as before | unchanged by the lock | not signed in — left for manual verification |
| management | as before | unchanged | not tested separately: the lock only branches on signed in / signed out |
| staff | as before | unchanged | as management |
| vet | as before | unchanged | as management |
| volunteer | as before | unchanged | as management |
| signed out | `/` (landing), `/login`, `/login/forgot`, `/auth/callback`, `/privacy`, `/robots.txt` | everything else → `/login?next=…` | pass (table above) |

- [ ] Every role above tested — n/a: the change branches only on whether there is a user, never on role; signed out tested here, one signed-in account left for manual verification
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — signed-out `curl` of public pages, `/r/`, `/e/` and `/api/photos/` gets a 307 from the proxy

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: note added to Getting started → Signing in and it typechecks, but `/manual` needs a signed-in session Claude cannot make here, so reading it is item 4 under Left for manual verification
- [x] Translatable strings go through the translation path — `login.locked.*` added in both `en.ts` and `th.ts` dictionaries; the landing page switched to ไทย and rendered the Thai strings. `/management/translations` is for public free text, not UI strings
- [x] Mobile viewport (375px) — no overflow, controls reachable (screenshot, Thai)
- [x] Browser console clean — no errors or React warnings on the landing page (the only errors listed were HMR WebSocket drops from restarting the dev server between locked and unlocked runs)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [x] The pages nearest the change still work — unlocked: `/`, `/adopt`, `/r/R-0001` 200 and `/residents` → `/login?next=` exactly as before, `/` still has its Open Graph tags
- [x] Any shared file touched checked from a second, unrelated page — `public-paths.ts` and the proxy: unlocked `/adopt` and `/residents` loaded with their old behaviour; the i18n dictionaries: `/login` loaded and rendered
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item was added on `backlog` today and has not reached `main`, so there is nothing to tick here; it is ticked on `backlog` after the merge
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated
- [x] `README.md` still accurate — Environments table has a "Public website" row, the cutover paragraph says to drop the var, and a "Locked public website" paragraph
- [x] **Release notes.** Would a shelter user notice this change? Yes — `unreleased` gained a line for it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the `process.env` route read in `node_modules/@opennextjs/cloudflare/dist/cli/templates/init.js` (`populateProcessEnv`); the gate's behaviour is the curl output above. Not measured: the deployed Worker actually seeing the var — left for manual verification

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no boundary or banding logic
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager — this change *is* about the public pages, so after deploying wait 10 minutes and check them signed out

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — `PUBLIC_SITE` is a plain var in `wrangler.jsonc`, deployed with the Worker; no secret to add

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` (or `--env test`) reopens the site in seconds; no schema or data. Edge-cached landing pages may linger for up to 10 minutes after a rollback, as pages do after a deploy.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Open Graph share previews of pages on lannacare.org and test.lannacare.org stop working while locked | accepted — by design until go-live |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed out, `/` shows the Staff testing site page, and `/adopt` sends you to sign in — i.e. the deployed Worker really sees `PUBLIC_SITE` | `test.lannacare.org` after `npm run deploy:test` (and lannacare.org after the prod deploy) |
| 2 | Signed in, `/`, `/adopt` and the rest of the public site look as they did before | same |
| 3 | Scan (or open) a resident card `/r/…` signed out, sign in, and land back on that resident | same |
| 4 | The new note under Getting started → Signing in reads correctly | `/manual`, signed in |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — four items above wait on a deploy and a signed-in person

Manual verification by: pending: the four items in Left for manual verification, after `npm run deploy:test`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links `docs/test-plans/uat-login-gate.md` and summarises it; the file on the branch is the record
- [ ] Handed to the production release manager — n/a: not yet — goes with the release, after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
