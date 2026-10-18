# Feature test plan

## Header

| | |
|---|---|
| Feature | Posted on social media, app half: the Posted badge, the Not posted yet / Posted / All filter, Mark as posted and Undo, and marking several photos at once, on a resident's Photos |
| Backlog item | `docs/backlog.md` → **Mark a resident's photo as "posted on social media"** (ticked here) |
| Branch / worktree | `claude/posted-on-social-app` @ `C:\Development\Animal_Shelter_posted-on-social-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | not yet opened at this commit |
| Tested by / date | Claude / 2026-10-18 |
| Carries a migration? | no — reads `0223_social_shares.sql` (#725), already on `main` and applied to dev |
| Tested at SHA | `3ed307c1` (after sync with `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a resident's photos show a Posted badge with the platforms, can be filtered Not posted yet / Posted / All, and a photo (or several selected at once) can be marked as posted and undone
- [x] Files/areas touched listed: `src/components/PhotoGallery.tsx`, `src/lib/social-shares.ts` (new), `src/app/residents/[id]/photos/actions.ts` (two actions), the Photos and Adoption updates section renderers, both dictionaries, the manual, `releases.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `scripts/check-permission-catalogue.mjs`
- [x] Roles affected identified: admin and management mark and undo (photos.resident_manage, sees all residents); anyone who sees the photo sees the badge; signed-out public: nothing, no public view reads the table
- [x] Out of scope written down: the across-all-residents list of photos not yet posted (the item's optional part 4); memes and `/memes`; the home page and cards. Marking never makes a photo public

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (one backlog line, auto-merged)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
=== gates: typecheck exited 0 after 18s
=== gates: lint exited 0 after 117s
=== gates: test exited 0 after 12s
=== gates: build exited 0 after 50s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; `0223` merged in #725
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR; `0223` was applied to dev by the schema stream
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR; photos with no share rows read Not posted yet (§4)
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR; the table's policies were exercised from the app side as a login (§4)
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; `0223` must be live in production before this ships

## 4. Functional checks

- [x] Happy path works end to end: on dev at 375 px as a Management login, a Medical photo marked Facebook with today's date and a link showed a green Posted FB badge; the row read back from the database had `owner_type` attachment, platform facebook, today's date, the link and `recorded_by` stamped
- [x] Data persists — after a full reload the badge, the counts and the lightbox list were still there
- [x] Create / edit / delete all exercised: marked one photo, undid it (counts returned to Not posted yet 6, Posted 0), then selected three photos and marked them Instagram in one save. The database held exactly three attachment rows, owned by the three ticked photos and no others. Edit is not a feature here: a wrong record is undone and made again
- [x] Empty state renders sensibly: a photo with no rows reads "Not posted yet." in the lightbox and carries no badge; filtering to Posted with none shows the gallery's empty line
- [x] Invalid input is rejected with a readable message: the action refuses no platform, a future date, a link that is not https and a note over 500 characters, each with its own sentence (code read; the form only offers the five platforms and caps the date at today). The database check constraints are the second line
- [x] Boundary cases checked: the negative case that matters most. With three photos posted, a share row for a meme (`owner_type` meme, Instagram) was inserted with the service key and the page reloaded: still Posted 3 of 6, so a meme's share never makes a photograph read as posted. The read pins `owner_type`; the id in the other table is a meme id, never an attachment id

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Photos | badge, filter, Mark, Undo, Select | not separately driven: same code path and permission as management (Admin is yes to every activity) |
| management | Photos | badge, filter, Mark, Undo, Select | driven at 375 px in English and Thai: all worked |
| staff (retired) | n/a | n/a | n/a: the staff role was retired by `0173` |
| doctor | Photos, own clinic scope | no resident scope "all" | n/a: not driven; their scope cannot read other residents' photos, and the policy needs `sees_all_residents()` |
| volunteer | Photos, who and where | no photos read | n/a: not driven; same reason |
| viewer role (throwaway custom role: scope all, `resident.record` Read only) | Photos | badge and post list, no buttons | driven: three badges, the lightbox list "Instagram · 18 Oct 2026", no Select, Mark as posted or Undo. As that login: an insert was refused (42501) and a delete touched zero rows |
| 2IC (live role, who and where) | Photos | no share rows | the database returned no photos and no shares for this resident, and an insert was refused (42501) |
| signed out | any | nothing | n/a: no public view reads `social_shares`; `check-public-views.mjs` refuses anon every method on it |

- [x] Every role above tested — the roles that can reach the feature were driven; the rest are n/a with the reason in the table
- [x] A role that should not have access is blocked server-side: the viewer's and the 2IC's direct inserts were refused by the table's policy, and the viewer's delete removed nothing

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): a topic "Marking a photo as posted on social media" under Photos, with an acceptance-matrix row set in `acceptance-matrix-entries.mjs`; `acceptance-matrix --check` passes in lint
- [x] Translatable strings go through the dictionaries: every new string is in both `en.ts` and `th.ts`; the Thai page was driven (chips, badge, lightbox list, form, buttons)
- [x] Mobile viewport (375px): driven throughout; no sideways scroll in English or Thai (scrollWidth equals clientWidth in the Thai pass); the buttons are the 44 px ActionButton and chips
- [x] Browser console clean: errors-only read returned none after the Thai pass
- [x] Network clean — every server action returned its success state; the one direct refusals were the intended 403s from the database calls above

## 6. Regression

- [x] The pages nearest the change still work: the resident's Photos tab (upload area, profile badge, Medical labels, lightbox, Remove, Move to folder), loaded as management and as the viewer role
- [x] Shared file checked from a second page: `PhotoGallery` is also used by the Adoption updates section, which now loads shares too; `typecheck` and `build` pass for it. `src/lib/manual/en.ts` passes `acceptance-matrix --check`
- [x] Nothing merged from `main` during `sync` was broken: gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with a note that part 4 stays open. Other open items searched for posted, social, social_shares, attachments and appeal: the meme library item stays open (its own app half); the appeals item that wants links to social posts is not closed by this, because an appeal's links are a separate list on the appeal
- [x] Non-obvious design choices: `docs/decisions/2026-10-18-posted-on-social-app.md`
- [x] `README.md` still accurate — it does not describe the Photos section
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`, written for staff. No manual step is outstanding: `0223` is on dev and the app half needs nothing else; the schema must reach production with the release, which the migration-consumer header already warns about
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The meme-never-posts-a-photo claim and the viewer-role claim were run against dev, and the numbers in the decision file are the ones observed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the date defaults through `todayIso()`, the shelter-time helper, and the database default is `shelter_today()`; nothing new derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the pasted gates lines are copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here; the code reads `0223`, which must be live in production before this deploys
- [ ] `--env production --dry-run` — n/a: no migration in this PR
- [ ] Fresh production backup for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR; `0223` goes first, under its own PR's plan

### Rollback

- [ ] Rollback position stated — n/a: code only; a Pi rollback to the previous ref removes the badge and buttons, and the `social_shares` rows stay, harmless

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | The permission-catalogue lint check pinned the Photos section's activities and failed once the page also asked photos.resident_manage | fixed: the pinned list now names it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The green Posted label reads clearly on a real phone in daylight, and the platform short names (FB, IG, LINE, TT) are the ones the social media person uses | A resident's Photos on Test |
| 2 | The Thai wording reads naturally to a Thai speaker | A resident's Photos in Thai |
| 3 | Lutan confirms "multimedia" meant social media (Facebook, Instagram, LINE, TikTok) | Chat |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items are left for a person, listed above

Manual verification by: pending: the three items in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: after merge, by the release manager

Result: pass

Release manager acknowledgement: n/a: given at release
