# Feature test plan

## Header

| | |
|---|---|
| Feature | `home-screens`: `/home`, the landing that follows the device; a tile home per role built from the route registry; Admin's switch between homes. F2's last piece: **F2 is now complete** |
| Backlog item | `docs/backlog.md` → Auth → the roles item. **Not ticked**, per the brief; a status line says F2 is complete |
| Branch / worktree | `claude/home-screens` @ `C:\Development\Animal_Shelter_home-screens` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | see the PR's head; gates were run at `claude/home-screens` after the sync below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: a sign-in lands on `/home`, which draws each role's tiles from `routesFor()` and, for Admin, goes to the Management home on a phone and Settings on anything larger, with a server-refused switch between homes
- [x] Files/areas touched listed: new `src/app/home/` (`page.tsx`, `[role]/page.tsx`), `src/lib/home/` (`device.ts`, `tiles.ts`, `roles.ts`), `src/components/{HomeTiles,HomeSwitch}.tsx`; `src/lib/permissions/routes.ts` (a `scope` field, `/appointments` registered); `src/lib/auth/next-path.ts` (`DEFAULT_SIGNED_IN_PATH`); `src/app/admin/page.tsx` (the switch); `src/app/NavLinks.tsx` (a Home link); `hub-icons.ts` (`NAV_ICONS.home`); both dictionaries (`appHome`, `nav.home`); `scripts/check-home-screens.mjs` and `-live.mjs`; no migration, no policy
- [x] Roles affected identified: every signed-in role, because the landing changed. Admin's changes most (device rule, switch). A vet still lands on Appointments
- [x] Anything explicitly **out of scope** written down: the Director's curated daytime screen (`management-phone-home`, `recurring-jobs-phone`), the volunteer's Residents and Enclosures home (`volunteer-schema`, R1), a sidebar built from the registry, and the 2IC, Maintenance and Medical roles, which do not exist yet

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; already up to date, no conflicts
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines pasted below, as printed:

  ```
  === gates: build exited 0 after 203s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR (`volunteer-schema` holds `0134`)
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration; the pages read `roles` and `role_permissions` as Admin, which RLS already allows
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-home-screens-live.mjs` against dev and the running dev server, five throwaway logins (admin, management, staff, volunteer, vet), ends `All expectations held.` with 37 `ok` lines. A phone lands Admin on `/home/management`; an iPad and a Windows PC land on `/admin`; each role's `/home` has the tiles its cells give it and none of another role's pages
- [x] `node scripts/check-home-screens.mjs` (in `npm run lint`) ends `all ok`: the device rule on ten user-agent and hint cases (iPhone, Android phone, iPad, Android tablet, Windows, "desktop site" on a phone, hint beating user-agent both ways, no headers); every tile is a registered page, My tasks or Residents; none has a record id; none twice; none refused to its role; a vet's appointments are offered to the vet and not to staff or Management
- [ ] Data persists — n/a: nothing is written by this change
- [ ] Create / edit / delete — n/a: nothing is written by this change
- [x] Empty state renders sensibly: a role with no tiles gets "Nothing here yet" and a sentence, not a 404 (checked in `check-home-screens.mjs`: a role holding nothing has only Residents, one that does not open the app has none, one holding only a Settings activity gets its Settings pages)
- [x] Invalid input is rejected with a readable message, not a crash: `/home/no_such_role` and `/home/public_viewer` are 404 (the live harness reads the streamed 404); `/home/admin` goes to `/admin`
- [x] Boundary cases checked: a tablet (iPad announces itself as a Mac, an Android tablet drops "Mobile") is a desk by rule; a phone told to request the desktop site is a desk; a missing header is a desk. Two pages sharing one word (Contacts, Vets, Enclosures) are one tile, and the live run caught a volunteer's Enclosures tile opening the map prototype, now fixed and pinned in the check

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/home` (phone → `/home/management`, tablet or desk → `/admin`), `/home/<role>` for management, staff, vet, volunteer, the switch on Settings | opens all of them; `/home/admin` → `/admin`; an unknown or archived role or the public viewer is a 404 | as expected; and driven in the Browser pane at 375 px (Management home, switch, 19 tiles) and at desktop width (`/home` → `/admin` with the switch) |
| management | `/home`, `/home/management`, `/home/staff`, `/home/<own key>` | own home with tiles and no switch; the three `/home/*` addresses refused | `/home` 200 with tiles, no Settings page; the three refused → `/no-access` |
| staff | `/home`, the same three addresses | own home with Stocktake and Maintenance, none of Management's pages; the three refused | as expected |
| vet | `/home`, the same three addresses | lands on `/appointments`; the three refused | as expected |
| volunteer | `/home`, the same three addresses | own home with Residents and Enclosures, none of Management's pages; the three refused | as expected |
| signed out | `/home` | sent to `/login?next=%2Fhome` | as expected |

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the live harness opens `/home/management`, `/home/staff` and the role's own key as each of management, staff, vet and volunteer with their own session cookies, and every one is refused to `/no-access` with no tile in the body; none is shown the switch on `/admin`

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`): Home leads the first group for every role with app access and lights up on `/home` and below; loaded as Admin at desktop width (sidebar shows Home active before the redirect to `/admin`)
- [ ] Manual updated — n/a: the home screen is tiles with a word each and the switch says what it is; the Director's own daytime screen is where a manual topic belongs, and that is `management-phone-home`'s
- [x] Translatable strings go through the translation path: `appHome` and `nav.home` are in both dictionaries, so they are editable at `/management/translations`
- [x] Mobile viewport (375px) — no overflow, controls reachable: Management home as Admin in the Browser pane's mobile preset (Android user-agent, so the device rule itself landed it), `scrollWidth` 375 of 375 and no element past the right edge, in English **and in Thai** (cookie `locale=th`); two tiles across, switch pills wrap onto a second line at 44 px tall
- [x] Browser console clean — no errors or React warnings: the Browser pane's console was read on `/home/management` and `/admin` and held no errors
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: the live harness's responses are 200, or the 307 it expects; the dev server's log shows nothing but the intended redirects

## 6. Regression

- [x] The pages nearest the change still work: `/admin` (Settings grid, now with the switch), `/management`, `/my` (reached from its tile), `/appointments` (now a registered page; a vet still opens it and staff are still refused)
- [x] Any shared file touched checked from a second, unrelated page: `NavLinks.tsx` loaded on `/admin` and `/home/management`; `routes.ts` (the `scope` field) exercised by `node scripts/check-permission-catalogue.mjs` (`all ok`, including `/appointments` guarding with `requirePermission("medical.visits", "read")`); `hub-icons.ts` gained one key and `npm run typecheck` is 0
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing merged, already up to date
- [x] `node scripts/check-permission-parity.mjs`: layers' answers match everywhere this PR could have moved them. **It reports RESULT: RED, and not because of this PR:** all 62 mismatches are the **volunteer** column, and dev already carries `0134_volunteer_narrowing.sql` from `volunteer-schema` (`apply-migrations.mjs --status`: "Applied here, no file on origin/main: 0134"), which narrowed the database below the seeded cells until their PR moves the seed. This PR changes no policy and no cell

## 7. Documentation

- [ ] Backlog item ticked — n/a: the brief says not to tick the roles item; a status line was added instead, naming this branch and saying F2 is complete
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-04-home-screens.md` records the device rule (and why not a breakpoint or a stored choice), the tablet case, what the switch does, and the dedupe and ordering rules
- [x] `README.md` still accurate: it names no landing page or role list that changed
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has two lines: one for everyone (the Home screen, the first menu link, a vet unchanged), one tagged `admin` for the Director's phone-versus-desk landing and the switch
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The device rule's cases are asserted by `check-home-screens.mjs`; the refusal claim by the live harness against dev; the Thai and 375 px claims by reading `scrollWidth` in the Browser pane. The claim that no browser says "tablet" is reasoned from the user-agents of an iPad and an Android tablet, which the check includes, and not measured on a real tablet (see Left for manual verification)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: the device rule has no threshold; its cases (phone, tablet, desk, both hint values, no header) are all asserted
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates lines above are pasted as printed and nothing else is tabulated by hand
- [ ] Public pages re-checked after a cache purge — n/a: `/home` is signed-in only and the public pages are untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added. **One thing for the deploy to know:** the device rule reads the `Sec-CH-UA-Mobile` and `User-Agent` request headers, so it needs the Pi's proxy to pass them through, which it does by default

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: no schema. Rolling back is `./scripts/pi/deploy-pi.sh --ref <sha>` and returns the landing to `/my`; nothing it did needs undoing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | A volunteer's Enclosures tile opened `/enclosures/map-prototype`, because two pages with one word were deduped by level and the prototype's yes/no cell outranked the Read page. Found by the live harness | fixed: same activity → the higher level, different activities → the menu's page; pinned in `check-home-screens.mjs` |
| 2 | Low | The Management home is **19 tiles**, where the whiteboard drew five. It is every page Management can open, in the hand-chosen order | accepted: the Director's curated screen is `management-phone-home`'s; noted in the decision file and the backlog status |
| 3 | Low | Role names in the switch and the heading are English in Thai (`roles.name_th` is null for every default role), so the Thai sentence mixes "บทบาท Management" | deferred to backlog: Thai names for the default roles are a data row each, no code |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as the Director on her own phone and on her own larger screen, and confirm each lands where §8 says (Management home, Settings) | her phone and desk |
| 2 | Whether Settings is the right landing on a tablet, if anyone signs in from one | any tablet |
| 3 | The Thai sentence under the home heading and the switch label read naturally to a Thai reader | `/home` and `/home/management` with the Thai language chosen |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; the Director's phone and desk, a tablet and a Thai reader are for whoever looks to tick

Manual verification by: pending: the Director's phone and desk landing, a tablet if there is one, and a Thai reader on the wording above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened; the file is the record
- [ ] Handed to the production release manager — n/a: handed over at release time, not at PR time

Result: pass with accepted defects

Release manager acknowledgement: n/a: not at PR time
