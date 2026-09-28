# Feature test plan — release notes by role

## Header

| | |
|---|---|
| Feature | Release notes segmented by role: `/releases` opens on the reader's role |
| Backlog item | `docs/backlog.md` → Release notes segmented by role |
| Branch / worktree | `claude/release-notes-by-role` @ `C:\Development\Animal_Shelter_release-notes-by-role` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | #195 |
| Tested by / date | Claude, 2026-09-28 |
| Carries a migration? | no |
| Tested at SHA | `24bd859` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `/releases` lists the notes that are untagged (everyone) or tagged with the reader's role, keeps every release row with its version number (a release with nothing for the reader shows a "Nothing for Vet" badge and says its changes are for other roles, linking to `?view=all#v<version>`), and Show everything (`?view=all`) lists every note, greying the ones outside the role. The item's version-gap warning is answered by the first of its two options, reasoned in `docs/decisions.md`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/releases/page.tsx`; `src/lib/releases.ts` (`ReleaseNote`, `ReleaseRole`, `noteText`, `noteRoles`; three pending lines tagged; one new line); `src/lib/release-mail.ts` (reads a tagged note's text); `scripts/check-test-plan.mjs` (drops `roles: [...]` before reading `unreleased`); `src/lib/manual/en.ts` (release-notes topic); docs. Reuses `isForRole` / `asManualRole` from `src/lib/manual/filter.ts` unchanged. No `worker/` or migration change; the Worker bundles `releases.ts` for `latestRelease` only
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — every signed-in role gets the filter; today only the three tagged pending lines differ by role (a vet loses two, admin none). Released history 0.0.1–0.8.0 is untagged, so it reads the same for every role. Signed out: unchanged, the proxy sends them to sign in
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — back-filling role tags onto released entries (left untagged on purpose, offered as a follow-up in the PR); per-role release mail (the mail stays admin-only and unfiltered, decisions.md); `hidden="until-found"` as on the manual (not needed here, decisions.md)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — "Already up to date" at `24bd859`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. Run at `24bd859`:

```
=== gates: build exited 0 after 376s
gates: typecheck=0 lint=0 build=0
```

  After syncing `utc-visit-date` (#194) (a `releases.ts` conflict, both `unreleased` lines kept, `8545111`), a run printed `gates: typecheck=0 lint=0 build=1`. Its build output was not kept; next dev had been running in this folder against the same `.next` and was stopped by the app during that run. CI's build passed at the same SHA. After the next sync (#196, clean) the run was repeated with the dev server stopped, at `c55cb9e`:

```
=== gates: typecheck exited 0 after 40s
=== gates: lint exited 0 after 60s
=== gates: build exited 0 after 117s
gates: typecheck=0 lint=0 build=0
```
- [x] CI green on the PR (runs the same three) — #195 at `fca16d4`: check, migration-numbers and test-plan all pass (run 36371005475)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; release notes are source data, not rows
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

All in the built-in browser against `next dev` on :3012 and the dev database, signed in as a throwaway login made for this (`release-role-test-…@example.test`, created with the service role on dev, credentials kept outside the repo) rather than flipping the shared dev test user. Its `user_roles.role` was switched vet → admin → vet between page loads; it is left on dev as vet (disposable data). Counts are read from the DOM with `javascript_tool`.

- [x] Happy path works end to end — as a **vet**, `/releases` says "Showing the changes for the Vet role, and the ones for everyone. Show everything" with the line "Every release stays in the list, so the numbers run in order; one with nothing for your role says so." Not released yet lists 6 of 8 lines: the International adoption page and Clear-a-date lines (tagged for the four shelter roles) are gone; the clinic-per-vet-account line (admin, vet) and the five untagged lines show. All 12 release rows 0.8.0 → 0.0.1 are present with their full note counts (9, 6, 7, 9, 6, 5, 4, 1, 3, 7, 3, 2), since released history is untagged
- [x] Data persists — reload the page and the change is still there — n/a in the data sense: nothing is written; the filter is recomputed per request from the role and `?view`, and reloading `/releases` and `/releases?view=all` gave the same counts each time
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a read-only page; notes are edited in source
- [x] Empty state renders sensibly (no rows yet) — no real release is empty for any role yet, so 0.2.2's single note was tagged `["admin"]` **locally and uncommitted** (reverted from a backup copy afterwards; `git diff` confirmed): as a vet the 0.2.2 row stayed between 0.3.0 and 0.2.1 with its number, a "Nothing for Vet" badge beside the environment and, opened, "Nothing in this release changes what the Vet role does — its one change is for other roles. Show everything" linking to `/releases?view=all#v0.2.2`. Clicking it landed on 0.2.2 open, its note greyed (`opacity-60`) with "Not for the Vet role". With nothing pending for a role, the Not released yet box is omitted by the same `pending.length > 0` test
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; an unknown `?view=` value reads as the filtered view
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — admin, whose tags cover every tagged line: all 8 pending lines, no release marked Nothing for, and with the temporary tag 0.2.2's admin-only note shown. `#v0.2.2` loaded cold opened and scrolled to that row (`OpenReleaseFromHash`, once dev hydration finished). Show everything as a vet: 8 pending lines, exactly the two tagged-away lines greyed and labelled

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, filtered | every line (admin is in every tag so far) | 8 pending, 12 full releases, bar says Admin role |
| management | `/releases`, filtered | same filter from the same tags; loses only the clinic-per-vet line | not driven — no branch of its own, only tags |
| staff | `/releases`, filtered | as management | not driven — as above |
| vet | `/releases`, filtered and `?view=all` | 6 of 8 pending; every release row; greyed rest under Show everything | as expected, see happy path |
| volunteer | `/releases`, filtered | as management | not driven — as above |
| signed out | `/releases` | sent to sign in (proxy, unchanged) | not changed by this PR |

- [x] Every role above tested — admin and vet driven; management, staff and volunteer go through the same `isForRole` call with no branch of their own, so only their tags differ, and those were read against the three tagged lines
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: every signed-in role may read every note; the filter is presentation, and Show everything is deliberately one click away

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change; Release notes was in the vet's menu as before
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the release-notes topic's intro says it opens on your role, and a new step describes the filter, the Nothing for Vet badge and Show everything; read in the page's visible text at `/manual` as a vet
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: `/releases` is English only like the manual, its strings are in the page as before; no dictionary key added or changed, so neither dictionary is touched
- [x] Mobile viewport (375px) — no overflow, controls reachable — as a vet at 375×812: `scrollWidth` 375 = `clientWidth`, the filter bar wraps with Show everything on its own line
- [x] Browser console clean — no errors or React warnings — no errors on `/releases`, `?view=all` or `#v0.2.2`; only HMR/Fast Refresh logs
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — every `/releases` and `/manual` request 200 in the dev server log

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/manual` as a vet (still "Showing the 19 topics for the Vet role", the #189 count); the release mail, by running `buildReleaseMail` under Node type stripping with a plain and a tagged note: both lines in the text and HTML, the tagged one escaped (`&#38;`), no `[object Object]`, and 0.8.0 still yields its 9 lines
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `manual/en.ts` by loading `/manual` (above); `releases.ts` by loading `/releases` and running the mail builder that imports it; `check-test-plan.mjs` by running it on this branch (section 7)
- [x] Nothing merged from `main` during `sync` was broken by this branch — the first sync was already up to date; two later syncs brought in `utc-visit-date` (#194, `unreleased` conflict resolved by keeping both lines; its blood-test line is untagged, so everyone sees it) and #196 (clean). Gates and CI green on the result, `c55cb9e`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — "2026-09-28 — Release notes by role: every version stays, tagged going forward"
- [x] `README.md` still accurate — it does not describe the release notes page's layout
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message — "Release notes now open on what changed for your own role, like the manual…"
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the counts, the badge text, the link target and the checker's handling of `roles: [...]` were each read from a run, not the source

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; release dates are fixed strings formatted in UTC as before
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: a membership test on a tag list, checked for a role inside and outside the tags (vet vs admin on the clinic line and on the temporary 0.2.2 tag)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates lines are pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: `/releases` is behind sign-in and no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` reverts the page and data in full; there is no schema or stored state to leave behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-test-plan.mjs` read every string literal in `unreleased`, so tagging a line would have counted each role name as an added release-notes line | fixed on this branch |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A vet's view reads right as a whole — the walkthrough that raised the item: does the filter bar, and a release that says Nothing for Vet, read as intended rather than as a broken page | `/releases` signed in as a vet |
| 2 | The tagging choice: history left untagged (everyone), three pending lines tagged — agree, or back-fill the released entries | `src/lib/releases.ts`, decisions.md |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items await Lutan

Manual verification by: pending: a vet's read-through of `/releases` and agreement on leaving released history untagged

### Result

- [x] Open defects are either fixed or explicitly accepted above — the one defect is fixed on this branch
- [x] Checklist pasted into the PR — linked from the PR description (`docs/test-plans/release-notes-by-role.md`), with its outcome summarised there
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending: after merge
