# Feature test plan

## Header

| | |
|---|---|
| Feature | acceptance-checklist-pdf: the printable A4 sign-off edition of the acceptance checklist |
| Backlog item | `docs/backlog.md` → "Acceptance checklist: the printable sign-off edition (A4 PDF) and the pre-run agreements." (PDF half only) |
| Branch / worktree | `claude/acceptance-checklist-pdf` @ `C:\Development\Animal_Shelter_acceptance-checklist-pdf` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` (not used: nothing in the app changed) |
| PR | see the PR this file is in |
| Tested by / date | Claude (acceptance-checklist-pdf session), 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | c3b70f92 (code, after `sync`); the next commit adds one case to `check-acceptance-pdf.mjs` (re-run, all pass; eslint on the three scripts exit 0) and this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `node scripts/acceptance-matrix.mjs --pdf <file>` prints the checklist as an A4 PDF (cover, matrix, one sheet per role, failures list, Director's sign-off, Thai font), drawn from the same data as the Markdown. The item's other half, the pre-run agreements, is Lutan's and the Director's and was put to Lutan as questions, not decided
- [x] Files/areas touched listed: `scripts/acceptance-matrix.mjs` (builds a `doc` object; Markdown drawn from it; new `--pdf`, `--json`), `scripts/lib/acceptance-matrix-pdf.mjs` (new), `scripts/check-acceptance-pdf.mjs` (new), `docs/backlog.md` (status note), `docs/decisions/2026-10-09-acceptance-checklist-pdf.md`
- [x] Roles affected identified: none in the app. The PDF lists every role the generator emits; no role name is written in the renderer
- [x] Out of scope written down: Thai-language steps (wait for the Thai manual); who tests which role, the per-role accounts, the blocker rule and where a signed copy is kept (Lutan and the Director); role names themselves (`vet-to-doctor-rename` owns them)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in the 0.23.0 release record; no conflict)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 331s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, and the generator reads repo files, not the database
- [ ] Constraints exercised in a rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `--pdf` on the real checklist wrote a 58-page A4 PDF; pages 1, 2, 3, 7, 8, 9, 17, 51 and 58 rasterised with Windows' PDF renderer and looked at: cover portrait, matrix landscape with role columns, Admin sheet with tester line, intro, four EN/ไทย boxes per row, dashes where a device does not apply, boundaries page with signature line, ruled failures page, sign-off page with one row per role and the Director's line
- [x] Markdown unchanged: full output and `--role staff` diffed before and after the refactor, byte-identical; `--check` still passes (74 topics → 107 activities)
- [x] **ำ drops no letters** (`node scripts/check-acceptance-pdf.mjs`, section B): Thai with ำ in a role name, a step, an expected result and a boundary line, each ending ")", read back out with `pdftotext`: all present. **Negative control:** with `thaiPdfChildren()` replaced by a pass-through, three of the four lost their last character (the step with two ำ survived even unfixed, so it is not evidence on its own), and the check failed 4 lines
- [x] **Roles are data** (section C): a role the generator never heard of (Thai name with ำ) and an existing role renamed to a longer name ("Doctor (partner clinic)") each got a sheet and a sign-off row; the old name was gone from headings. No renderer change
- [x] All 107 matrix rows, every role's sheet, the failures heading and the Director's line found in the real PDF's text (section A)
- [ ] Data persists — n/a: nothing is saved; the script writes a file
- [ ] Create / edit / delete — n/a: no records
- [x] Empty state renders sensibly: a role with no "does", "must not" or boundary rows still gets its sheet page (`check-acceptance-pdf.mjs` section C renders one); in the real data the public viewer and visitor sheets (no "must not" table) render with their does and boundary tables only
- [x] Invalid input is rejected with a readable message: a character the font cannot draw stops the render naming the character, its code point and the text it is in. Found for real: "☰" printed as an overprinted "0" on the first render; "☰" and "→" are now substituted with words, and the check-glyph path is what will stop the next one
- [x] Boundary cases checked: long role name ("Signed-out visitor") wraps in its matrix column header; a long expected-result cell (R010, R021) grows its row without overlap; tables spilling across pages repeat their column headings (Admin pages 7–15)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | nothing in the app changed | n/a |
| management | n/a | nothing in the app changed | n/a |
| staff | n/a | nothing in the app changed | n/a |
| vet | n/a | nothing in the app changed | n/a |
| volunteer | n/a | nothing in the app changed | n/a |
| signed out | n/a | nothing in the app changed | n/a |

- [ ] Every role above tested — n/a: a local script; no route, page or permission changed
- [ ] Server-side block — n/a: nothing is served

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual updated — n/a: no app behaviour changed; the manual is an input to this script, not something it changes
- [ ] Translatable strings — n/a: the PDF's words are the generator's English, as the Markdown's are; Thai steps wait on the Thai manual
- [ ] Mobile viewport — n/a: no page; the output is a printed A4 document
- [ ] Browser console — n/a: no page
- [ ] Network — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work: the Markdown edition (byte-identical diff), `--check` (what `npm run lint` runs, and lint=0 in gates), `--help` (line range updated for the two new usage lines, output read)
- [x] Shared file touched: none was edited, but `src/lib/archive/fonts/` is now *imported* by a script; it was imported for real by every render above, and the build (which compiles the manual and receipt PDFs that also import it) passed
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates and the PDF check re-run after the sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: only half the item is done; a status note says the PDF is built and the agreements and Thai steps are waiting, as the brief asked. Other open items searched (`acceptance`, `fable-dry-run`, `manual-pdf`, `fonts`): the Fable dry run does not need this PDF and was not ticked; nothing else closed
- [x] Non-obvious design choices added as `docs/decisions/2026-10-09-acceptance-checklist-pdf.md`
- [x] `README.md` still accurate: it does not mention the acceptance matrix
- [ ] **Release notes.** n/a: a script Lutan runs to print a testing document; no shelter user sees anything change in the app
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The negative-control result was written as measured, including the one ำ line that survived unfixed, rather than as "the check catches it"

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — n/a: a local script; nothing is deployed
- [ ] Deployed SHA matches — n/a: nothing is deployed

### On the deployed build

- [ ] Deployed to test — n/a: nothing is deployed
- [ ] Smoke-tested on test — n/a: nothing is deployed
- [ ] Timezone behaviour — n/a: no dates computed
- [ ] Boundary or banding change — n/a: none
- [x] Evidence pasted into this plan is the tool's actual output, unedited (the gates lines)
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] Production ref read — n/a: nothing is deployed
- [ ] strip-baked-env seen — n/a: nothing is deployed
- [ ] New secret — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR. Nothing deployed reads these files; no schema

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | "☰" (and "→") are not in Noto Sans Thai; "the ☰ button" printed as a "0" over the next word | fixed: substituted with words, and any other missing glyph stops the render by name |
| 2 | minor | Column headings did not repeat on continuation pages, so the four boxes were unlabelled from a sheet's second page | fixed: one page run per table, headings fixed to each page |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Print a few pages and check the boxes and ruled lines are big enough to write in by hand | `Acceptance checklist - sign-off edition (draft, 0.23.0).pdf` on the Desktop |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (acceptance-checklist-pdf session)  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is open, for Lutan

Manual verification by: pending: Lutan to print a few pages and try writing in the boxes

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — happens at release

Result: pass

Release manager acknowledgement: pending  Date: —
