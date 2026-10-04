# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Four small findings from the staff dry run: resident ID search tolerates `R0055` and the box gets its own row (F-13), the assistant closes after a link, scrolls a new turn into view and answers a fostered animal with its carer (F-14), the manual's Getting help topic reads its contact from one constant (F-17, awaiting the details), an adopted animal stops being Ready for adoption (F-20) |
| Backlog item | `docs/backlog.md` → *Review the staff dry-run report* → F-13, F-14, F-20 ticked; F-17 left open; the parent item stays open |
| Branch / worktree | `claude/dry-run-findings-small` @ `C:\Development\Animal_Shelter_dry-run-findings-small` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | linked from the PR itself |
| Tested by / date | Claude (dry-run-findings-small session), 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the four findings above, with F-17 only made ready for the contact, not answered
- [x] Files/areas touched listed: `src/app/residents/page.tsx`, `src/lib/residents/code-search.ts`; `src/components/assistant/{AssistantPanel,AssistantMessages,AssistantConversation,AssistantAnswers}.tsx`, `src/app/assistant/lookups.ts`; `src/lib/placements/rehome.ts`, `src/app/residents/[id]/{ResidentHub.tsx,rehome/actions.ts}`; `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`; two strings in each of `src/lib/i18n/dictionaries/{en,th}.ts`; `scripts/check-resident-id-search.mjs`
- [x] Roles affected identified: the residents search and the assistant for everyone who can open them (admin, management, staff, vet, volunteer); adoption for those who can foster or adopt (admin, staff)
- [x] Out of scope written down: F-15, F-16 (navigation, `home-screens`), F-08 and F-09 (`icon-buttons`, batch 44); no migration (`volunteer-schema` holds 0134)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; already up to date at the time
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 229s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; older adopted rows that still carry `ready_for_adoption = true` are handled by the hub ignoring the flag for an Adopted resident
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Evidence, run 2026-10-04 against dev at 375 px (browser pane mobile preset) unless stated:

- `node scripts/check-resident-id-search.mjs` (new): a throwaway staff login and resident, requested through the running page. `R-1458`, `r-1458`, `R1458`, `R 1458`, `  R1458 ` and `1458` all list the resident, `R-99999999` lists nothing, the name still finds it. Ends "All expectations held."
- Search box width at 375 px: 327 px (was 61 px), page `scrollWidth` 375 — English and Thai.
- Assistant, English: "Where is Angsumalin?" then **Open enclosure** — the panel was gone and the page was `/enclosures/<id>`, `body.style.overflow` restored. A move request opened a confirm card whose Confirm button sat at y 730–766 of 812, and a following question scrolled into view.
- Assistant, fostered resident (dev has "Dryrun Zeta TH" with carer "Test Fosterer"): English "…is with foster carer Test Fosterer." and Thai "อยู่กับผู้อุปถัมภ์ Test Fosterer", no status line and no Open enclosure link.
- Adoption: a throwaway resident with `ready_for_adoption = true` adopted through the real foster/adopt form (Thai UI, 375 px); read back from the table, the flag is `false`; the hub shows only the Adopted badge.

- [x] Happy path works end to end: search by every spelling; follow an assistant link; adopt a Ready resident
- [x] Data persists — reload the page and the change is still there: the flag was read back from `residents` after the adoption
- [ ] Create / edit / delete all exercised — n/a: no new record type; the adoption is a create, exercised above
- [x] Empty state renders sensibly: a code that is nobody's returns the existing "no residents match" list
- [x] Invalid input is rejected with a readable message, not a crash: unchanged paths; a non-ID search term passes through untouched (`residentCodeTerm` returns it as typed)
- [x] Boundary cases checked: upper and lower case, hyphen, space, leading and trailing spaces, bare digits, an ID with no match, a name; a fostered resident with a carer. **Not run:** a fostered resident with no carer on the placement (the `whereFosteredNoCarer` string), and the same answer as a volunteer (whose contact view may not return the carer, so it falls back to the no-carer wording)

### Role access matrix

No permission changes. Only staff was signed in (throwaway login, banned afterwards).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | not run: no permission change |
| management | n/a | unchanged | not run: no permission change |
| staff | residents search, assistant, adopt form | as above | passed (above) |
| vet | n/a | unchanged | not run: no permission change; vet RLS still limits what the search and the lookup return |
| volunteer | n/a | unchanged | not run: the carer name is read through `contactRelation(scope)` like the hub, so a narrower scope returns the no-carer wording rather than more data |
| signed out | n/a | unchanged | not run: no public page changed; `/adopt` is revalidated, not edited |

- [ ] Every role above tested — n/a: no permission or role logic changed; staff was run as the representative role
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change (deliberately: `home-screens` owns nav)
- [x] Manual updated: the Search topic and the matrix entry now write `R-0042`; the Getting help topic reads `SUPPORT_CONTACT` (empty for now — see Left for manual verification). The acceptance-matrix `--check` inside `npm run lint` passes
- [x] Translatable strings go through the translation path: `whereFostered` and `whereFosteredNoCarer` added to `en.ts` and `th.ts`; the Thai wording reuses the existing `fosteredWith` phrasing and has not been read by a Thai speaker
- [x] Mobile viewport (375px): search box, assistant panel, fostered answer and the adopted hub checked, in English and Thai (above)
- [ ] Browser console clean — n/a: not read; the pages rendered and every interaction completed, but `read_console_messages` was not called
- [ ] Network clean — n/a: not read, same reason

## 6. Regression

- [x] The pages nearest the change still work: the Residents list as a name search and the assistant's "where is" for an ordinary resident (both exercised above)
- [x] Shared file checked from a second, unrelated page: `AssistantPanel` is mounted in the header of every page — it was driven from `/residents` and the link closed it onto `/enclosures/<id>`; `rehome.ts` is shared by foster and adopt — only the adopt path gains the flag clear (it sits inside `if (input.kind === "adopt")`), and the form was run for adopt
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged
- [x] Overlap with `home-screens` (3002) and `volunteer-schema` (3003): no nav, home tile, `ActionLink.tsx` or `hub-icons.ts` touched; the search change is in the page's query and the hub change is a display condition, so a resident page that misbehaves after `volunteer-schema` merges is that stream's narrowing of what the database returns

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch: F-13, F-14, F-20 ticked with a note each; F-17 left open with a status line (awaiting the contact details); the parent review item is left open
- [x] Non-obvious design choices added as `docs/decisions/2026-10-04-dry-run-findings-small.md` (which ID format is right, the flag cleared in code not a migration, the cache half of F-20)
- [ ] `README.md` still accurate — n/a: README does not describe ID search, the assistant or adoption
- [x] **Release notes.** Three lines added to `unreleased` in `src/lib/releases.ts`: ID search and the search box, the assistant closing and answering fostered animals, and an adopted animal no longer advertising itself
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision were measured, not reasoned: that `R0055` found nothing before and every spelling finds it now, the 61 px to 327 px box, that the flag is `false` after a real adoption. **Not measured:** that the Adopt page stops listing the animal on its first load after adoption — the cause (a stale page cache; `public_resident_profiles` already excludes adopted rows, 0025) was read from the migration and the fix is the added `revalidatePath`; no public page was loaded before and after

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here depends on the clock
- [ ] Boundary assertions cover both edges — n/a: no threshold or date logic
- [x] Evidence pasted is the tool's actual output: the §2 lines are printed by `scripts/gates.mjs`; the §4 result is the new script's own ending
- [ ] Public pages re-checked after cache purge — deferred: release manager (this is where F-20's cache half is confirmed, after a purge or ten minutes)

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi (a rebuild); `npx wrangler rollback --env production` for the Worker. No migration; the only stored change is `ready_for_adoption = false` on residents adopted from now on, which the badge no longer needs

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The manual and the acceptance matrix wrote IDs as `R0042`; the app has always printed `R-0042` | fixed — both corrected, search made tolerant |
| 2 | low | Adoption never cleared `ready_for_adoption` (only death did) | fixed |
| 3 | low | The dev data from the adoption check (resident "Harness F20 Adopt" with an Adopt placement, and a staff login) could not be deleted: `placement_history` rows are immutable and the login is referenced | accepted — dev data is disposable; the login was banned and its credentials discarded |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **A question for Lutan (F-17):** who should the manual name for Getting help, and by phone or LINE? Fill `SUPPORT_CONTACT` in `src/lib/manual/en.ts` (name, and phone and/or line) and the topic names them. Until then it keeps the general wording | Manual → Getting help |
| 2 | Whether the Thai fostered answer ("…อยู่กับผู้อุปถัมภ์" plus the carer name) reads naturally | Assistant → "Where is the fostered resident?" |
| 3 | On a real phone, open the assistant, ask "Move a resident to an enclosure today" and confirm Confirm is on screen without scrolling the page behind it | Assistant panel |
| 4 | After the release is deployed and the public cache purged (or ten minutes): adopt a Ready resident and load `/adopt` straight after — it should not be listed | Public Adopt page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (dry-run-findings-small session)  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the list is not empty and no person has looked (see the pending signature below)

Manual verification by: pending: the four items under *Left for manual verification*, chiefly the contact for the Getting help topic

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: not yet — handed over when the PR is opened

Result: pass with accepted defects

Release manager acknowledgement: n/a  Date: —
