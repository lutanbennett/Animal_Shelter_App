# Feature test plan

## Header

| | |
|---|---|
| Feature | The website is off on Test: a third `PUBLIC_SITE` state, `"off"`, set on the test Worker only |
| Backlog item | `docs/backlog.md` → `#br3f3`, "THE WEBSITE MUST BE OFF ON TEST" |
| Branch / worktree | `claude/test-website-off` @ `C:\Development\Animal_Shelter_test-website-off` |
| Dev server | `next dev` on `http://localhost:3006`, with `PUBLIC_SITE` set per run in a gitignored `.env.development.local` (off, locked) and unset (open, after a restart) |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | `be265e7a` (gates); docs-only commits after it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a new `PUBLIC_SITE: "off"` (test Worker only) under which nobody sees the website: a signed-in login is sent to the app, or to `/no-access` when its cards open nothing, and nothing sends anyone to `/`; `"locked"` is unchanged
- [x] Files/areas touched listed: `src/lib/public-site.ts`, `src/lib/public-paths.ts`, `src/lib/supabase/proxy.ts`, `src/app/page.tsx`, `src/lib/auth/require-role.ts`, `src/lib/auth/app-access.ts`, `src/lib/auth/next-path.ts` (`NO_ACCESS_PATH` moved here), `src/app/no-access/page.tsx`, `wrangler.jsonc` (test block only), two test files, docs
- [x] Cards affected identified: no card's behaviour changes. What changes is keyed on `entersApp()` (any card at all, or Admin), as before. Signed-out visitors: unchanged in every state. Admin: website pages send it to `/home` on Test only
- [x] Anything explicitly **out of scope** written down: uat and production stay `"locked"`; the signed-out `/` stays the sign-in landing page (Google's consent screen lists it); `/privacy` is never redirected; `/r/` and `/e/` keep forwarding into the app; no deploy is done here (see section 8)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`, pasted below exactly as printed
- [ ] CI green on the PR (runs the same four gates, among its other checks). n/a: not yet — the PR does not exist at this commit

```
=== gates: typecheck exited 0 after 58s
=== gates: lint exited 0 after 146s
=== gates: test exited 0 after 24s
=== gates: build exited 0 after 130s
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one. n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying. n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed. n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`. n/a: no migration
- [ ] File is re-runnable. n/a: no migration
- [ ] Existing rows still read correctly after the change. n/a: no migration
- [ ] Constraints and defaults exercised against real rows. n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated. n/a: no migration
- [ ] Production apply plan stated for the release manager. n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: with `PUBLIC_SITE=off`, a login holding no cards asked for `/adopt` in the browser pane and landed on `/no-access`, which showed the no-access message, no Home button and the header's Sign out, and was still there five seconds later with one navigation entry
- [ ] Data persists — reload the page and the change is still there. n/a: nothing is written
- [ ] Create / edit / delete all exercised. n/a: nothing is written
- [ ] Empty state renders sensibly. n/a: no list or data view changed
- [ ] Invalid input is rejected with a readable message, not a crash. n/a: no input
- [x] Boundary cases checked: unknown `PUBLIC_SITE` values (`""`, `"open"`, `"LOCKED"`, `"Off"`, `"yes"`) read as open, asserted in `src/lib/public-site.test.mjs`; look-alike and app paths (`/adoptive`, `/no-access`, `/home`, `/login`, `/api/photos/a`, `""`) are not website pages, asserted in `src/lib/public-paths.test.mjs`

### Role access matrix

Each result is the redirect chain curl followed with that login's session cookie on `next dev` :3006. The no-card
login is dev's `public_viewer`, which holds no cards: any login holding even one card enters the app, so
`dev-signin.mjs --cards` cannot model the tester's login.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin, off | `/`, `/adopt`, `/our-work`, `/donate`, `/login` | → `/home` | `-307-> /home [200]` each; `/home`, `/residents`, `/privacy` 200 |
| no cards, off | `/`, `/adopt`, `/our-work`, `/donate`, `/r/CODE1`, `/e/1`, `/home`, `/residents`, `/login` | → `/no-access`, and stays | `-307-> /no-access [200]` each, one hop; `/no-access` and `/privacy` 200 |
| signed out, off | `/`, `/privacy`, `/robots.txt`, `/api/version`; website pages, `/home`, `/no-access` | landing page and `/privacy` answer; the rest → `/login` | `/` 200 (one link, to `/login`); `/privacy`, `/api/version` 200; robots `Disallow: /`; every other → `/login?next=…` |
| admin, locked | `/`, `/adopt`, `/home` | unchanged: the website shows | 200 each |
| no cards, locked | `/`, `/adopt`, `/home`, `/no-access`, `/login` | unchanged: website shows, the app sends to `/` | `/`, `/adopt` 200; `/home`, `/no-access`, `/login` `-307-> /` |
| signed out, locked | `/`, `/adopt`, `/privacy` | unchanged | `/` 200, `/adopt` → `/login?next=%2Fadopt`, `/privacy` 200 |
| signed out / no cards / admin, open | `/`, `/adopt`, `/privacy`, `/home` | unchanged: the website is open | signed out `/`, `/adopt`, `/privacy` 200, robots `Allow: /`; no cards `/adopt` 200, `/home` → `/`; admin `/adopt`, `/home` 200 |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails): every row above is a direct request with no browser, so the proxy and page answered, not a hidden link

## 5. Cross-cutting

- [ ] Nav entry correct. n/a: no nav change
- [ ] Manual updated. n/a: a Test-only setting that no shelter user can see; nothing in the manual describes it
- [ ] Translatable strings go through the translation path. n/a: no new strings; `/no-access` reuses its own
- [ ] Mobile viewport (375px). n/a: no layout change; `/no-access` only lost a button
- [x] Browser console clean — no errors from the app on `/no-access` for the no-card login in the pane, after `/` sent it there; the only errors were the dev server's hot-reload socket dropping while I restarted it between states
- [x] Network clean — every request in the matrix ended in a 200 after at most one redirect

## 6. Regression

- [x] The pages nearest the change still work: `locked` and open measured unchanged (matrix rows 4–7); `/home`, `/residents`, `/privacy` load for Admin
- [ ] Any shared file touched checked from a second, unrelated page. n/a: no shared UI file touched (`NavLinks.tsx`, `manual/en.ts` unchanged); the shared libs changed are covered by the matrix
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged in ("Already up to date")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, saying the deploy is still outstanding
- [x] Non-obvious design choices added as `docs/decisions/2026-11-09-website-off-on-test.md`
- [ ] `README.md` still accurate. n/a: it does not describe `PUBLIC_SITE`
- [ ] **Release notes.** n/a: this is a Test-only setting that no shelter user can see, and the change does nothing until the test Worker and the test Pi are deployed, which is a step outside this PR
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured, not reasoned: every redirect in the decision file is a curl result from this session, and the Pi point was read from `scripts/pi/write-env.mjs` and `scripts/deploy.mjs`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time. deferred: whoever deploys Test
- [ ] Deployed SHA matches the tested SHA. deferred: whoever deploys Test

### On the deployed build

- [ ] Deployed to test: the test Pi (`deploy-pi.sh --env test`, which writes `PUBLIC_SITE` into the Pi's env from `wrangler.jsonc`) and the test Worker (`node scripts/deploy.mjs --env test`); both are needed, because the Pi serves Test's pages. deferred: whoever deploys Test
- [ ] Smoke-tested on `test.lannacare.org`: a no-card login signs in and lands on `/no-access` and stays; `/adopt` signed in goes to the app; `/privacy` answers. deferred: whoever deploys Test
- [ ] Timezone-sensitive behaviour proved. n/a: nothing here touches dates
- [ ] Boundary or banding change covers both edges. n/a: no boundary or banding change
- [x] Evidence pasted into this plan is the tool's actual output, unedited (the gates block); the matrix is transcribed from curl chains printed this session
- [ ] Public pages re-checked after a cache purge or a 10-minute wait. deferred: whoever deploys Test. The edge cache holds only anonymous pages, and a signed-out `/` is the landing page in both states

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read. n/a: production is not deployed by this change; `wrangler.jsonc`'s production and uat blocks still read `"PUBLIC_SITE": "locked"`, read in the diff
- [ ] `strip-baked-env` seen in the deploy output. deferred: whoever deploys Test
- [ ] Any new secret/env var exists in the production Cloudflare environment. n/a: no new var; `PUBLIC_SITE` is a `wrangler.jsonc` var and already copied to the Pi (`scripts/lib/runtime-config.mjs`)

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR? n/a: no migration
- [ ] `--env production --dry-run` run and clean. n/a: no migration
- [ ] Destructive migration backup. n/a: no migration
- [ ] Apply plan stated. n/a: no migration

### Rollback

- [ ] Rollback position stated. n/a: code and one Worker var; to put the website back on Test, set the test block's `PUBLIC_SITE` back to `"locked"` and deploy Test again. Nothing touches data or schema

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Under `"off"` a signed-in `/` first redirected from the page after the loading screen had begun streaming (200 with a meta refresh) | fixed: the proxy now answers it with a 307 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person: empty, because the deployed check is section 8's

Manual verification by: n/a: nothing for a person to look at before deploy; the smoke test on Test is in section 8

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR. n/a: pasted once the PR exists
- [ ] Handed to the production release manager. n/a: Test only; nothing for production

Result: pass

Release manager acknowledgement: n/a: Test-only change, nothing goes to production
