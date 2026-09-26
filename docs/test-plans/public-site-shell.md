# Feature test plan — public-site-shell

## Header

| | |
|---|---|
| Feature | Public site redesign, part 1 of 4: visual system, header/footer and navigation |
| Backlog item | `docs/backlog.md` → "Public site redesign — build the "Lanna Care for Animals" mockups" (part 1; **not ticked**, parts 2–4 remain) |
| Branch / worktree | `claude/public-site-shell` @ `C:\Development\Animal_Shelter_public-site-shell` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | to be opened from this branch |
| Tested by / date | Claude, 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `2ce0999` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the public pages get the mockups' cream/terracotta/forest visual system as `--site-*` tokens, a new header with the four-entry navigation, EN/ไทย toggle and Donate, a full-screen phone menu with a LINE/Call "Talk to us" panel, and a four-column footer with Staff login (the item's suggested part 1)
- [x] Files/areas touched listed: `src/app/globals.css` (tokens + public scope), `src/app/layout.tsx` (Fraunces, Source Sans 3), `src/app/adopt/PublicHeader.tsx`, `PublicFooter.tsx`, new `PublicNav.tsx`, `src/app/LanguageSwitcher.tsx` (a `site` tone), `src/app/login/SignOutButton.tsx` (className prop), i18n `en.ts`/`th.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/design/`, `docs/decisions.md`
- [x] Roles affected identified: signed-out public (every public page); signed-in staff and public viewer see the same pages with Open the app / Sign out in the header. App pages are untouched apart from `LanguageSwitcher` keeping its old look under the default `app` tone
- [x] Out of scope written down: homepage content (part 2, batch 3's `public-site-home`), resident page (part 3), sponsor flow and impact stats (part 4, waiting on decisions and the `/donate` item). "Sponsor a resident" links to `/donate` meanwhile; "About & contact" links to the footer (`#contact`); no About page is built

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly; second sync after the PR opened took in `0090_standard_diet_functions.sql` and docs (no overlap), merge `ecac178`, `decisions.md` merged by union
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — first at `2ce0999`, again on the second sync's merge `ecac178`:

```
=== gates: build exited 0 after 483s

gates: typecheck=0 lint=0 build=0
```

```
=== gates: build exited 0 after 147s

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

- [x] Happy path works end to end (browser pane, dev :3004): desktop nav links to /adopt, /our-work; "Get involved" opens on click, lists Foster, Volunteer, Sponsor a resident (/donate), Shelter Friends, all 44px tall; following Foster lands on /foster with Foster `aria-current` and Get involved coloured; phone menu opens full screen, About & contact closes it and lands on `#contact`
- [x] Data persists — n/a-like but checked: language choice survives reload (switched to ไทย on /our-work, page re-rendered `lang="th"`; switched back to EN)
- [ ] Create / edit / delete — n/a: the shell edits nothing; it reads `site_content` as before
- [x] Empty state renders sensibly: footer contact column and the menu's Talk to us panel render only the lines that are set (code path: each guarded on its own value; the panel is hidden with neither LINE nor phone, and LINE/Call span both columns when only one is set)
- [ ] Invalid input rejected — n/a: no input on these components besides the language toggle
- [x] Boundary cases checked: Thai labels at 1024px (the narrowest desktop layout) fit on one header row, 88px tall, no horizontal scroll (`scrollWidth` 1009 ≤ 1024); the org name wraps to two lines, accepted

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | public pages | new header + "Open the app" | not driven — left for manual verification |
| management | public pages | as admin | not driven — left for manual verification |
| staff | public pages | as admin | not driven — left for manual verification |
| vet | public pages | as admin | not driven — left for manual verification |
| volunteer | public pages | as admin | not driven — left for manual verification |
| signed out | /, /adopt, /foster, /our-work, /login | new shell, no account link in header, Staff login in footer | as expected |

- [ ] Every role above tested — n/a: access is unchanged by this PR (no route, proxy or RLS edits); only what the header shows a signed-in reader changed in markup, and it keeps #135's branches verbatim (`staff ? Open the app : Sign out`). Seeing it signed in is in the manual list
- [ ] A role that should not have access is blocked server-side — n/a: no access rules changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: the app's nav is untouched; the public nav's links were each followed or checked by href above
- [x] Manual updated (`src/lib/manual/en.ts`): Signing in now points at Staff login at the bottom of public pages; The public website says where LINE/phone show in the phone menu and that social links are under Follow us (the header Facebook icon is gone)
- [ ] Translatable strings through the translation path — n/a: new strings are UI dictionary entries (`publicNav`, `publicFooter`) written in both `en.ts` and `th.ts`, not admin-edited content
- [x] Mobile viewport (375px) — no overflow (`scrollWidth` 375), Donate 44px, every control in the open menu ≥ 44px (checked by script: none shorter), focus moves to Close, body scroll locked, Escape closes and returns focus to the menu button
- [x] Browser console clean — no errors on /, /adopt, /foster, /our-work, /login
- [x] Network clean — no unexpected 4xx/5xx from the change. Observed, not caused: on dev, `/api/photos/1NAFh8O_…` (the home hero) returns 200 with 3 MiB of zero bytes, so the hero shows its alt text; the photo proxy is untouched here

## 6. Regression

- [x] The pages nearest the change still work: /, /adopt, /foster, /our-work render with the new header and footer; /login (not a public-site page) stays on the dark app theme (`body` `rgb(14, 22, 21)`, `--primary` `#2dd4bf`)
- [x] Shared file checked from a second page by loading it: `globals.css`, the shared `LanguageSwitcher` (default `app` tone) and dev tokens checked on /login, where the tokens are unchanged
- [x] Nothing merged from `main` during `sync` was broken — the second sync brought only a migration, a script and docs; gates re-run green on it

## 7. Documentation

- [ ] Backlog item ticked — n/a: part 1 of 4; the brief says leave it unticked until the redesign is complete
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated (token names, the `:has()` scope, dev colours, contrast, fonts, Sponsor and About links, deviations)
- [x] `README.md` still accurate — nothing in it describes the public header or footer
- [x] **Release notes.** `unreleased` gained a line describing the new look, menu and footer for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Contrast ratios computed with the WCAG formula; dev colours, 375px overflow, focus handling and the /login regression read from the running page

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: none
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` restores the old header, footer and dark public pages entirely; no schema is involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Phone menu: the current page's link (e.g. Foster on /foster) wasn't highlighted — two text colours on one link, stylesheet order won | fixed (one colour class or the other); re-checked: Foster renders in the action colour |
| 2 | low | Would have made the menu's Donate text invisible on /donate (action text on action fill) — same cause | fixed (Donate rendered separately, never re-coloured) |
| 3 | low | Terracotta as normal-size text on the sand band is 4.46:1, just under AA | accepted for part 1 (the shell doesn't use it); noted in decisions.md for part 2's Shelter Friends band |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The shell looks like the mockups to the person who designed them (type, colour, spacing, header and footer) | :3004 or test.lannacare.org vs `docs/design/*.png` — Lutan, 2026-09-26: the layout still looks like the old one. Explained that page bodies (hero, stats band, cards) are parts 2–4, not this PR; still open for a look at the shell itself |
| 2 | Signed in as staff: header shows "Open the app"; as a public viewer: "Sign out" only | any public page, signed in |
| 3 | Phone menu on a real phone (iOS Safari and Android Chrome): opens, scrolls if tall, LINE opens the LINE app, Call dials | test.lannacare.org on a phone — **checked by Lutan 2026-09-26: "looks ok"** (confirmed in chat; recorded by Claude at their request) |
| 4 | Thai wording of the new labels (Get involved มีส่วนร่วม, Sponsor a resident อุปถัมภ์สัตว์ในศูนย์, About & contact เกี่ยวกับเราและติดต่อ, Talk to us คุยกับเรา) | header, menu and footer in ไทย — **checked by Lutan 2026-09-26: "wording looks fine"** (confirmed in chat; recorded by Claude at their request) |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; the list has four items for Lutan

Manual verification by: pending: items 1 (shell vs mockups) and 2 (signed-in header); items 3 and 4 checked by Lutan 2026-09-26, confirmed in chat, recorded by Claude at their request

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: after merge
