# Test plan — photo-proxy-session-check

## Header

| | |
|---|---|
| Feature | `/api/photos/[fileId]` serves a public file (`is_public_drive_file`, 0084) to anyone, edge-cached. It serves any other file only when the caller's own session can select the row holding it (RLS decides), with `private, no-store` and no edge cache. The edge cache key moves to a new namespace so entries written by the old code are never matched |
| Backlog item | `docs/backlog.md` → Architecture → "The photo proxy serves any known Drive file to a signed-out visitor, internal attachments included." (feature half; closes it) |
| Branch / worktree | `claude/photo-proxy-session-check` @ `C:\Development\Animal_Shelter_photo-proxy-session-check` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | #131 |
| Tested by / date | Claude, 2026-09-25 |
| Carries a migration? | no (0084 landed in #124; 0085/0086 on `main` belong to the public-viewer stream) |
| Tested at SHA | `793a88b` (the change is `bd00a12`; `sync` merged `origin/main` @ `7910b0f`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for. Public files go to anyone and are cached as public. Anything else needs a session whose RLS can see the row, and is `private, no-store`. The cache key is changed. The item offered "split the check" or "require a session"; this is a stricter form of the second, and `docs/decisions.md` ("The photo proxy asks who is asking") says why the first was not enough: a session is not access (archived logins, `public_viewer`, vets and maintenance photos)
- [x] Files/areas touched listed: `src/app/api/photos/[fileId]/route.ts`; `scripts/check-public-views.mjs` (comment only); `docs/decisions.md`; `docs/backlog.md` (tick); this plan. No `worker/`, no migration
- [x] Roles affected identified: signed-out visitors lose internal files. Archived logins and `public_viewer` get only public files. A vet loses maintenance photos and legacy `project_photos` rows, which RLS already refuses them and no vet page shows. Admin, management, staff and volunteer see no difference
- [x] Anything explicitly **out of scope** written down:
  - `is_known_drive_file` is still EXECUTE-able by anon (0082) and still answers yes for any internal id. The route no longer calls it. Revoking it is a schema PR that must wait until this change is deployed to production, and it went to the `backlog` branch as "Take `is_known_drive_file` back from anon".
  - A file that stops being public stays edge-cached (and browser-cached) for up to 24h. Accepted in decisions.md.
  - When the Worker proxies to the Pi (`ORIGIN_HOST`), the route runs under Node with no `caches.default`, so only the header applies there.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `Auto-merging docs/decisions.md` / `Merge made by the 'ort' strategy.` (brought in 0085/0086 and the public-viewer schema plan). After the PR opened, a second `sync` merged `origin/main` @ `4c29f2e` (#129, Shelter Friend draft state: UI files only, nothing under `supabase/` or `src/app/api/`); gates were not re-run locally on that merge, and CI runs them
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 65s
=== gates: lint exited 0 after 157s
=== gates: build exited 0 after 311s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration; for the record, dev is `86 applied, 0 pending`, no drift, so 0084 (which this route calls) is live on dev
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change; §4 reads real dev rows through the route
- [ ] Constraints and defaults exercised — n/a: no migration. The function this route relies on was re-checked: `node scripts/check-public-drive-file.mjs` exited 0 (`HARNESS-OK public (resident photo, hidden resident's profile photo via cards, project photo, site hero + gallery, published logo) yes to anon and admin | intern…`)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration. 0084 is already applied to production (#126), so this route can deploy on its own

## 4. Functional checks

Driven against `next dev` on :3012 (dev database, real Drive; the local Google OAuth client worked today, so real bytes came back). Sessions were real dev logins minted with `auth.admin.generateLink` + `verifyOtp` into `@supabase/ssr` cookies, and sent as a `Cookie` header with curl. `norole` is a throwaway dev user, `photo-proxy-norole@example.test`, with no `user_roles` row. It was then given `public_viewer` (0085) for the second run. `maint-fixture` was a `maintenance_photos` row this session inserted with the made-up Drive id `h0085vetRefusedMaintPhoto` and deleted afterwards: **502 means the caller passed authorization and Drive had no such file; 404 means refused**. The other ids are real dev files: a public resident profile photo, a blood-test attachment, a procedure attachment, a project attachment that no public view shows, and an id nobody knows.

- [x] Happy path works end to end: a public photo is 200 for everyone, and every internal kind is 200 for every staff role. Full matrix, unedited:

```
claude     public-profile  200   cc=[public, max-age=86400, s-maxage=86400, immutable]
claude     blood-test      200   cc=[private, no-store]
claude     procedure       200   cc=[private, no-store]
claude     unpub-project   200   cc=[private, no-store]
claude     maint-fixture   502   cc=[]
claude     unknown         404   cc=[no-store]
manager    public-profile  200   cc=[public, max-age=86400, s-maxage=86400, immutable]
manager    blood-test      200   cc=[private, no-store]
manager    procedure       200   cc=[private, no-store]
manager    unpub-project   200   cc=[private, no-store]
manager    maint-fixture   502   cc=[]
manager    unknown         404   cc=[no-store]
staff      public-profile  200   cc=[public, max-age=86400, s-maxage=86400, immutable]
staff      blood-test      200   cc=[private, no-store]
staff      procedure       200   cc=[private, no-store]
staff      unpub-project   200   cc=[private, no-store]
staff      maint-fixture   502   cc=[]
staff      unknown         404   cc=[no-store]
vet        public-profile  200   cc=[public, max-age=86400, s-maxage=86400, immutable]
vet        blood-test      200   cc=[private, no-store]
vet        procedure       200   cc=[private, no-store]
vet        unpub-project   200   cc=[private, no-store]
vet        maint-fixture   404   cc=[no-store]
vet        unknown         404   cc=[no-store]
volunteer  public-profile  200   cc=[public, max-age=86400, s-maxage=86400, immutable]
volunteer  blood-test      200   cc=[private, no-store]
volunteer  procedure       200   cc=[private, no-store]
volunteer  unpub-project   200   cc=[private, no-store]
volunteer  maint-fixture   502   cc=[]
volunteer  unknown         404   cc=[no-store]
norole     public-profile  200   cc=[public, max-age=86400, s-maxage=86400, immutable]
norole     blood-test      404   cc=[no-store]
norole     procedure       404   cc=[no-store]
norole     unpub-project   404   cc=[no-store]
norole     maint-fixture   404   cc=[no-store]
norole     unknown         404   cc=[no-store]
signed-out public-profile  200   cc=[public, max-age=86400, s-maxage=86400, immutable]
signed-out blood-test      404   cc=[no-store]
signed-out procedure       404   cc=[no-store]
signed-out unpub-project   404   cc=[no-store]
signed-out maint-fixture   404   cc=[no-store]
signed-out unknown         404   cc=[no-store]
```

  The same user after `insert into user_roles … 'public_viewer'` (and `current_user_role` → `"public_viewer"` through the API with its token):

```
pubviewer  public-profile  200   cc=[public, max-age=86400, s-maxage=86400, immutable]
pubviewer  blood-test      404   cc=[no-store]
pubviewer  procedure       404   cc=[no-store]
pubviewer  unpub-project   404   cc=[no-store]
pubviewer  maint-fixture   404   cc=[no-store]
pubviewer  unknown         404   cc=[no-store]
```

- [x] The real pages still show their photos. Signed out, `/adopt` in the browser pane: the network log shows every `/api/photos/` request `200 OK` (home page and `/adopt`, 9 requests), both card images decoded at `naturalWidth` 600, and the screenshot shows them. Signed in as staff (curl with the session cookie), `/residents/8f1fc377-…/blood-tests` rendered (44 720 bytes) and referenced four `/api/photos/` ids. Each was `200 cc=[private, no-store]` for staff and `404 cc=[no-store]` signed out
- [ ] Data persists — n/a: the route writes nothing
- [ ] Create / edit / delete — n/a: read-only route
- [ ] Empty state — n/a: no list; an unknown id is the empty case, 404 above
- [x] Invalid input is rejected with a readable message: the id pattern check is unchanged and still runs before any lookup (`400 Invalid photo id.`). A refused file is `404 {"error":"Photo not found."}`, identical to an unknown id, so a signed-out caller cannot tell an internal file exists
- [x] Boundary cases checked:
  - **The edge cache, on the Workers runtime.** `next dev` has no `caches.default`, so the OpenNext build (`npm run opennext:build`, exit 0) was run with `npx wrangler dev --local --port 8812`. That is the real `worker/index.mjs` → OpenNext → route, with miniflare's Cache API. Unedited:

```
--- 1. a signed-in vet views two internal files, then signed-out asks for the same URLs
200 10.611691s cc=[private, no-store] cf-cache-status=[] served-by=[worker]  vet        blood-test
200 3.797369s cc=[private, no-store] cf-cache-status=[] served-by=[worker]  vet        procedure
404 1.451913s cc=[private, no-cache, no-store, max-age=0, must-revalidate] cf-cache-status=[] served-by=[worker]  signed-out blood-test (after vet)
404 1.409023s cc=[private, no-cache, no-store, max-age=0, must-revalidate] cf-cache-status=[] served-by=[worker]  signed-out procedure (after vet)
200 4.391438s cc=[private, no-store] cf-cache-status=[] served-by=[worker]  vet        blood-test again
--- 2. a public photo: first fetch fills the edge cache, later ones (any caller, any query string) come from it
200 2.604334s cc=[public, max-age=86400, s-maxage=86400, immutable] cf-cache-status=[] served-by=[worker]  signed-out public #1
200 0.263869s cc=[public, max-age=86400, s-maxage=86400, immutable] cf-cache-status=[HIT] served-by=[worker]  signed-out public #2
200 0.270727s cc=[public, max-age=86400, s-maxage=86400, immutable] cf-cache-status=[HIT] served-by=[worker]  signed-out public ?bust=1
200 0.812291s cc=[public, max-age=86400, s-maxage=86400, immutable] cf-cache-status=[HIT] served-by=[worker]  vet        public
```

  The public `HIT`s show the cache was live in that run. A private file never got a `HIT`, even on the vet's second fetch, and a signed-out request right after the vet's was refused. That is the leak the item describes, and it is closed. `?bust=1` hitting the same entry shows the key ignores the query string. On the 404's `Cache-Control`: Next rewrites the route's `no-store` to its own `private, no-cache, no-store, max-age=0, must-revalidate` on the Workers build, and both are uncacheable.
  - **The orphaned old entries are reasoned, not observed.** Showing it would need the old build to fill the cache first. The claim rests on the key: the old code used `request.url` (`/api/photos/<id>`), and the new key is `/api/photos/<id>?edge=public-v2`. Cache API matching is by exact URL, and `?bust=1` above shows the new code never looks up a bare `request.url`.
  - **Vet and RLS:** vet is refused the maintenance fixture (404) while admin, management, staff and volunteer passed authorization (502). Live `pg_policies` on dev give vet no policy on `maintenance_photos` or `project_photos`, and all five roles one on `attachments` and `shelter_friends`.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | public + every internal kind | 200; internal `private, no-store` | as expected (`claude@lutan.com`) |
| management | public + every internal kind | same | as expected (`manager@gmail.com`) |
| staff | public + every internal kind | same | as expected; also the real blood-test page |
| vet | public + attachments; not maintenance photos | 404 on the maintenance fixture | as expected |
| volunteer | public + every internal kind | same as staff | as expected |
| signed out | public only | 404 for everything else, even after a signed-in fetch on the Workers build | as expected |

Also checked beyond the template's rows: a session with no role (standing in for an archived login, whose `current_user_role()` is null) and a `public_viewer` session, public only.

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side: every refusal above is the route itself answering a direct request, and no UI is involved

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page or nav change
- [ ] Manual updated — n/a: nothing a user does changes; the manual does not describe the photo proxy
- [ ] Translatable strings — n/a: no new strings; the JSON error text is unchanged
- [ ] Mobile viewport — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change; the only browser check was `/adopt` loading its photos, which the network log covers
- [x] Network clean: every `/api/photos/` request from the home page and `/adopt` returned `200 OK` (read_network_requests, 9 requests)

## 6. Regression

- [x] The pages nearest the change still work: `/` and `/adopt` signed out (photos 200 and decoded); a resident's blood-tests section signed in as staff (its four attachment photos 200). `node scripts/check-public-views.mjs` exit 0, 112 ok, 0 FAIL, after the sync. It includes `is_public_drive_file(): yes for a public resident photo — true` and `no for a blood-test/procedure file — false`
- [ ] Shared file touched checked from a second page — n/a: no shared UI file or lib touched; `check-public-views.mjs` changed only in a comment, and it was run above
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge brought 0085/0086 (`public_viewer`, app-access gate), and the `public_viewer` run above was made after it. 0086 leaves base-table RLS as it was, which is what `canSeeInternalFile` reads; gates ran on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch. The follow-up ("Take `is_known_drive_file` back from anon") went on the `backlog` branch, commit pushed
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: "2026-09-25 — The photo proxy asks who is asking". It covers why RLS and not "signed in", why not a role allow-list, refusal as 404, `private, no-store` and why not `max-age`, the new cache key and why, the accepted 24h staleness, and the Pi path having no edge cache
- [x] `README.md` still accurate: it does not describe the proxy's access rule or cache key (checked by grep for `api/photos`)
- [ ] **Release notes.** n/a: nobody using the app as intended sees a difference. Staff see the same photos and the public sees the same public photos. Only a signed-out, archived or no-access caller holding an internal file's URL now gets "not found", and nobody reaches that through the app
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned. The exception is the orphaning of old cache entries, which is labelled as reasoned in §4 with the reason

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. Note test is `PUBLIC_SITE: locked`, so signed-out `/api/photos/` redirects to `/login` there before the route runs; the signed-out case is only visible on an unlocked environment
- [ ] Timezone-sensitive behaviour — n/a: nothing here reads a date or clock
- [ ] Boundary or banding change — n/a: no threshold; the permission boundary is covered role by role in §4, both sides (allowed and refused) for each kind
- [x] Evidence pasted into this plan is the tool's actual output, unedited: the matrix, the Workers cache run and the gates lines are pasted from their output files
- [ ] Public pages re-checked after a cache purge or 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration here; the function this code calls (0084) is already on production (#126)
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration. **Ordering for the follow-up**: the backlog item revoking anon's `is_known_drive_file` must not apply to production until this deploy is live

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` restores the old route, and with it the leak. Nothing in the database changes, so there is nothing to revert there. Rolling back also restores the old URL cache key, and entries the old code cached before this deploy may still be alive under it for up to 24h

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | Found while building, in the first draft of this change: "signed in → `is_known_drive_file`", the item's first suggestion, would have given internal files to an archived login, a `public_viewer` and (for maintenance photos) a vet | fixed before commit: the route asks RLS with the caller's session |
| 2 | Low | `is_known_drive_file` is still anon-callable and confirms an internal id exists | deferred to backlog ("Take `is_known_drive_file` back from anon"), after this deploys to production |
| 3 | Low | A file that stops being public is still served from caches for up to 24h | accepted (decisions.md) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in normally (Google), open a resident's blood tests and procedures and a maintenance job with photos: images show as before | `test.lannacare.org` after deploy, or `localhost:3012` |
| 2 | Signed out in a private window, paste one of those image URLs: "Photo not found." | an unlocked environment (not `test`, which redirects to `/login` first) |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (photo-proxy-session-check session)  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items above wait for Lutan

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — the PR is not merged at this commit

Result: pass

Release manager acknowledgement: pending
