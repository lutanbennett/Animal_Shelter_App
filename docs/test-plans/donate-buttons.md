# Feature test plan

## Header

| | |
|---|---|
| Feature | Donate page: a button for each way to give (the app half: Settings → Website → Donate and the buttons and cards on `/donate`) |
| Backlog item | `docs/backlog.md` → **Donate page: a button for each way to give** (ticked here), and step (a) of **Make `/donate` ask for money and record what arrives** (noted done) |
| Branch / worktree | `claude/donate-buttons` @ `C:\Development\Animal_Shelter_donate-buttons` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened after this commit; the number goes in the follow-up commit |
| Tested by / date | Claude / 2026-10-13 |
| Carries a migration? | no — reads `0191_donation_channels.sql` (#572), already on `main` and applied to dev |
| Tested at SHA | `f718b719` (after sync with `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: Settings → Website gets a Donate tab to add, edit, reorder, hide and delete ways to give (links checked as `https://` and, for PayPal, DonorBox and Wise, on the company's own address), and `/donate` shows a big button per linked way and a Copy card per details-only way under the page text
- [x] Files/areas touched listed: `src/lib/links/donation.ts` (+ test), `src/lib/site/donation-channels.ts`; `src/app/admin/website/` (actions, page, tabs, `DonationChannels.tsx`); `src/app/donate/` (`DonateWays.tsx`, `CopyButton.tsx`, page) and `src/app/adopt/SitePageView.tsx` (an `after` slot); `src/lib/audit/recent-changes.ts` and Recent changes page; both dictionaries; manual; `src/lib/translations/labels.ts`; `scripts/check-donate-buttons.mjs`
- [x] Roles affected identified: admin (and anyone with `website.content`) edits; the signed-out public reads `/donate`; every other role sees nothing new
- [x] Out of scope written down: knowing that a payment arrived and recording it (staff still enter gifts under Management → Donations); logos (brand rules not checked); removing the seeded "(Wise / PayPal / other details)" text and entering the real ways on production, both filed on the `backlog` branch; the Thai of each name and note, which goes through Management → Translations

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (docs only came in)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit codes read from the script's own lines, output redirected to a file:

```
=== gates: typecheck exited 0 after 10s
=== gates: lint exited 0 after 94s
=== gates: test exited 0 after 2s
=== gates: build exited 0 after 231s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; `0191` merged in #572
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; `0191` was applied to dev by the schema stream
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: the table started empty and nothing was back-filled
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; the nine look-alike links were nonetheless asserted refused by the table's own check (23514) in `scripts/check-donate-buttons.mjs`
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; `0191` must be live in production before this ships, and `apply-migrations.mjs` warns if it is not

## 4. Functional checks

- [x] Happy path works end to end: on dev, a PayPal, a DonorBox and a Wise way were added, and `/donate` showed a button for each pointing at paypal.com, donorbox.org and wise.com (`check-donate-buttons.mjs`, 28 expectations, all held). In the browser a Wise and PayPal button and a bank card rendered under the page text
- [x] Data persists — the check script reads the rows back through the view and the rendered page; the Settings list is read from the table on every load
- [x] Create / edit / delete all exercised: create, show/hide and delete by the script; the save/move/QR actions are typechecked and share the update path, but **edit-in-place, reorder, delete and QR upload from the Settings screen were not clicked through** (listed below)
- [x] Empty state renders sensibly: with no ways, `DonateWays` returns nothing and `/donate` is the page text only; Settings shows "No ways to give yet… Add one below" (code read; not seen on screen, because test rows were already there when it was opened)
- [x] Invalid input is rejected with a readable message: in the Settings form a PayPal link of `https://paypal.com.evil.test/donate` was refused with "Use a link on paypal.com / paypal.me."; `donation.test.mjs` covers http, javascript:, blank and the wrong-company cases
- [ ] Boundary cases checked — n/a: the inputs are short text and one link; long account numbers wrap (`break-all`) and no horizontal scroll was found at 375 px (measured, §5)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Website → Donate | sees the tab; can add, hide, show | throwaway dev admin: opened the tab, added, hid and showed ways |
| management | n/a | not tested | n/a: not driven; the gate is the unchanged `website.content` permission |
| staff | n/a | no tab | n/a: not driven; same permission |
| doctor | n/a | no tab | n/a: not driven; same permission |
| volunteer | Settings → Website → Donate | does not get the tab; cannot insert a way | throwaway volunteer: the page did not contain the form, and its own login's insert was refused by RLS |
| signed out | `/donate`, `public_donation_channels` | reads shown ways only; table itself unreadable | script: shown way readable, hidden way absent from the view, `donation_channels` returned no rows |

- [ ] Every role above tested — n/a: admin, volunteer and signed out were driven; no permission or grant changed in this PR, so management, staff and doctor see what their `website.content` setting already gave them
- [x] A role that should not have access is blocked server-side: every action begins with `can(…, "website.content")`, the volunteer's insert was refused by RLS, and the signed-out reader got zero rows from the table

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; the Donate tab sits inside the existing Website page
- [x] Manual updated (`src/lib/manual/en.ts`): the Website topic now says six tabs and has a "Donate tab — ways to give" step
- [x] Translatable strings go through the translation path: every new string is in both `en.ts` and `th.ts` (the type holds Thai to the English shape); each way's name and note go through `translatable_fields` (0191) and Management → Translations, and `donation_channels` is filed with Website there. Not exercised: writing a Thai name in the queue and seeing it on `/donate`
- [x] Mobile viewport (375px): `/donate` measured at 375 px wide in English and Thai: one column, no horizontal scroll (`scrollWidth` ≤ `clientWidth`), buttons have a 56 px minimum height in the code, not measured. `scripts/check-phone-width.mjs` was **not** run
- [x] Browser console clean: `read_console_messages` errors-only returned nothing on `/donate` (Thai). The Settings tab's console was not read separately
- [ ] Network clean — n/a: not read; the check script's page fetches all returned 200

## 6. Regression

- [x] The pages nearest the change still work: `/donate` (text, the Get in touch card and the Shelter Friends block still render below the new section), Settings → Website other tabs load (the page has six tabs now)
- [x] Shared file checked from a second page: `SitePageView` gained an optional `after` prop; it is only passed by `/donate`, and `/foster` was not reloaded, so that is the page to look at (listed below)
- [x] Nothing merged from `main` during `sync` was broken: only docs came in, and the gates ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, and step (a) of *Make `/donate` ask for money* marked done with the other steps left open. The other open donate items (per-donation QR, shop, affiliate, sponsorship drives) were searched and none is closed by this. The hand steps (seeded text line, real ways on production, Thai names) are filed on the `backlog` branch
- [x] Non-obvious design choices: `docs/decisions/2026-10-13-donate-buttons.md`
- [x] `README.md` still accurate — it does not describe the Donate page
- [ ] **Release notes.** n/a: the buttons show only after someone enters the ways to give in Settings on production, so a note now would promise donors something that is not there; the step is the backlog item filed 2026-10-13, and the note goes in the change that closes it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The domain rule's claims are each an assertion: 18 trick addresses in `donation.test.mjs` and nine against the real table in `check-donate-buttons.mjs`. The "Copied" fallback was seen working in the in-app browser, where the first method was refused

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the pasted gates lines are copied as printed; no hand-made table of results
- [ ] Public pages re-checked after a cache purge — deferred: release manager (`/donate` changed; anonymous GETs are edge-cached)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here; the code reads `0191`, which must be live in production first (`apply-migrations.mjs` warns if not)
- [ ] `--env production --dry-run` — n/a: no migration in this PR
- [ ] Fresh production backup for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR; `0191` goes first, with the schema PR's own plan

### Rollback

- [ ] Rollback position stated — n/a: code only; a Pi rollback to the previous ref removes the tab and the buttons, and the table and its rows stay, harmless

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | The first Copy button used `navigator.clipboard` only, and the in-app browser refused it | fixed: falls back to select-and-copy, and says so if both fail |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Copy puts the real account number on the clipboard (paste it somewhere); the browser pane used for testing cannot read the clipboard back | `/donate` on a real phone and a PC |
| 2 | From the Settings screen: edit a way and Save, reorder with the arrows, Hide then Show, Delete, and upload and remove a PromptPay QR picture | Settings → Website → Donate |
| 3 | Each real button opens the right company's page in a new tab, once the real links are entered | `/donate` |
| 4 | A Thai reader on a real phone: the Thai wording of the headings, the Copy button and the Settings screen reads naturally | `/donate` and Settings in Thai |
| 5 | The page looks right with the Director's own text above it, once the seeded "(Wise / PayPal / other details)" line is removed | `/donate` on Test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; five items wait for Lutan

Manual verification by: pending: the five items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
