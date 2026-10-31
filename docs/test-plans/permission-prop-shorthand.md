# Feature test plan

## Header

| | |
|---|---|
| Feature | Permission props are written out, never as JSX shorthand (+ a check that keeps it that way) |
| Backlog item | `docs/backlog.md` → *EIGHT PERMISSION PROPS ARE WRITTEN AS JSX SHORTHAND, WHICH MEANS ALWAYS TRUE* |
| Branch / worktree | `claude/permission-prop-shorthand` @ `C:\Development\Animal_Shelter_permission-prop-shorthand` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (Opus 5) · 2026-10-31 |
| Carries a migration? | no |
| Tested at SHA | `fd3f9d8c` (code) · plan committed on top |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *nine JSX permission props that were written as bare attributes (which in JSX means `true`) now name the expression they depend on, and a new check fails any that are written bare again.* The item asked for **a verdict per call site**; all nine verdicts are **safe**, and they are in the PR body and in `docs/decisions/2026-10-31-permission-props-written-out.md`
- [x] Files/areas touched listed — `src/app/maintenance/[id]/{MaintenanceJobView,MaintenanceBills}.tsx`, `src/app/management/appeals/[id]/page.tsx`, `src/app/management/translations/{TranslationQueue.tsx,page.tsx}`, `src/app/projects/[id]/{FolderView,PhotoSection}.tsx`, `src/app/clinic-visits/[id]/edit/page.tsx`, `src/app/deliveries/page.tsx`; new `scripts/check-permission-props.mjs`; `.github/workflows/ci.yml` (`script-integrity` job). No `worker/`, no `supabase/migrations/`, no `src/lib/permissions/`
- [x] Roles affected identified — **none, and that is the finding.** Analysis is by card (`CLAUDE.md`): every one of the nine props already carried the value its enclosing route guard or condition had tested, so no card's holder sees a different control than before, in either direction. The cards whose holders were checked for a change and had none: `bills`, `translations`, and by reading, every card granting `maintenance.bills`, `translations.manage`, `appeal.run` + `donation.receipt`, `medical.visits` at edit, or `stock.delivery`
- [x] Anything explicitly **out of scope** written down — the server and database checks are untouched (`mayFileBill()`, `approveTranslation`, `clearTranslation`, `moveGiftsToAppeal`, `moveGiftOutOfAppeal`, every RLS policy). `src/lib/permissions/can.ts` and `catalogue.ts` were not touched and did not need to be. The check does **not** judge whether a prop names the *right* activity — only that an expression is there to judge

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Pasted exactly as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration; the brief says do not add one
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; no query was altered
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — a login holding **only the `translations` card** (`node scripts/dev-signin.mjs --cards translations --port 3003`) reached Management → Translations by clicking its Home tile, and was drawn **137 open editors**, each with **Save & approve**, **Remove translation** and **Cancel**, plus the `B`/`I`/`U` style toolbar on the two website-page-body rows. That is the direct proof of the one genuinely new piece of plumbing: `TranslationQueue` now receives `canManage` as a prop from its page, and had it arrived `undefined`, every one of those editors and buttons would have been absent
- [x] Data persists — reload the page and the change is still there — the change alters no stored data; the persistence that matters here is that the prop survives a client-side navigation, which the check above did (Home → Translations as a client-side nav, editors drawn after hydration)
- [ ] Create / edit / delete all exercised — n/a: no create, edit or delete path changed. No translation was approved or cleared: the dev database is shared with two live streams (`thai-sweep-typed` is writing draft translation rows) and approving one of its rows would corrupt its work
- [x] Empty state renders sensibly — the `bills`-card login's Home drew exactly one tile (Bills) and `/my` read *"Nothing is assigned to you right now"*; neither drew a control it could not use
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path changed; the only new code is a build-time script with no user input
- [ ] Boundary cases checked — n/a: no values, dates or text handled. The boundary that exists here is the check's parser, covered under Regression below

### Role access matrix

**Filled by card, not by role** (`CLAUDE.md`: *"All analysis is by CARD, never by role"* — roles are a transient grouping and the assignments are to be rebuilt). The template's role rows are left `n/a` with the card result in their place, because a count per role measures nothing that survives next week's reassignment.

| Card held (and nothing else) | Can reach | Expected | Result |
|---|---|---|---|
| `translations` | `/management/translations` via its Home tile | editors drawn and editable (`translations.manage` is what `approveTranslation` asks) | **pass** — 137 editors, Save & approve / Remove translation present |
| `bills` | `/home`, `/bills` | exactly one tile; no control it cannot use | **pass** — one tile (Bills); `/bills` drew its own add-a-page control, which `mayFileBill("bill_inbox")` allows |
| Admin | everything | unchanged by this PR | **pass by construction** — `perms.isAdmin` short-circuits in `can.ts`, untouched; it sits outside the card system and nothing here reads a role |

- [x] Every role above tested — read as *every card above tested*; see the table and the n/a reason in the heading
- [x] A role that should not have access is blocked server-side — unchanged and deliberately so: *hiding is the courtesy, never the security.* No server or database check was removed or weakened. The `bills`-card login was confirmed not to be drawn the Translations tile at all, and the actions behind every prop still call `can(perms, …)` / `mayFileBill()` on the server exactly as before

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no route added or removed
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a shelter user does changed, so there is nothing to describe
- [ ] Translatable strings go through the translation path — n/a: no user-facing string added or changed; the only new strings are in a build-time script's console output
- [ ] Mobile viewport (375px) — n/a: no layout, markup or styling changed; the props carry booleans that were already the values being passed
- [x] Browser console clean — no errors or React warnings — checked on `/home`, `/bills`, `/my` and `/management/translations` across both one-card logins while driving the checks above; nothing logged
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `/home`, `/bills`, `/my`, `/maintenance` and `/management/translations` all returned 200 for the logins entitled to them

## 6. Regression

- [x] The pages nearest the change still work — `/management/translations` (editors drawn, toolbar intact), `/home` and `/bills` loaded and behaved for a one-card login. `/maintenance` returned 200 for the `bills` card
- [x] Any shared file touched checked from a second, unrelated page — `TranslationPanel` is the shared component five of the nine props feed. It was loaded from Management → Translations (`TranslationQueue`'s call site, the one whose prop is new) **by loading the page, not by reading the file**; its editor, its Save & approve and Remove buttons and #1126's `B`/`I`/`U` toolbar all render. `BillPhotosSection` is the other shared component; its `bill_inbox` caller on `/bills` was loaded and drew its add-a-page control
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and all four gates passed afterwards
- [x] **The new check was proved in both directions** — `node scripts/check-permission-props.mjs` exits 0 on the tree (461 `.tsx` files, none bare) and exits 1 naming the exact file and line when a shorthand is deliberately reintroduced into `src/app/projects/[id]/PhotoSection.tsx`. It is tag-aware rather than line-anchored, which is why it found three call sites the backlog item's grep had missed and does not report the two `canSeeGifts` ternary lines that grep did

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — ticked with the verdicts, the three extra call sites and what closed it. Searched the backlog for every file and component touched (`TranslationPanel`, `BillPhotosSection`, `AppealGifts`, `TranslationQueue`, `MaintenanceBills`, `FolderView`, `PhotoSection`); **no other open item is closed by this work** — the only other hits were already-ticked items, one of which (`2026-10-31`, Thai rich text) records #1126's own fix
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-31-permission-props-written-out.md`: the nine verdicts, why safe props were still written out, the three the grep missed, and why the check asks about shape rather than judgement
- [x] `README.md` still accurate — no setup, command or structure changed
- [ ] **Release notes.** — n/a: no control changed for anyone who could use it. All nine props already carried the value their enclosing guard had tested, so nothing appears or disappears for any card holder; the user-visible fix in this class was #1126's and shipped with it
- [x] Commit messages say why, not just what — the code commit explains the JSX-shorthand mechanism, states plainly that all nine were safe, and says why they were changed anyway
- [x] **Claims in commit messages and decisions were measured, not reasoned** — every verdict names the activity read from the action's own body (`approveTranslation` / `clearTranslation` → `translations.manage`; `moveGiftsToAppeal` → `appeal.run` **and** `donation.receipt`; `mayFileBill()` in `src/lib/bills/upload.ts` → `medical.visits` at edit / `stock.delivery` / `maintenance.bills`), never guessed from the control's label. The claim that the check would have caught #1126's hole was checked against the commit that introduced it (`cc865d52`), which wrote it as a bare attribute under the comment *"Admin is a superset of management, so always"*

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this change derives a date, an instant or a duration
- [ ] **Both edges of the band and both sides of the boundary** — n/a: no threshold, rounding rule, retry window, pagination limit or permission cutoff changed; a boolean already being passed is now named
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line in section 2 is as printed, and the counts in section 4 are the values the page returned, not a tidied table
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched; all nine call sites are behind sign-in

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — ordinary code rollback: `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, `npx wrangler rollback --env production` for the Worker fallback. There is nothing else to cover: no migration, no stored data, no setting. A rollback restores the shorthand, which is safe today precisely because the enclosing guards it relied on are also restored with it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none (not a defect) | The backlog item's grep `^\s+can[A-Z]\w*\s*$` under-counted its own class by a third: it reported two lines that are not JSX (`appeals/[id]/page.tsx:58`, `:67` — the first line of a ternary in an argument list) and missed three that are (`clinic-visits/[id]/edit/page.tsx:149`, `deliveries/page.tsx:255`, `maintenance/[id]/MaintenanceBills.tsx:166`) | fixed — all three verdicted (safe) and written out; the new check is tag-aware so the miscount cannot recur |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Empty on purpose: no control appears or disappears for any card holder, so there is nothing for a
person to look at that the one-card logins above did not already settle.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-10-31

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no control changed for anyone who could use it, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: not yet cut into a release
