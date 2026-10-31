# Feature test plan

## Header

| | |
|---|---|
| Feature | Settings → Website → Pages, tidied: a card per page, a full edit page, the photo on it |
| Backlog item | `docs/backlog.md` → **SETTINGS → WEBSITE → PAGES, TIDIED** (under `## Public website`) |
| Branch / worktree | `claude/website-pages-tidy` @ `C:\Development\Animal_Shelter_website-pages-tidy` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened from this branch |
| Tested by / date | Claude (automated and browser-driven) / 2026-10-31 |
| Carries a migration? | no |
| Tested at SHA | `a63c2223` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — Settings → Website → Pages becomes one card per public page carrying its Show / Hide switch and Edit, and Edit opens that page's own edit page in the standard admin frame with its photo on it.
- [x] Files/areas touched listed — added `src/app/admin/website/pages/[slug]/page.tsx` and `PageEditPanel.tsx`, `src/app/admin/website/PageCards.tsx`, `preview-context.ts`, `page-controls-follow-cards.test.mjs`; `PagePhotos.tsx` renamed to `PagePhotoCard.tsx`; deleted `PageVisibility.tsx` and `PagesAccordion.tsx`; edited `page.tsx`, `actions.ts`, `SitePageForm.tsx`, `src/lib/public-pages.ts`, `src/lib/site/pages.ts`, both i18n dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/check-permission-catalogue.mjs`, `scripts/lib/acceptance-matrix-entries.mjs`. No `worker/`, no `supabase/migrations/`.
- [x] Roles affected identified — analysis is by card, not role: the screen is opened by `website.content` at read, and every control asks `website.content` at edit. The `website_photos` card holds `website.content` at read only and keeps today's Gallery-only view. The translation panels ask `translations.manage`. Admin is unchanged through the `perms.isAdmin` short-circuit. Signed-out and any login without `website.content` at read never reach the page.
- [x] Anything explicitly **out of scope** written down — the public pages themselves are not redesigned; the Gallery tab is untouched beyond still working; the poodle-drawings item (the empty photo slot's wording) is deliberately NOT done, and is still open.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in `0293`/`0294` and the `translations-labels-schema` docs; no conflict, and `src/lib/releases.ts` needed no resolution because that stream added no note)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 12s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 109s
=== gates: test — npm test
=== gates: test exited 0 after 15s
=== gates: build — npm run build
=== gates: build exited 0 after 82s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

Driven in the built-in browser pane on `http://localhost:3008`, signed in with
`scripts/dev-signin.mjs`, reaching every page by clicking through so the pane hydrates.

- [x] Happy path works end to end — the Pages tab lists all 14 public pages as cards; Edit on Donate opens `/admin/website/pages/donate` with the heading, text, translation panels, preview and "Photo for this page"; Back to Pages returns.
- [x] Data persists — a photo uploaded on the Donate edit page survived the page re-render and appeared on `/donate`; hiding Desexing persisted across a re-read of the tab.
- [x] Create / edit / delete all exercised — photo uploaded (Choose photo), description form appeared, photo removed (Remove → Confirm) and `/donate` no longer served it. Dev was left exactly as found: Donate has no photo again and Desexing is shown again.
- [x] Empty state renders sensibly — a page with no photo shows "No photo set"; a page that takes no photo (International adoption) shows no photo section at all.
- [x] Invalid input is rejected with a readable message, not a crash — an unknown slug returns the framework's Not found (`isSitePageSlug` then `notFound()`); the actions still validate the slug and the photo page independently of the UI.
- [x] Boundary cases checked — the two lists that do not match: 14 public pages against 8 editors, with Our story on Home and How adoption works on Adopt both reached from their own page's card; Home and Privacy always on with no switch, Home still carrying Edit; Appeals, Shelter Friends, Shop, Desexing and Our work carrying only a switch.

### Role access matrix

Recorded by card, since roles are a transient grouping. The two logins driven were made with
`scripts/dev-signin.mjs`.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| `admin` (Admin, outside the card system) | the tab and every edit page | everything | pass — all cards show Edit and a switch; the edit page shows Save changes, Choose photo and the translation panels |
| only the `website_photos` card (`website.content` at read, `website.gallery`) | `/admin/website`, and `/admin/website/pages/<slug>` by address | today's Gallery-only view; no Edit, no switch, no photo control | pass — the only tab is Gallery (hero photo and photo gallery); on the edit page's address, no Save changes, no Choose photo, no file input, no Edit translation |
| no `website.content` at read | nothing | refused | pass by construction — `requirePermission("website.content", "read")` guards both pages, unchanged from before |

- [x] Every login above tested — both driven in the browser; the third is the unchanged existing guard.
- [x] A login that should not have access is blocked server-side — the edit page's address was hit directly as the one-card login and served nothing it may not use; the actions' own `can(... "website.content")` checks and the database policies are untouched. `can()` defaults to the **edit** level, so the bare call the actions make is the edit check, which is why a read-only holder is refused.

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry changes; the new page is a child of `/admin/website`, reached from its cards, and is registered in `PINNED` in `scripts/check-permission-catalogue.mjs`
- [x] Manual updated (`src/lib/manual/en.ts`) — the Website topic's Pages step is now the cards plus a step of its own for the edit page, the Page photos step says the photo is on the edit page, the hiding topic's first step describes cards, and the translations and Shop topics no longer say "popup" or "beside". No "popup" remains in the manual. `src/lib/manual/` is English only — there is no Thai manual file.
- [x] Translatable strings go through the translation path — every new string is a key in `admin.website.*` in both `en.ts` and `th.ts`; the screen and the edit page were read end to end in Thai (`แก้ไข อาสาสมัคร`, `กลับไปหน้าเว็บ`, `รูปของหน้านี้`, the card list's headings and the Thai-formatted last-edited date). `scripts/check-thai-dictionary.mjs` still reports the same 15 strings in the same 3 files, none of them mine.
- [x] Mobile viewport (375px) — no overflow, controls reachable: driven at 375×812. `document.documentElement.scrollWidth` is 375 against `innerWidth` 375 on both the Pages tab and the Donate edit page, so neither overflows. Each card wraps to three rows — name and address, then the state pill with View on site, Hide and Edit, then the note — and every button keeps its 44 px height. The only elements extending past 375 are the six Website tab buttons, which are the pre-existing horizontally-scrollable tab strip (`whitespace-nowrap`) and not part of this change.
- [x] Browser console clean — no errors or React warnings seen while driving the tab, the edit page, the switches and the photo upload and removal.
- [x] Network clean — no unexpected 4xx/5xx; the two public fetches used as evidence (`/` and `/donate`) returned 200.

## 6. Regression

- [x] The pages nearest the change still work — the other five Website tabs (Home page, Contact & settings, Donate, Gallery, Projects) all render; the public home page and `/donate` were fetched before and after the hide/show and photo checks.
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/public-pages.ts` gained `editor`, and it feeds the public header, footer, home page and sitemap: the public home page was loaded and its link set read before, during and after hiding Desexing, and it dropped and regained the link correctly. `src/lib/site/pages.ts` gained `PAGE_PHOTO_SLUGS`, read by `actions.ts` and the edit page, both exercised. `src/lib/releases.ts` was loaded by the build.
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought migrations and docs from `translations-labels-schema` only; gates were re-run after it and all four exited 0.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — with what landed, and saying the poodle-drawings item is still open and names the renamed file.
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-31-website-pages-tidied.md`: why the card list is driven by `PUBLIC_PAGES`, why the leave guard is a pair and uses `window.confirm`, what it does not cover (the browser's Back button), the old-link redirect, and the full control inventory.
- [x] `README.md` still accurate — it does not describe this screen; checked, nothing to change.
- [x] **Release notes.** A shelter user would notice this, and `unreleased` in `src/lib/releases.ts` gained a line in this PR, tagged `cards: ["website"]` because it is about a Settings page only some cards open. No manual step is outstanding before a user sees it — there is no migration and no deploy-time step beyond the ordinary release. The existing rich-text note that said "the page's popup" was corrected in the same file, since this PR makes that wording wrong before it ever ships.
- [x] Commit messages say why, not just what — each says what the screen did before and what it does now.
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The permission claim is the one that mattered and it was read, not assumed: `can()` in `src/lib/permissions/can.ts` defaults `level` to `"edit"`, so the bare `can(perms, "website.content")` the actions make is an edit check — that is why a `website_photos` login opens the page and is offered nothing, which was then confirmed in the rendered DOM rather than inferred. An earlier string-match against the fetched HTML suggested a Save button was present; that was a false positive from the serialized flight payload and was discarded in favour of the DOM.

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `a63c2223`
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing in this change derives a date or an instant; the only date shown is the page's `updated_at`, formatted in the reader's locale exactly as it was before
- [ ] Boundary or banding change covers both edges — n/a: no threshold, band, rounding rule, retry window or pagination limit in this change
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted tool output is the `gates:` block, which is verbatim
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: this change adds no secret or environment variable

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Production backup fresh — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, including what it does not cover — code only, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, with `npx wrangler rollback --env production` reverting only the Worker fallback. There is no migration, so nothing here needs a down-migration and nothing is left behind by a rollback. The one thing a rollback does not restore is a saved `#<slug>` link's behaviour: on the rolled-back build it opens the popup again, which is where it used to go, so nothing breaks.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | On the edit page, a login holding `website.content` at read only still gets an editable text box and the style toolbar, with no Save button. They trigger no server action, so they are not action controls, and such a login cannot reach the page from the UI. | accepted — recorded as *found, not fixed* in the decision file with the file and the activity it should ask |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the wording reads well to the Director — in particular the Pages tab's new subtitle, which now explains why some pages have no Edit button. | Settings → Website → Pages |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 is a judgement about wording and waits for the Director

Manual verification by: pending: whether the new Pages subtitle reads well to the Director

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not a release; this is a feature PR

Result: pass
