# Feature test plan

## Header

| | |
|---|---|
| Feature | The public site links to the shelter's Facebook page and Instagram, set by an admin on Settings → Website |
| Backlog item | `docs/backlog.md` → Public website → **Link to the LCA Facebook page from the public site.** |
| Branch / worktree | `claude/facebook-link` @ `C:\Development\Animal_Shelter_facebook-link` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | to be opened from this commit |
| Tested by / date | Claude, 2026-09-25 (in-app browser signed in by Lutan as admin; public pages fetched signed out) |
| Carries a migration? | no — the columns came in `0080_social_urls.sql` (#105), already on `main` and applied to dev |
| Tested at SHA | `2668f52` (code, browser-checked); gates run at `dd61c35` after merging `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — admins can set `site_content.facebook_url` / `instagram_url` on `/admin/website`, checked https-and-right-host; the footer shows an icon for each one set, and the header shows the Facebook icon on desktop only
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/admin/website/{SiteSettingsForm.tsx,actions.ts}`, `src/app/adopt/{PublicFooter,PublicHeader}.tsx`, `src/lib/site/content.ts` (two columns, `socialLinks()`), `src/lib/links/validate.ts` (Instagram hosts, `linkErrorText()`), new `src/components/InstagramIcon.tsx`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/backlog.md`. No `worker/`, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin (the form; `/admin/website` is admin-only and its guard is unchanged) and signed-out public (header and footer on every public page). Nobody else sees either surface
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — **no JSON-LD `sameAs`**: the item made it conditional on an Organization block existing, and there isn't one. **Icons are inline SVGs, not lucide** — lucide-react 1.x has no brand icons; `FacebookIcon.tsx` already existed from Shelter Friends. **The real URLs are not set** — both fields ship empty until the customer supplies them, so production shows nothing new on deploy day

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in at `dd61c35`, bringing #109 (the 0.3.0 release cut). One conflict in `src/lib/releases.ts`: main had emptied `unreleased`; resolved to hold only this branch's line. A second `sync` said `Already up to date.`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 160s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration (0080 merged as #105)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration; `--status` on dev read `83 applied, 0 pending`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; the dev row's two columns were empty before testing and are empty again after
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR, but this code selects `facebook_url` / `instagram_url` on every public page, so **0080 must be on production before this deploys** (see §8)

## 4. Functional checks

Driven in the in-app browser against `next dev` on :3012 (dev database), signed in as admin; public pages fetched with `curl` carrying no session cookie, i.e. signed out.

- [x] Happy path works end to end — typed `m.facebook.com/lannacare.test` and saved (`บันทึกแล้ว` / Saved); signed-out `/adopt` then had the header link and footer icon pointing at `https://m.facebook.com/lannacare.test` (bare link stored with its `https://`)
- [x] Data persists — reload the page and the change is still there — fresh loads of `/admin/website` and the public pages showed the saved values
- [x] Create / edit / delete all exercised (whichever the feature has) — set Facebook; added Instagram; cleared Facebook; cleared Instagram. Each save went through and the public pages followed
- [x] Empty state renders sensibly (no rows yet) — checked first, as the brief asked: with both fields empty, `/`, `/adopt`, `/donate` and `/friends` have no `facebook.com` / `instagram.com` link, and the footer text is as before. Re-checked after clearing both at the end
- [x] Invalid input is rejected with a readable message, not a crash — typed in the Facebook field: `not a link` → "That doesn't look like a web address."; `http://www.facebook.com/lannacare` → "Use a secure link that starts with https://"; `https://www.instagram.com/lannacare` → "Use a link on facebook.com / fb.com." Save is disabled while one shows. Server side: with the button force-enabled and the wrong-host value submitted, the action refused it ("เพจ Facebook: กรุณาใช้ลิงก์ของ facebook.com / fb.com" — Thai because the pane's locale cookie had been switched to `th`) and the typed value stayed in the box
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — each field alone and both together: Facebook only → header + footer Facebook, no Instagram; Instagram only → footer Instagram, no header link; both → all three. A bare host with no scheme is accepted and stored with `https://`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/website` | the two new fields, validated | **pass** — as in §4 |
| management | not `/admin/website` | refused by `requireAdminUser` (unchanged) | not signed in as; the page guard and `assertAdminRole()` in the action are untouched by this diff |
| staff | not `/admin/website` | as management | not signed in as; same reason |
| vet | not `/admin/website` | as management | not signed in as; same reason |
| volunteer | not `/admin/website` | as management | not signed in as; same reason |
| signed out | public header and footer | icons for whichever links are set; header icon hidden below `sm` | **pass** — `curl` with no session, en and th |

- [ ] Every role above tested — n/a: only admin and signed out see anything this PR changes; the other roles' access to `/admin/website` is governed by guards this diff does not touch, and each needs its own password, which this session does not handle
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the save action still starts with `assertAdminRole()`, and the new validation runs server-side too: a forced submit of a wrong-host link was refused by the action, not only by the form

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change; the fields sit on the existing Website page
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — a "Facebook page and Instagram" step in *The public website* topic, found on `/manual`
- [x] Translatable strings go through the translation path, checked at `/management/translations` — these are dictionary strings, not database content, so nothing goes through `/management/translations`; every new key is in `en.ts` and `th.ts` (the `Dictionary` type forces it). Seen rendered in Thai (form labels and hints on `/admin/website`, `aria-label` "Lanna Care for Animals บน Facebook" on the public pages) and in English
- [x] Mobile viewport (375px) — no overflow, controls reachable — `/adopt` at 375×812 with both links set: `scrollWidth` 375, the header Facebook link hidden (zero width), both footer icons visible
- [x] Browser console clean — no errors or React warnings — the only errors were 404s for `/manual/*.png` screenshots such as `admin-blood-test-types.png`, which predate this branch (the screenshot rerun is deferred)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `/admin/website`, `/`, `/adopt`, `/foster`, `/donate`, `/friends` all 200; the form's POSTs succeeded

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/admin/website` (every other section renders; the contact details are sent with every save above and still save), `/`, `/adopt`, `/foster`, `/donate`, `/friends` — headers and footers unchanged apart from the icons
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `validate.ts` is shared with Shelter Friends: loaded `/management/shelter-friends` and a friend's contact page (`/contacts/83f365f2-…`), both render with the Shelter Friend card. `manual/en.ts`: `/manual` loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought only the 0.3.0 release cut; the build after it passed

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked with a Done note naming the SVG icons and the absent JSON-LD
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: nothing new was decided; the two departures from the item (no lucide brand icons, no JSON-LD) are recorded in the backlog note, the commit and the PR, and the looser database check was recorded 2026-09-24
- [x] `README.md` still accurate — it does not list the site settings fields
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — lucide's missing brand icons checked in `node_modules/lucide-react` 1.47.0; the absent JSON-LD per the brief's 2026-09-24 check; host and scheme handling observed in the form

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted evidence is the gates output, copied as printed; the rest is prose describing what was driven
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager (every public page's header and footer changed)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here, but the code reads 0080's columns on every public page, so 0080 must be on production before this deploys; the release manager should confirm with `--env production --status`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR; 0080 (additive, nullable) must precede the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` removes the fields and icons. No schema changed here; 0080's columns stay and are harmless to the older code

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The icons look right beside their neighbours — the footer row under LINE, and the header icon between Donate and the language switcher — in light and dark theme at desktop width. Set a test link first and clear it after | `http://localhost:3012/admin/website`, then `/adopt` |
| 2 | Paste a link from the Facebook app's own Share button on a phone and check it is accepted | `/admin/website` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5), in the in-app browser signed in by Lutan  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1 and 2 are Lutan's

Manual verification by: pending: items 1–2 under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —
