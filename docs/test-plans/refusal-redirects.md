# Feature test plan

## Header

| | |
|---|---|
| Feature | Refusals land inside the app; a booked vet visit returns to the resident |
| Backlog item | `docs/backlog.md` → "A refused page and a booked vet visit both dump you onto the public website." |
| Branch / worktree | `claude/refusal-redirects` @ `C:\Development\Animal_Shelter_refusal-redirects` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | no |
| Tested at SHA | `9f5d96b` (the fix; this plan is the commit after it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: role refusals go to `/no-access` inside the app (a public viewer still to `/`), and booking a vet visit returns to the resident's Vet Appointments (one resident) or the Residents list (several) — the item's two fixes, for its four sites plus the fifth the sweep found
- [x] Files/areas touched listed: `src/lib/auth/require-role.ts` (new `requireRole`, `refuse`, `refusedPath`, `NO_ACCESS_PATH` beside the existing `assertPhotoWriteAccess`), `require-management.ts`, `require-admin.ts`, `src/app/stocktake/page.tsx`, `src/app/deliveries/page.tsx`, `src/app/vet-visits/new/actions.ts`, new `src/app/no-access/page.tsx`, i18n `en.ts`/`th.ts` (`noAccess`), `src/lib/manual/en.ts`, `src/lib/releases.ts`, docs
- [x] Roles affected identified: every app role (admin, management, staff, vet, volunteer) through the refusals and the booking path; public viewer through `refusedPath`'s fallback; signed-out unchanged (`/login`)
- [x] Out of scope written down: server actions still throw/return their refusal (`assertManagementRole`, `assertAdminRole`) — a redirect from a form submission is not a refusal anyone reads. Pages that gate by role in other ways (hub sections, `/maintenance`'s empty board) are order 3's, "Cut the vet's world down", which is to call `requireRole`. No `forbidden()`: experimental in Next 16.3 (`authInterrupts`), see `docs/decisions.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 302s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

Driven by a scratch script against `next dev` on :3007: it signs in the dev
test account with `@supabase/ssr` (credentials from `.env.local`), sets the
account's `user_roles.role` to the role under test with the service key,
requests each path with `redirect: "manual"`, and restores the original role
(`admin`) in a `finally` — confirmed `admin` afterwards. A guarded page answers
200 and streams its redirect (the root `loading.tsx` has sent headers by the
time the guard runs), so the script reports the `NEXT_REDIRECT` target from the
body; the proxy's own redirects are real 307s. Output as printed (vet run):

```
role: vet
/stocktake                       200  streamed redirect -> /no-access
/deliveries                      200  streamed redirect -> /no-access
/management                      200  streamed redirect -> /no-access
/management/recurring-jobs       200  streamed redirect -> /no-access
/management/contacts             200  streamed redirect -> /no-access
/admin                           200  streamed redirect -> /no-access
/admin/security                  200  streamed redirect -> /no-access
/no-access                       200  h1="You don&#x27;t have access to this page"
/my                              200  h1="My tasks"
restored admin
```

- [x] Happy path: every refused route above sends a vet to `/no-access`, which renders its heading; `/my` still opens. The booking path's two destinations render for a vet: `/residents/<id>/vet-appointments` → 200 "Vet Appointments", `/residents` → 200 "Residents", and `/vet-visits/new` → 200 "Book Vet Visit". Submitting the form itself was not driven (see Left for manual verification 1)
- [ ] Data persists — n/a: nothing is stored; the change is where requests are sent
- [ ] Create / edit / delete — n/a: no records gain or lose an operation; booking is exercised only as far as its landing page (manual item 1)
- [ ] Empty state — n/a: `/no-access` has no data to be empty
- [ ] Invalid input — n/a: no input added; the booking form's validation is untouched and still returns before the redirect
- [ ] Boundary cases — n/a: no values; the only branch is one resident versus several, whose two destinations are both checked above

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /stocktake, /deliveries, /management, /management/recurring-jobs, /admin, /no-access, /my | all open | all 200 with their own heading |
| management | /stocktake, /deliveries, /management; not /admin | /admin → /no-access | as expected |
| staff | /stocktake, /deliveries; not /management, /admin | refused → /no-access | as expected |
| vet | none of the gated pages (table above) | all → /no-access | as expected |
| volunteer | /stocktake; not /deliveries, /management, /admin | refused → /no-access | as expected |
| signed out | nothing gated | → /login (proxy, unchanged) | unchanged code path, not re-run |
| public_viewer | none, and not /no-access or /my either | → `/` | proxy 307 → `/` on all six, as before; `refusedPath` never reached |

- [x] Every role above tested (signed out: the proxy branch is untouched and `requireRole` keeps `/login` for no user)
- [x] A role that should not have access is blocked server-side — each row above is a direct request for the URL, not a check of the menu

## 5. Cross-cutting

- [ ] Nav entry — n/a: `/no-access` is a destination, not a menu item; `NavLinks.tsx` not touched
- [x] Manual updated: "Finding your way around" gains a line on the no-access page; "Booking and recording vet visits" says where Book vet visit lands. Read in source, not loaded at `/manual` — the browser pane could not be signed in (manual item 2)
- [ ] Translatable strings through the translation path — n/a: the new strings are UI dictionary strings in `en.ts`/`th.ts`, not free-text content that goes through `/management/translations`
- [ ] Mobile viewport (375px) — n/a: not seen in a browser here; listed as manual item 2
- [ ] Browser console clean — n/a: no browser session could be signed in here (the dev test account's password may not be typed into the pane); manual item 2
- [x] Network clean — the dev server's responses for every route in the matrix were 200 or the proxy's 307, no 4xx/5xx

## 6. Regression

- [x] Pages nearest the change still work: `/stocktake`, `/deliveries`, `/management`, `/management/recurring-jobs`, `/admin` all open for admin with their own headings; `/stocktake` for staff, volunteer and management; `/deliveries` for staff and management; `/my`
- [x] Shared files touched (`require-management.ts`, `require-admin.ts` behind every `/management/*` and `/admin/*` page; `en.ts`/`th.ts`) checked by loading `/management/contacts`, `/management/recurring-jobs`, `/admin/security` and `/my`, not by reading them
- [x] Nothing merged from `main` during `sync` — it was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-27: `requireRole` as the one page guard and what later guards call, `/no-access` rather than a silent bounce to `/my`, why not `forbidden()`, the public-viewer fallback, where booking lands
- [ ] `README.md` still accurate — n/a: it describes neither the guards nor where a booking lands
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line: booking a vet visit returns to the resident or the Residents list, and a page your role doesn't include says so inside the app
- [x] Commit messages say why, not just what
- [x] Claims measured, not reasoned: every destination stated in the commit and in `decisions.md` is one the script above printed; the "streams its redirect as 200" behaviour was observed, and is why the script reads the body

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary or banding change covered on both edges — n/a: no threshold, band or cutoff changed; the one-versus-several branch is covered on both sides above
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates lines and the vet run are as printed; the matrix rows summarise the other roles' runs
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` restores the old redirects at once; there is no schema or data to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | A refused page is reached by a redirect, so the address bar shows `/no-access`, not the page that was refused, and the page cannot name it | accepted — keeping the URL needs `forbidden()`, experimental in this Next; see `docs/decisions.md` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Book a vet visit for **one** resident: you land on that resident's Vet Appointments with the new visit listed. Then book for **two** from the Residents list's selection: you land on the Residents list. Not driven here — the browser pane could not be signed in | `localhost:3007` or `test.lannacare.org` after deploy, `/vet-visits/new` |
| 2 | As a vet, tap a stocktake recurring job (the original report), then open `/deliveries` and a `/management/*` page: each shows "You don't have access to this page" with the app menu still there and Go to My tasks working — at phone width too, console clean. Also glance at the two manual lines in `/manual` | same |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are outstanding; see the pending line below

Manual verification by: pending: booking lands on the resident or the list, and the no-access page as a vet in a browser (Left for manual verification 1 and 2)

### Result

- [x] Open defects are either fixed or explicitly accepted above — the one defect is accepted
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
