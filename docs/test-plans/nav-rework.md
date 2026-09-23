# Feature test plan

Filled from `docs/test-plan-template.md`; see it for how each line is judged.

---

## Header

| | |
|---|---|
| Feature | Nav rework: Admin shown as Settings, chevrons dropped, links reordered and grouped, an icon on every link |
| Backlog item | `docs/backlog.md` → Quick wins: "Nav rework: rename Admin to Settings, drop the chevrons, reorder, add icons"; closes "The pinned nav footer group hides the last Admin links…" and Documentation: "Fix UI hints that still say Admin → Contacts / Admin → Vets" |
| Branch / worktree | `claude/nav-rework` @ `C:\Development\Animal_Shelter_nav-rework` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | linked from the PR itself |
| Tested by / date | Claude (nav-rework session), with Lutan signing in as each role, 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | browser checks at `bbca3a2`; gates re-run at `c4d3d67` after syncing `main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the sidebar is a flat, grouped list (field work, reference, assistant, Management / Settings, pinned footer) with one icon per link, and the Admin menu reads Settings everywhere a person reads it
- [x] Files/areas touched listed: `src/app/NavLinks.tsx` (rewritten), `src/components/hub-icons.ts` (`NAV_ICONS`), `src/app/admin/page.tsx` (comment, Security tile icon), `src/lib/i18n/dictionaries/en.ts` + `th.ts` (`nav.admin` → `nav.settings`, landing heading, "Admin →" menu paths), `src/lib/manual/en.ts`, `README.md` roles row, `docs/backlog.md`, `docs/decisions.md`. None of PR #59's 27 files
- [x] Roles affected identified: admin (Settings, Management, Security), management (Management), staff / vet / volunteer (reordered list and icons only), signed-out public (none — the sidebar is signed-in only)
- [x] Out of scope written down: the `/admin` URLs and the `admin` role are not renamed (label-only, agreed with Lutan); no collapsed icon-only sidebar; manual screenshots are left for the planned full re-run

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (exit 0, merge `c4d3d67`, pushed)
- [x] `npm run typecheck` — clean (exit 0)
- [x] `npm run lint` — clean (exit 0)
- [x] `npm run build` — succeeds (exit 0)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: as admin at 1280×800 the sidebar reads Residents, Enclosures, Maintenance | Vets, Contacts, Projects | Assistant | Management, Settings, then User manual, Release notes, Change password, Security, each with an icon (read from the DOM: every link has an `svg`); Settings opens `/admin`, headed "Settings", tiles unchanged
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved; the old `nav-expanded` sessionStorage state is removed, not replaced
- [ ] Create / edit / delete all exercised — n/a: navigation only, no records
- [ ] Empty state renders sensibly — n/a: the list is static per role; the smallest (volunteer) case is covered below
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked: window height. At 900×640 as admin the pinned footer covered Settings (defect 1) — fixed; after the fix at 640 the footer is `static` and starts at 482px, below Settings at 470px; at 800 it is `sticky` at 635–784 with Settings at 470. As volunteer at 900×560 it is `static`, starting at 389px below Assistant at 377px. Active link: `/admin/zones` → Settings only, `/admin/security` → Security only, `/management/vets` → Management only, `/residents` → Residents

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Every link incl. Management, Settings, Security | All shown, Settings → `/admin` | as expected (desktop and phone drawer) |
| staff | Main groups + 3-link footer | No Management / Settings / Security | n/a: same code path as volunteer (`isAdmin` and `canManage` both false); not signed in separately |
| vet | Main groups + 3-link footer | as staff | n/a: same code path as volunteer |
| volunteer | Main groups + 3-link footer | No Management / Settings / Security; `/admin`, `/management` refused | as expected: nav shows 7 + 3 links; both URLs redirect to `/` |
| resident | — | no such sign-in role | n/a: not a role in this app |
| signed out | — | sidebar not rendered | n/a: unchanged by this branch; `/residents` redirects to `/login` as before |

- [x] Every role above tested — admin and volunteer signed in; the others share one of those two code paths (`isAdmin` / `canManage` flags) and are marked n/a with that reason
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): as volunteer, `/admin` and `/management` both land on `/`

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links: every href is an existing route (`/residents`, `/enclosures`, `/maintenance`, `/vets`, `/contacts`, `/projects`, `/assistant`, `/management`, `/admin`, `/manual`, `/releases`, `/account/password`, `/admin/security`)
- [x] Manual updated (`src/lib/manual/en.ts`): navigation topic rewritten for the flat list; section title and every "Admin → X" path now "Settings → X"
- [ ] Translatable strings go through the translation path — n/a: UI dictionary strings (`th.ts`), not public prose; `/management/translations` holds only public text
- [x] Mobile viewport (375px) — drawer shows the same groups with dividers and the footer below a rule, for admin and volunteer; tapping Settings navigated to `/admin` and closed the drawer
- [x] Browser console clean — the only error is E394 "unexpected response" from the first sign-in, when `/residents` took 11s on its first compile; it did not recur on any later navigation
- [ ] Network clean — n/a: no new requests; navigation is plain `<Link>`s

## 6. Regression

- [x] The pages nearest the change still work: `/residents`, `/admin`, `/admin/zones`, `/admin/security`, `/management/vets`
- [x] Shared file touched checked from a second, unrelated page: the dictionaries were checked in Thai — sidebar labels and the `/admin` heading (การตั้งค่า) render; language switched back to English
- [x] Nothing merged from `main` during `sync` was broken by this branch: typecheck, lint and build re-run after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — plus the two items it closes, each saying so
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: label-only rename, what still says "admin", the height rule for the pinned footer
- [x] `README.md` still accurate: roles table row now names the Settings section
- [x] Commit messages say why, not just what
- [x] Claims measured, not reasoned: the first backlog note ("fits any window") was reasoned and wrong; it was replaced with the measured ~690px and the 640 / 800 / 560 positions above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: not yet — set by the release manager at deploy
- [ ] Deployed SHA matches the tested SHA — n/a: not yet deployed

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: not yet — release manager's step after merge
- [ ] Smoke-tested on `test.lannacare.org` — n/a: not yet deployed
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic touched
- [ ] Public pages re-checked after a cache purge — n/a: public pages untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: not yet — release manager's step
- [ ] `strip-baked-env` seen in the deploy output — n/a: not yet — release manager's step
- [ ] Any new secret/env var exists in production — n/a: no new secrets or env vars

### Migration ordering — *skip if no migration*

- [ ] Migration and code together? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup for destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` restores the previous nav fully; nothing is stored or migrated

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | Pinned footer still covered Settings on a window under ~690px tall (admin), because the flat list plus the group is taller than a 768px laptop's page area | fixed in `1cb8a8b`: pinned only at `min-height: 44rem`, otherwise follows the list |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The icons chosen where no tile existed — briefcase (Management), cog (Settings), open book (User manual), newspaper (Release notes), key (Change password) — read right to you, and the dividers look right | Sidebar on any signed-in page, desktop and phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (nav-rework session)  Date: 2026-09-23

### Manual verification

- [ ] Every item in the manual list was checked by a person, or the list is empty

Manual verification by: pending: Lutan to look at the icon choices and dividers (item 1)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after manual verification

Result: pass

Release manager acknowledgement: n/a (not yet handed over)  Date: 2026-09-23
