# Feature test plan — adoption-stories-app

## Header

| | |
|---|---|
| Feature | App half of public success stories: the Publish to the website control on the adoption update form, a Read their news link under a Happy endings picture on `/adopt` that opens `/adopt/stories/<resident id>`, the stories on an adopted animal's `/r/<code>` page, and the photo proxy serving a ticked update's photo |
| Backlog item | `docs/backlog.md` → **Show adoption updates to the public as success stories** (left open, status note added) |
| Branch / worktree | `claude/adoption-stories-app` @ `C:\Development\Animal_Shelter_adoption-stories-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | not yet open at this commit |
| Tested by / date | Claude / 2026-10-17 |
| Carries a migration? | no, but it reads `0215` (`public_recent_adoptions.resident_id`, PR #688), which must merge and reach production before this deploys |
| Tested at SHA | `PLACEHOLDER` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — staff can publish an adopter's photo and words, and strangers see only those on `/adopt` and the adopted animal's card page
- [x] Files/areas touched listed — `src/app/residents/[id]/adoption-updates/` (form, page, actions), the hub's adoption-updates section, `src/lib/adoption-updates/public.ts`, `src/app/adopt/` (page, `HappyEndings.tsx`, new `stories/[id]/page.tsx`), `src/app/r/[code]/page.tsx`, `src/app/api/photos/[fileId]/route.ts`, both dictionaries, manual, releases, decision, backlog
- [x] Roles affected identified — admin and management (who hold `resident.adoption_news`) gain the control; signed-out visitors see the result. Nobody else's screens change
- [x] Anything explicitly **out of scope** written down — no migration and no change to the view; `is_public_drive_file` is not widened (the proxy asks the view instead); Thai translation of the staff form is included but only English was driven

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR; the three existing dev updates were counted below
- [ ] Constraints and defaults exercised in a harness — n/a: no migration in this PR; the view's own filters were exercised on real dev rows in §4
- [ ] Down-migration — n/a: no migration in this PR
- [ ] Production apply plan — n/a: no migration in this PR, `0214` is already on `main`

## 4. Functional checks

- [x] Happy path works end to end — on dev, signed out, the picture of an adopted animal with a ticked story (Panda, and a test animal) carries a Read their news link under Happy endings; an adopted animal with no ticked story (Harness F20 Adopt) has no link. The link opens `/adopt/stories/<id>` showing the photo, the public words and the first name; `/r/R-1006` shows the same on the card page
- [x] Data persists — the page and the link read the database on each load; checked after reload in the browser pane
- [x] Create / edit / delete all exercised — untick (set `share_publicly` false) took the link off the picture and the story off the page's address at once; re-tick brought them back. The staff form's save path was typechecked and built, not driven (see Left for manual verification)
- [x] Empty state renders sensibly — with nothing ticked (3 updates, 0 ticked) `/adopt` showed Happy endings with plain pictures and no link and no extra section; an animal with no ticked story, a made-up id and a non-id each get the not-found page at `/adopt/stories/<x>`
- [x] Invalid input is rejected with a readable message, not a crash — the action refuses a tick with no words (`storyRequired`) and a first name with a space or over 40 characters (`firstNameOneWord`), in both languages; not driven through the form
- [x] Boundary cases checked — **default stays private:** count before any tick: 3 updates, 0 ticked, 0 rows in `public_adoption_updates`, and `/adopt` showed no stories. **Staff note never reaches the page:** Panda's note ("Settling in well with Sylvia and Estella. Sleeps on the sofa.") differs from its public story; the stories page contained the story and not the note. The adopted test animal's note `STAFF ONLY SECRET NOTE` was absent from the `/r/R-1006` HTML. **Deceased drops off:** Dryrun Yota (Deceased, ticked, with a photo) was absent from the view and the page. **Hidden drops off:** setting Panda's `is_public_visible` false took its story off `/adopt` (view count 0). **Untick unpublishes at once:** `/adopt` carried no section on the very next request

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | adoption update form with the Publish box | can set the three columns | n/a — not signed in as admin by Claude; the permission check is the existing `resident.adoption_news` one in `saveAdoptionUpdate`, unchanged |
| management | as admin | as admin | n/a — as above |
| staff | retired role | no login | n/a — role retired (`0173`) |
| doctor | the section, read only | cannot add or change; `saveAdoptionUpdate` refuses | n/a — the refusal is the unchanged `can(perms, "resident.adoption_news")` line |
| volunteer | no access to the section | unchanged | n/a — no permission or route changed |
| signed out | `/adopt`, `/r/<code>`, `/api/photos/<id>` | sees ticked stories only; an unrelated file id is 404 | checked: stories visible, staff note not, a made-up file id returned 404 |

- [ ] Every role above tested — n/a: only signed-out was driven; no permission or policy changed, so the staff roles' access is the existing rule
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; the public side can read nothing but the view's five columns, which `check-public-views.mjs` already guards

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) — the Adoption updates topic gained the Publish step and a note on what appears where and how to take it down
- [x] Translatable strings go through the translation path — all new text is in both `en.ts` and `th.ts` dictionaries; Thai was driven on `/adopt` (heading, subtitle, alt text) and renders; the staff-typed words are shown as typed, they are not machine-translated
- [x] Mobile viewport (375px) — `/adopt` at 375 px had `scrollWidth` equal to `clientWidth` before the change; the stories page was seen at 375 px, one column, no overflow
- [x] Browser console clean — the dev server logged no errors while the pages loaded
- [x] Network clean — `/api/photos/<id>?w=800` for a story photo returned 200 with `public` cache headers; a made-up id returned 404

## 6. Regression

- [x] The pages nearest the change still work — `/adopt` (cards, filters, Happy endings, How adoption works), `/r/R-1006`; `/adopt/<id>` and the hub section share no code changed here but compile in the build
- [x] Any shared file touched checked from a second, unrelated page — `en.ts`, `th.ts`, `manual/en.ts`, `releases.ts` and the photo route are shared: Thai `/adopt` and the story photo were loaded at runtime
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing came in; `main` was already merged

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open with a status note, because no person has used the staff form yet; the notes say what landed and what remains. Searched `docs/backlog.md` for Happy endings, adoption_updates and public_adoption_updates: no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-17-adoption-stories-app-half.md` (where the adopted animal's line lives, the proxy asking the view, what untick does to caches)
- [x] `README.md` still accurate — it does not describe this feature
- [x] **Release notes.** — `unreleased` gained a line for admin and management, saying they can publish an adopter's photo and words and that nothing is published until they tick it; no manual step outstanding
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the cache statements were read from the route and the pages and untick was observed on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager; the gates line above is unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager; the edge caches photo bytes for 24 hours (see the decision file), so untick of a photo someone already loaded can lag on the deployed build

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration; `0214` must already be on production before this code deploys, since the code reads its columns and view
- [ ] Production dry-run — n/a: no migration in this PR
- [ ] Destructive migration backup — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR; the release manager confirms `0214` is on production first

### Rollback

- [ ] Rollback position stated — deferred: release manager; code rollback is the Pi `--ref` rebuild. Rolling back leaves `share_publicly` set on any updates ticked meanwhile, but nothing public reads them, so nothing stays published

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Photo bytes can stay cached at the edge and in browsers for up to 24 hours after untick for someone who already loaded them | accepted — written in the decision file and the manual |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | An admin opens an adoption update, ticks Publish, types the words and a first name, saves, then unticks and saves; the red box, the Staff only and Goes on the website badges, and the Public on the website tag on the list read clearly | `/residents/<id>/adoption-updates/<update>/edit` signed in as admin |
| 2 | The same box and warning on a phone, and in Thai | same page at 375 px, language set to Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet, so this is not signed

Manual verification by: pending: a person tries the Publish box on the staff form, on a PC and a phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
