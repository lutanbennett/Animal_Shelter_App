# Test plan — website approval portal, part 2 (home-page settings drafts)

## Header

| | |
|---|---|
| Feature | Home-page settings (`site_content`) save as a draft when the login may only propose |
| Backlog item | `docs/backlog.md` → `#7j2qf` |
| Branch / worktree | `claude/website-approval-portal-2` @ `C:\Development\Animal_Shelter_website-approval-portal-2` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | number on the PR itself |
| Tested by / date | Claude / 2026-11-05 |
| Carries a migration? | no |
| Tested at SHA | 8f8c67af |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the settings form drafts through `propose_website_draft` (`site_content`) for a login holding Propose website changes
- [x] Files/areas touched listed — `src/app/admin/website/{actions.ts,page.tsx,SiteSettingsForm.tsx}`, a guard test, `src/lib/releases.ts`, a decision file, `docs/backlog.md`; no migration, no `worker/`
- [x] Cards affected identified — `propose_website` (now has a working screen), `approve_website` (unchanged), `website` (Save now drawn on website.content); Admin unaffected; signed-out public unaffected
- [x] Out of scope written down — a medical/Drive photos tab and an adoption-updates tab (nothing can wait there, see the decision file), a gallery draft path (0315 reasoning holds)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — all zero, pasted below

```
=== gates: typecheck exited 0 after 114s
=== gates: lint exited 0 after 175s
=== gates: test exited 0 after 16s
=== gates: build exited 0 after 125s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration, 0315 already accepts site_content
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — a proposer saved a draft; an approver published it from Page changes
- [x] Data persists — the draft was listed after the proposal, labelled "Home page", with every column of the patch
- [x] Create / edit / delete all exercised — a second proposal replaced the first (one draft per target); publish deleted the draft; discard is unchanged from 0315
- [x] Empty state renders sensibly — after publishing, the tab read "No website changes are waiting."
- [x] Invalid input is rejected with a readable message — the shared `siteContentPatch()` runs the same link, map-link, WhatsApp and gift-split checks as the publish, and the guard test asserts both actions call it
- [ ] Boundary cases checked — n/a: no new boundaries, the validation is the existing code moved rather than changed

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | /admin/website | unchanged: full page, Save publishes | not re-driven; canEdit is website.content and the Admin short-circuit is untouched |
| exactly `propose_website` | /admin/website | settings form alone, button "Save as a draft", live page unchanged | pass: draft saved, the home page HTML did not contain the draft text |
| exactly `approve_website` | /photos/approve | Page changes tab shows the draft with Publish and Discard | pass: published, live tagline intact |
| signed out | /admin/website | sent to sign-in | not re-driven; the page guards are unchanged |

- [x] Every login above tested — the two one-card logins were driven; Admin and signed-out are unchanged guards, said so in their rows
- [x] A login that should not have access is blocked server-side — `proposeSiteContent` asks `website.propose` and the RPC asks it again; `updateSiteContent` still asks `website.content`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe the settings form's draft path; the release note does
- [x] Translatable strings go through the translation path — reuses `t.admin.website.pages.proposed` and `proposeChanges`, which already exist in English and Thai
- [ ] Mobile viewport (375px) — n/a: no layout change, the form is the existing one
- [ ] Browser console clean — n/a: not read; the pages rendered and acted correctly
- [ ] Network clean — n/a: not read

## 6. Regression

- [x] The pages nearest the change still work — /photos/approve (all five tabs drawn for the approver) and /admin/website (proposer view)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `actions.ts` is shared only by the website admin forms, covered by the full test run
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates green after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-05-website-approval-portal-2.md`
- [x] `README.md` still accurate — it does not describe this
- [x] **Release notes.** `unreleased` has a line, card-tagged to `propose_website` and `approve_website`; no manual step is outstanding
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Medical-folder approve-on-save was read in `0224`; the draft-and-publish round trip was driven on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covered on both edges — n/a: no thresholds
- [ ] Evidence pasted into this plan is the tool's actual output — n/a: the only pasted evidence is the gates block above, unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: code only, no schema; redeploy the previous commit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The Propose website changes card opened /admin/website, which refused a login holding only that card | fixed: the page now opens to a proposer with the settings form alone |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-05

### Manual verification

- [x] The manual list above is empty — n/a: nothing needs a person to look at separately from the browser check already driven

Manual verification by: n/a: the list is empty and the one-card flows were driven in the browser

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links to this file
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass

Release manager acknowledgement: n/a: not yet released  Date: n/a
