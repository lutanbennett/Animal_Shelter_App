# Test plan: meme-sources-app

## Header

| | |
|---|---|
| Feature | Meme maker widening, app half: source tabs, Make a meme on outreach and maintenance photos, source recorded and filterable |
| Backlog item | "Meme maker, stage 2" (ticked; project-photo button and Memes lists on a note, job or project not built) |
| Branch / worktree | `claude/meme-sources-app` @ `C:\Development\Animal_Shelter_meme-sources-app` |
| Dev server | not run: needs a signed-in session |
| PR | pending: opened after this push |
| Tested by / date | Claude, 2026-10-19 |
| Carries a migration? | no (0228 was #752) |
| Tested at SHA | ff3f92fc |

## 1. Scope and risk

- [x] One sentence: the maker gains Outreach, Maintenance jobs, Projects, Website and Upload tabs, each shown only to a login that may open that page, with the source recorded on the meme and filterable
- [x] Touched: `src/app/memes/**`, `src/lib/memes/{sources,source-server}.ts`, `src/components/MakeMemeLink.tsx`, outreach edit photos, maintenance job photos, both dictionaries, manual, releases, decision file
- [x] Roles affected: admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer
- [x] Out of scope: Make a meme on project photos; Memes list on an outreach note, job or project; upload route limits (videos-schema owns them)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with all exit codes 0

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration; 0228 was merged as #752
- [ ] Status reviewed — n/a: no migration
- [ ] Dry-run — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: existing memes have null source_kind; the library filter and page treat null as "Not recorded" (code reviewed, not run against dev)
- [ ] Harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: 0228 ships with the release already

## 4. Functional checks

- [x] Refusal logic: `sources.test.mjs` (written first) proves tab offering per permission and refusal of Medical and clinical files from every source; full suite 196 pass
- [ ] Happy path in the browser — n/a: not run, no signed-in session was available to Claude; left for manual verification
- [ ] Data persists — n/a: not run in a browser; see manual list
- [ ] Create / edit / delete — n/a: create only; see manual list
- [ ] Empty state — n/a: not run in a browser; code shows "no photos" text
- [ ] Invalid input — n/a: server refusals are covered by the unit tests; not exercised in a browser
- [ ] Boundary cases — n/a: not run in a browser

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all six tabs | all offered | not run in a browser |
| role without maintenance.jobs | maker | no Maintenance jobs tab | unit-tested only |
| role without library | /memes/make | refused by requirePermission | unchanged |

- [ ] Every role above tested — n/a: only unit-tested; browser role pass is in the manual list
- [x] A role without a source is blocked server-side: `resolveSource` checks `sourcesFor` and reads the row as the caller; createMeme calls the same function

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added
- [x] Manual updated: Memes topic has a Making a meme note
- [x] Translatable strings: added to en.ts and th.ts together
- [ ] Mobile viewport — n/a: not run; left for manual verification on a phone
- [ ] Browser console clean — n/a: not run in a browser
- [ ] Network clean — n/a: not run in a browser

## 6. Regression

- [ ] Nearest checks — n/a: the resident lightbox button still links /memes/make?photo=ID, which defaults to the Residents source; not run in a browser
- [ ] Shared file loaded from a second page — n/a: no shared module changed beyond the memes ones
- [x] Nothing merged from main during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked, with what was not built
- [x] Decision file `docs/decisions/2026-10-19-meme-sources-app.md` added
- [x] README.md still accurate
- [x] **Release notes.** `unreleased` has a new line, written for a shelter user
- [x] Commit messages say why
- [x] Claims were measured: unit test and gate output seen

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding assertions — n/a: no thresholds
- [ ] Evidence is the tool's actual output — n/a: none pasted beyond gates
- [ ] Public pages re-checked — n/a: no public page touched; memes stay private

### Deploy safety

- [ ] deploy line read and ref matches production — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] Any new secret exists in production — n/a: none added

### Migration ordering

- [ ] Migration and code that reads it in one PR — n/a: 0228 merged earlier as #752 and must be applied to production before this ships
- [ ] Production dry-run clean — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: additive
- [ ] Apply plan stated — n/a: 0228 only, with the release

### Rollback

- [ ] Rollback position stated — n/a: revert the PR; the columns can stay

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a phone: make a meme from an outreach photo and from a maintenance photo; each saves and shows "Made from a photo in" | /outreach/[id]/edit, /maintenance/[id] |
| 2 | Upload a photo from the phone, meme it, saved with Upload as its source | /memes/make?source=upload |
| 3 | A login without maintenance access sees no Maintenance jobs tab; Website tab only for website editors | /memes/make |
| 4 | Library Photo from filter, including Not recorded for old memes | /memes |
| 5 | A Medical photo cannot be reached from any tab | /memes/make |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] pending: items 1 to 5 above need a person on a phone

Manual verification by: pending: Lutan to check the five items above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handover happens at release

Result: pass with accepted defects

Release manager acknowledgement: pending
