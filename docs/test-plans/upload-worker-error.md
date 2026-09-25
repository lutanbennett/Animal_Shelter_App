# Feature test plan

## Header

| | |
|---|---|
| Feature | Uploads between 1 and 15 MB reach the Server Actions, and a failed upload is reported in words |
| Backlog item | `docs/backlog.md` → **A logo or photo upload that exhausts the Worker shows the user a minified React error.** |
| Branch / worktree | `claude/upload-worker-error` @ `C:\Development\Animal_Shelter_upload-worker-error` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | opened right after this commit; the number is added in the next one |
| Tested by / date | Claude (automated) 2026-09-25 |
| Carries a migration? | no |
| Tested at SHA | `5053dcc` — the code commit; everything after it touches `docs/` only. Gates run on the clean tree there, `typecheck=0 lint=0 build=0` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `next.config.ts` raises Next's 1 MB Server Action body cap (and `proxy.ts`'s 10 MB one) to the app's 15 MB upload limit, and the three upload-action callers go through `runUploadAction`, which refuses an oversized file on the client and turns any rejected call into a readable message. The item asked for (a) the readable message and (b) a real limit. (a) is done. For (b), the measured cause of the reported failure was the 1 MB framework cap, not Worker exhaustion. The Worker's own ceiling is not measured; that is a follow-up item on the `backlog` branch (commit `7edfcaf`).
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `next.config.ts`; new `src/lib/uploads/limits.ts` and `src/lib/uploads/run-upload-action.ts`; `src/app/admin/website/{actions.ts,HeroPhoto.tsx,GalleryPhotos.tsx}`; `src/app/management/shelter-friends/actions.ts`; `src/app/contacts/[id]/ShelterFriendCard.tsx`; five upload routes under `src/app/api/` (the constant only, no behaviour change); `src/lib/i18n/dictionaries/{en,th}.ts` (one string each); `src/lib/releases.ts`; `docs/backlog.md`; `docs/decisions.md`. No `worker/`, no migration.
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin (Website hero and gallery photos), admin and management (Shelter Friend logos). The body-limit change applies to every Server Action and every request through `proxy.ts`, for all roles, but it only raises a cap. No access rules change.
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — measuring the largest upload a Cloudflare Worker actually completes (backlog follow-up); the Pi origin; the XHR uploaders (`PhotoUploader`, `AttachmentUploader`, including blood-test attachments). Those already show "Upload failed (500)." for a non-JSON failure and never showed the React error. Their limit now comes from the shared constant (same 15 MB).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: `Already up to date.`, then pushed.
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 135s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change; the upload code writes the same columns as before
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration; plain Worker deploy with no ordering constraint

## 4. Functional checks

Reproduced first, before any change: a 2 MB multipart POST (`curl`) to a compiled Server Action on :3006 returned `500` with `"digest":"2542773225@E394","message":"Body exceeded 1 MB limit."`. The limit applies before the action's code or its auth check runs, which is why none of the action's handling could catch it.

- [x] Happy path works end to end — on :3006, signed in as admin, a 3 MB `image/jpeg` fed to the Website hero input returned "Hero photo updated." (a real Drive upload: the local Drive credentials worked on 2026-09-25). Before the fix, a file this size failed with E394. Side effect, recorded honestly: the file was 3 MB of zero bytes, so the dev site's hero is now a broken image, and the action permanently deleted the previous dev hero file from Drive. Dev data is disposable; set a new hero on dev when convenient.
- [x] Data persists — reload the page and the change is still there — a fresh `no-store` fetch of `/admin/website`, parsed, shows the hero `<img src="/api/photos/1NAFh8O_pR5RBYTVjditj4nWo8qW1NL-2">` with Replace and Remove buttons, so the new file id was saved.
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: upload is the only operation changed; remove and delete are untouched
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new UI
- [x] Invalid input is rejected with a readable message, not a crash — a 16 MB file fed to each of the three inputs (hero, gallery, Shelter Friend logo on `/contacts/83f365f2-…`, "Harness Hardware (Shelter Friends test)") showed "File is larger than 15MB." at once, and `performance` recorded **0** fetches, so nothing was sent. The thrown path was forced by adding a temporary `throw` at the top of `uploadHeroPhoto`, and separately of `uploadFriendLogo`, then feeding a 1 MB file. Each showed "The server couldn't process that file, so nothing was saved. Try a smaller copy of the image (under about 2 MB), or try again in a moment." with no React error text. Both throws were removed and `git status` was clean afterwards. The second overlapped a gates run for about a minute, so that run was discarded and the gates in §2 were run again on the clean tree.
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — body limit against hand-built multipart POSTs to an action: 2 MB and 14 MB now pass the size check (they then fail as `Connection closed.`, the React decoder rejecting a payload that is not a real action reply, which is expected for a hand-built body). 17 MB is over the new 16 MB allowance: `proxy.ts` logged `Request body exceeded 16MB … Only the first 16MB will be available` and the action failed with `Unexpected end of form`. The client pre-check at 15 MB keeps real users below that. Exactly 15 MB was not sent.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/website` hero and gallery, Shelter Friend logo | uploads up to 15 MB; readable errors | driven in the browser pane as described in §4 |
| management | Shelter Friend logo | same as admin for logos | n/a: same component and action as admin's logo check; `assertManagementRole` unchanged |
| staff | none of these uploads | unchanged | n/a: no access change |
| vet | none of these uploads | unchanged | n/a: no access change |
| volunteer | none of these uploads | unchanged | n/a: no access change |
| signed out | none | unchanged | n/a: no access change |

- [ ] Every role above tested — n/a: no access rule changed; the actions' `assertAdminRole` / `assertManagementRole` calls are untouched
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rules changed. Note: a body up to 16 MB is now accepted before an action's auth check runs (the cap sits in the framework, ahead of any action code)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: nav not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual mentions no upload size; nothing it says changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the new string is a UI dictionary entry in `en.ts` and `th.ts`, not translatable content
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; the message uses the existing error line
- [x] Browser console clean — no errors or React warnings — errors read: the two deliberate `Upload failed: … TEMP simulated worker failure` entries from `runUploadAction` in the forced-throw tests (it keeps the real error for debugging), their two action 500s, and `ERR_CONNECTION_REFUSED` / HMR WebSocket entries from the dev server restarting when `next.config.ts` changed. No React warnings, nothing else from app code.
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — network log: the 3 MB upload's `POST /admin/website` → `200 OK`. The only 500s are the forced throws and the hand-built `curl` probes.

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/admin/website` and the contact page with a Shelter Friend card loaded and uploaded as above.
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: the upload routes only swapped a local constant for the shared one of the same value (typecheck proves the import); no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync merged nothing (`Already up to date.`)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked with a Done note. The Worker-ceiling measurement is a new item on `backlog` (`7edfcaf`).
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-25, "Upload failures: the 1 MB Server Action limit, and one upload limit"
- [x] `README.md` still accurate — it does not describe upload limits
- [x] **Release notes.** Would a shelter user notice this change? Yes — logos and Website photos over 1 MB failed with a React error code and now upload. `unreleased` gained one line in this PR.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the E394 cause, the 16 MB proxy truncation and the readable messages are from the runs above. Two claims are reasoned and labelled as such in decisions.md: that production's #441 was this same E394 (it fits the symptoms and the size dependence, but the production log was not read), and that the Worker's own ceiling is unmeasured.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — below the old 1 MB cap (1 MB forced-throw case), inside the new band (2, 3 and 14 MB), above the client limit (16 MB, refused client-side) and above the server allowance (17 MB, truncated). The exact 15 MB edge was not sent.
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: a new hero photo shows on `/` only after an admin uploads one; nothing changes public pages at deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` reverts it fully; there is no schema or data to leave behind.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The Website hero and gallery clients did not catch a rejected action at all, so the same failure would have reached an error boundary | fixed — both go through `runUploadAction` |
| 2 | low | `proxy.ts` truncates bodies over 10 MB under `next dev` / `next start` (the future Pi origin), which would break 10–15 MB uploads on every upload route | fixed — `proxyClientMaxBodySize` raised with the action limit |
| 3 | unknown | Whether a free-plan Worker can process a 15 MB upload is unmeasured | deferred to backlog (`7edfcaf`) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Upload a real 2–5 MB photo as a Shelter Friend logo, the image size that produced #441 on 2026-09-24. It should save and show. This is the check that matters: `next dev` runs the Node action path, and the Worker runs the edge path | `test.lannacare.org`, a Shelter Friend's contact page → Edit profile → Upload logo |
| 2 | Same with a real 2–5 MB photo as a Website gallery photo | `test.lannacare.org/admin/website` |
| 3 | The new failure message reads naturally in Thai (switch to ไทย, then pick a file over 15 MB) | either |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — three items await Lutan on test.lannacare.org

Manual verification by: pending: the three uploads under Left for manual verification, on test.lannacare.org

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links `docs/test-plans/upload-worker-error.md` and summarises it; the file on the branch is the record
- [ ] Handed to the production release manager — n/a: not yet — goes with the release, after merge

Result: pass

Release manager acknowledgement: pending
