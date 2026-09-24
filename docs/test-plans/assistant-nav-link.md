# Feature test plan

## Header

| | |
|---|---|
| Feature | Assistant leaves the left nav; the header slide-over links to the full `/assistant` page |
| Backlog item | `docs/backlog.md` → Quick wins → "Remove the Assistant link from the left nav — it lives in the header now." |
| Branch / worktree | `claude/assistant-nav-link` @ `C:\Development\Animal_Shelter_assistant-nav-link` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened from this branch; see the PR page |
| Tested by / date | Claude, 2026-09-25 (browser pane signed in by Lutan as admin) |
| Carries a migration? | no |
| Tested at SHA | `0d20369` (code, browser-checked and gated); this plan is committed on top |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the one-item Assistant group leaves the sidebar, and the header's slide-over gains an "Open full page" link to `/assistant`. That is the option Lutan chose on 2026-09-25, recorded in the brief and in `docs/decisions.md`
- [x] Files/areas touched listed — `src/app/NavLinks.tsx` (group removed), `src/components/assistant/AssistantPanel.tsx` (link), `src/components/hub-icons.ts` (`NAV_ICONS.assistant` removed), `src/lib/i18n/dictionaries/en.ts` + `th.ts` (`nav.assistant` removed, `assistant.panel.fullPage` added), `src/lib/manual/en.ts` (assistant + navigation topics), `src/lib/releases.ts`, docs. No `worker/`, no migration, nothing under `src/app/assistant/` or `src/lib/assistant/`
- [x] Roles affected identified — every signed-in role loses the sidebar entry. The old entry was not gated, so vet saw it too. The panel and its new link show only for `canUseAssistant` roles (admin, management, staff, volunteer). Signed-out public: no change
- [x] Anything explicitly **out of scope** written down — the `/assistant` route and its server checks are unchanged. `fetchAssistantContext()` has no role check of its own and relies on RLS. That predates this PR, so it went to the backlog branch rather than into this change. `/manual` screenshots are not regenerated (full rerun deferred)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date." at `0d20369`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 261s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on `/enclosures`, the header's Assistant button opened the panel, with "Open full page" under the title. Clicking it closed the panel and landed on `/assistant`. There, "Where is Butter?" answered "Butter (บัตเตอร์) is in Front Zone 10 (Front Zone - White)"
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written; the change is navigation only
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the feature has no create/edit/delete
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or data added
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input added
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the link is hidden when the panel is opened on `/assistant` itself (checked: dialog open, no `a[href="/assistant"]` in it). The longer Thai label เปิดแบบเต็มหน้า fits at 375px with no horizontal overflow (`scrollWidth - innerWidth` = 0)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | header panel, `/assistant` | no sidebar entry; panel shows "Open full page"; page works | **pass** — driven in the browser at 1280px and 375px, en and th |
| management | header panel, `/assistant` | same as admin | not signed in as; same `canUseAssistant` gate as admin, and `NavLinks` has no role branch for this entry any more |
| staff | header panel, `/assistant` | same as admin | not signed in as; same reason as management |
| vet | nothing assistant | no sidebar entry (the old one was ungated, so this is new); no header button; `/assistant` shows only "Your account can't use the assistant." | not signed in as. Server check is unchanged and read in code: `page.tsx` renders the conversation only when `canUseAssistant(context.role)`. Left for manual verification |
| volunteer | header panel, `/assistant` (lookups only) | same as admin, read-only subtitle | not signed in as; same gate as admin |
| signed out | nothing | proxy sends `/assistant` to `/login` | seen: the signed-out pane at `/residents` was sent to the sign-in page; `/assistant` not hit directly while signed out |

- [ ] Every role above tested — n/a: only admin was signed in; the other roles' behaviour comes from `canUseAssistant`, which this PR does not touch, and vet's direct-URL refusal is in the manual list
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no vet account was signed in to drive it; the check in `src/app/assistant/page.tsx` is unchanged by this branch and is left for manual verification below

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — admin sidebar at 1280px and drawer at 375px list `/residents /enclosures /maintenance /vets /contacts /projects /management /admin /manual /releases /account/password /admin/security`, no `/assistant`; the Thai drawer likewise
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `#assistant` path reads "Assistant button in the header (any screen)", and its first step describes the header button and "Open full page". `#navigation` no longer lists the Assistant in the menu and names the button among the header's controls
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the new string is a UI dictionary entry (`en.ts`/`th.ts`), not record content; Thai rendering checked in the browser instead
- [x] Mobile viewport (375px) — no overflow, controls reachable — Thai panel at 375px, overflow 0, link and close button visible
- [x] Browser console clean — no errors or React warnings — `read_console_messages` errors-only empty after the run
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no requests added; the `/_next/static` chunks all returned 200, and `preview_logs` showed only 200s for the pages visited

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/residents`, `/enclosures`, `/maintenance`, `/assistant`, `/manual`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — sidebar/drawer loaded on `/residents` and `/maintenance`; `/manual` loaded and both edited topics read back; `hub-icons.ts` still supplies the sidebar icons (visible in the drawer screenshot) and the `/admin` Security tile compiles in the build
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was a no-op ("Already up to date.")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated
- [ ] `README.md` still accurate — n/a: README does not mention the sidebar or the assistant's entry points
- [x] **Release notes.** `unreleased` gained a line: the Assistant is no longer in the left menu, the header button opens it, and "Open full page" in the panel leads to the full page
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — "nothing else used them" is a grep of `src/` for `nav.assistant` / `NAV_ICONS.assistant` plus a passing build; "the old entry was not gated" is read from the removed code (no role condition on that group); "the panel does not unmount on navigation" is the observed need for `setOpen(false)`, since the header sits in the layout

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold, banding or cutoff involved
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

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

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` restores the sidebar entry; there is no schema or data change to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `fetchAssistantContext()` (`src/app/assistant/actions.ts`) has no role check of its own, so a vet can call it and get the resident/vet lists, limited only by RLS. Predates this PR; this PR removes the vet's only link toward it | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a **vet**, open `/assistant` by typing the URL: the page shows only "Your account can't use the assistant." — no conversation box — and the header has no Assistant button | `http://localhost:3003/assistant` or `test.lannacare.org/assistant` |
| 2 | Signed in as **staff** or **volunteer** on a phone: the ☰ menu has no Assistant, and the header's speech-bubble button opens the panel with "Open full page" under the title | any screen |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items await Lutan

Manual verification by: pending: vet direct-URL refusal at /assistant; staff or volunteer phone view of menu and panel

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect predates this change and is deferred to the backlog
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over with the PR once it merges

Result: pass
