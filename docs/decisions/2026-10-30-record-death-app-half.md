# Record a death folded into Manage medical: the app half (2026-10-30)

Lutan, 2026-10-29: *"B, fold it into the medical card."* The schema half is 0282 (#1088); this is the rest. No migration here.

- **`cards.ts`** now says what 0282 says: `medical_records` bundles `placement.death` (no level, like `placement.hospital`: it is a yes/no activity, stored as 2), and `record_death` is gone from the key union, the definition and the label map. `check-card-grants.mjs` against dev: **all checks passed** (111 grant rows, 13 includes edges), where #1088 left it red on purpose.
- **Dictionaries:** the `recordDeath` tile label and the `record_death` description are removed from en and th; the Manage medical description now says it records a death. Nothing else read them.
- **Walkthrough:** regenerated. The Record a death section is gone and its open question **carried into Manage medical, step 12** (`**TODO:** Record a death … where should this write show afterwards?`). It is still unanswered and belongs to Lutan.
- **Count check:** `check-cards-count.mjs` expected forty cards; now thirty-nine.
- **Manual:** the *Recording a death* topic is keyed by the activity `placement.death`, not by a card name, so it already follows whoever holds the activity. Nothing to fold.
- **Old release note:** `releases.ts` line 181 was tagged `cards: ["residents", "record_death"]`; the text is untouched, only the dead card key is dropped from its tag because it no longer type-checks.
- **Hub comment** in `ResidentHub.tsx` named the retired card; reworded to the activity.

## Investigation handed over by #1088: edit controls for a login holding only Manage medical

Driven on dev 2026-10-30 with `dev-signin --cards medical_records`. Home shows the Manage medical tile.
- `/residents` offers: Download spreadsheet (`resident.record` read, inherited via View medical), Log immunizations (`medical.immunizations` edit), Book clinic visit (`visit.book`). No New resident, no row pencil: both are gated on `resident.register` / `resident.record` edit in `page.tsx`, which this card does not carry. **No fault.**
- A resident's hub offers Record death (`placement.death`), Send to hospital (`placement.hospital`), Add diet (`medical.diet`, which the action also asks), Log immunization, Book clinic visit, Add prescription, Log weight, Log procedure. All are activities this card carries. No Edit, Move, Foster or Adopt. **No fault found; none left ungated.** Not pressed: the writes themselves (the actions' own checks are unchanged).

## Owed

- **Release note:** owed by the release that applies 0282 to production and in which Lutan assigns Manage medical. Not written here, because 0282 is not on production (a note now would promise users something that is not live).
- Whoever held Record a death loses it until Manage medical is assigned (Settings → Who does what); Lutan chose this.
