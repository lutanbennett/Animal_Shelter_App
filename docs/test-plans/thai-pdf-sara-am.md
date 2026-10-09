# Feature test plan

## Header

| | |
|---|---|
| Feature | ำ (SARA AM) no longer drops characters from the archive summary and manual PDFs |
| Backlog item | `docs/backlog.md` → none: follow-up suggested by the donation-receipts stream (`docs/decisions/2026-10-09-thai-sara-am-in-pdfs.md` on that branch, "Not done here") |
| Branch / worktree | `claude/thai-pdf-sara-am` @ `C:\Development\Animal_Shelter_thai-pdf-sara-am` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | see the PR this file is in |
| Tested by / date | Claude, 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | 7af54399 (code), gates re-run on the tree with the docs commits; no code changed after |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: every string child of the resident summary's and the manual PDF's `Text` goes through `thaiPdfText()` (ำ → ํ + า), as the receipt already does
- [x] Files/areas touched listed: `src/lib/archive/fonts/thai-pdf-text.ts` (copied unchanged from `claude/donation-receipts`), `src/lib/archive/fonts/thai-pdf-children.ts` (new), `src/lib/archive/resident-summary-pdf.tsx`, `src/lib/manual/manual-pdf.tsx`, `scripts/count-sara-am-archives.mjs` (new, read-only), `src/lib/releases.ts`, `docs/decisions/`
- [x] Roles affected identified: anyone who downloads the manual PDF (every signed-in role); whoever opens a deceased resident's summary in Drive (admin / management)
- [x] Anything explicitly **out of scope** written down: regenerating summaries already on Drive (counted, not regenerated); the receipt's own wrapper (on its branch, handles a lone string only, which is all it is given today)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 212s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the count script only reads
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: real `renderResidentSummaryPdf` and `renderManualPdf` rendered with stub records containing "จำกัด (x)", "น้ำ)" and "Nam (บริษัท ล้านนา พัฒนา จำกัด (คุณสมศรี ใจดี))", before and after, rasterised with Windows' PDF renderer. Before: the summary header and a manual title each printed one ")" short. After: both ")" present. Pixel diff: those lines are the only changed pixels on every page
- [x] The real English manual (`src/lib/manual/en.ts`) rendered before and after: before, the assistant topic's step 7 ended "…ครบกำหน" (missing "ด."); after, "…ครบกำหนด."; that one line is the only pixel change on the page, and `pdftotext` of the whole manual differs only on that line
- [ ] Data persists — n/a: nothing is saved; the change is in rendering
- [ ] Create / edit / delete — n/a: no records are created or changed
- [x] Empty state renders sensibly: the manual footer's `render` Text (no children) still prints "1 / 2"; summary fields with no value still print "—"
- [ ] Invalid input rejected — n/a: no input
- [x] Boundary cases checked: ำ in a lone string, in an array of children (the manual callout `<Text>Tip: </Text>{text}`), in a nested Text, in a wrapped two-line paragraph with 48 ำ, in table cells, and in text with no ำ (unchanged)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no access rule changed | n/a | n/a |
| management | n/a: no access rule changed | n/a | n/a |
| staff | n/a: no access rule changed | n/a | n/a |
| vet | n/a: no access rule changed | n/a | n/a |
| volunteer | n/a: no access rule changed | n/a | n/a |
| signed out | n/a: no access rule changed | n/a | n/a |

- [ ] Every role above tested — n/a: rendering only; who can download either PDF is unchanged
- [ ] A role that should not have access is blocked server-side — n/a: no route or permission touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no manual wording changed (its PDF rendering is what is fixed)
- [ ] Translatable strings — n/a: no UI strings added
- [ ] Mobile viewport — n/a: PDF output only
- [ ] Browser console clean — n/a: server-side PDF rendering, no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: the full English manual rendered through the changed code (same page count, text identical except the fixed line); summary pages pixel-identical apart from the fixed header
- [x] Shared file touched (`src/lib/archive/fonts/`) checked from a second consumer: the manual imports from it and was rendered, not just read
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought nothing in

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item exists for this; nothing else in `docs/backlog.md` names these files or this bug
- [x] Non-obvious design choices added: `docs/decisions/2026-10-09-thai-sara-am-in-archive-and-manual-pdfs.md`
- [ ] `README.md` still accurate — n/a: README says nothing about PDF text shaping
- [x] **Release notes.** `unreleased` gained a line: the summary PDF and the manual no longer drop the last letter or bracket from a line with ำ, and Thai copied out of them comes out right
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The first draft of the decision said regular-weight text was never affected; rendering the real manual showed otherwise and it was corrected before the PR

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager (download the manual PDF; step 7 of the assistant topic ends "ครบกำหนด.")
- [ ] Timezone-sensitive behaviour — n/a: nothing here reads a date or clock
- [ ] Boundary or banding change — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** (the gates lines above)
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read — deferred: production release manager
- [ ] `strip-baked-env` seen — deferred: production release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: redeploy the previous SHA on the Pi (`./scripts/pi/deploy-pi.sh --ref <sha>`). No schema involved. Summaries regenerated after this ships would keep the fixed rendering, which is harmless

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | Shipped English manual PDF drops "ด." from the end of the assistant topic's step 7 | fixed |
| 2 | minor | Archive summaries already on Drive keep the old rendering until regenerated; production count not taken from this stream (production reads are refused from worktrees) | accepted: `node scripts/count-sara-am-archives.mjs --env production` gives the number; regenerating is Lutan's call |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run the count against production and decide whether any summary needs regenerating | `node scripts/count-sara-am-archives.mjs --env production` in the main checkout |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (thai-pdf-sara-am session)  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is open, for Lutan

Manual verification by: pending: Lutan to run the production count and decide on regenerating

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — happens at release

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
