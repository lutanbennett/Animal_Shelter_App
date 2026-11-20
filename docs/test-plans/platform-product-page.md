# Feature test plan

## Header

| | |
|---|---|
| Feature | Product page at the platform apex (cooperjaidee.org) |
| Backlog item | `docs/backlog.md` → #apxld (product page half; stays open for the multi-shelter chooser) |
| Branch / worktree | `claude/platform-product-page` @ `C:\Development\Animal_Shelter_platform-product-page` |
| Dev server | `http://localhost:3005` with `PLATFORM_HOST=localhost` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | ca79b62d9 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a public product page at `/platform/about`, reached from `/` on the platform host, linking to the enquiry form and the two sign-ins
- [x] Files/areas touched listed: `src/app/platform/about/page.tsx`, `src/lib/site-hosts.ts` (+test), `src/lib/public-paths.ts`, both dictionaries, `scripts/check-permission-catalogue.mjs`, one decision file
- [x] Cards affected identified: none; the page is public and static. Admin and signed-out public: signed-out public gains one page
- [x] Out of scope written down: the multi-shelter chooser (Lutan's to settle); `#apxld` stays open

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: typecheck exited 0 after 113s
=== gates: lint exited 0 after 418s
=== gates: test exited 0 after 61s
=== gates: build exited 0 after 321s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: on `localhost:3005/platform/about` the page renders, the enquire link goes to `/platform/enquire`
- [ ] Data persists — reload the page and the change is still there — n/a: the page stores nothing
- [ ] Create / edit / delete all exercised — n/a: static page, no data
- [ ] Empty state renders sensibly — n/a: static page, no data
- [ ] Invalid input is rejected with a readable message — n/a: the page has no input
- [ ] Boundary cases checked — n/a: no input; `/` routing boundary covered by the unit test

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | page is public | not separately driven |
| signed out | `/platform/about` | page renders (no redirect to /login) | pass; before adding it to PUBLIC_PATHS it redirected to /login, now fixed |

- [x] Every login above tested: signed out driven in the browser; admin not separately driven, the page ignores who is signed in
- [ ] A login that should not have access is blocked server-side — n/a: the page is public by design, reads nothing; host check answers not-found off the platform host (unchanged pattern from /platform/enquire)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry, public page on its own host
- [ ] Manual updated — n/a: not a shelter-facing feature
- [x] Translatable strings go through the dictionaries: every string in `en.ts` and `th.ts`, both seen rendered on screen. `/management/translations` n/a: it covers shelter-editable text, these are fixed dictionary keys
- [ ] Mobile viewport (375px) — pending: not driven; the layout is a single column of prose
- [x] Browser console clean — no errors seen on the page load
- [ ] Network clean — n/a: nothing fetched beyond the page itself

## 6. Regression

- [x] The pages nearest the change still work: `/platform/enquire` is still kept and reachable (PUBLIC_PATHS edit only appended); routing unit test updated and passes
- [ ] Any shared file touched checked from a second page — n/a: `site-hosts.ts` and `public-paths.ts` readers are covered by their unit tests; the only runtime reader of `platformRedirect` is `src/proxy.ts`, exercised by curl (`/` gives 307 to /platform/about, `/residents` gives 307 to /platform)
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: the chooser half keeps #apxld open, by the brief
- [x] Non-obvious design choices recorded in `docs/decisions/2026-11-20-platform-product-page.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: no shelter user or Admin would see this page; it is the product's public front page at cooperjaidee.org
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the sign-in redirect and the 307s were observed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates
- [ ] Boundary or banding change assertions — n/a: no banding
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates block, pasted unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the PR; nothing persisted, no schema

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | New page redirected signed-out visitors to /login until added to PUBLIC_PATHS | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: list is empty

Manual verification by: n/a: nothing for a person to look at beyond what was driven

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed with the PR
- [ ] Handed to the production release manager — pending: at release time

Result: pass

Release manager acknowledgement: pending
