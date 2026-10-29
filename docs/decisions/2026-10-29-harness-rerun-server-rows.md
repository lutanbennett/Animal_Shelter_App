# Harness re-run with a server up: the eighteen "S" checks (2026-10-29)

**What this answers.** The 2026-10-28 triage (`2026-10-28-harness-sweep-batch-7-triage.md`, row `S`) listed
eighteen fetch-based checks as red. They had been run with **no dev server**, so every one failed with
`ECONNREFUSED`; that was never a fair count. This re-run started `next dev` first (`preview_start` name
`dev`, port **3005**, `200` from `/` before the first check) and ran each check against the **dev
database** (`qxkmhwybjggxvsfxsxbd`). The scope is the eighteen and nothing else.

**Result: 7 were never broken; 10 were really red and are now green (repaired or restated); `phone-width` was never red, and was only sampled.** No app fault was found behind any of them; every red was the check lagging the app.

## The eighteen

| check | first run, server up | outcome | what changed |
|---|---|---|---|
| `facility-map-editor` | all ok | **Green, never broken** | none |
| `map-details` | all held | **Green, never broken** | none |
| `maintenance-bills-page` | GREEN | **Green, never broken** | none |
| `place-order-roles` | all held | **Green, never broken** | none. The name is role-shaped; it builds its own throwaway role and asks what the *cards* in it do |
| `user-theme` | held | **Green, never broken** | none |
| `who-does-what-page` | OK | **Green, never broken** | none (this is the page check, not the on-purpose-red `check-who-does-what`) |
| `residents-select-all` | all ok | **Green, never broken** | none |
| `access-requests-card` | crashed: `no role with key staff` | Removed mechanism, **restated** | the "staff get no card" block now signs in a login holding exactly `view_residents` (`giveCards`) |
| `donate-buttons` | 3 failed | Real red, **repaired** | the button text became a fixed "Give via …" phrase per way (`DonateWays.tsx`), so the check found no button by label; it now looks for the link itself |
| `contact-address-fields` | 7 failed | Removed mechanism, **restated** | signed in as the `management` role, which no longer holds contacts; now a login holding exactly the `contacts` card |
| `upcoming-visits-page` | 2 failed | Removed mechanism, **restated** | `doctor` / `public_viewer` / `management` replaced by logins holding exactly `book_clinic_visits`, exactly `view_residents`, and no role |
| `home-screens-live` | 2 failed | Removed mechanism, **restated** | "the doctor home has Appointments" asserted a page that moved to `/upcoming-visits` and a role whose cards Lutan is editing on purpose. Replaced by: a login holding exactly `book_clinic_visits` has Upcoming visits on its home; the doctor assertions are status-only |
| `medical-jobs-app` | 5 failed | Removed mechanism, **restated; two assertions retired** | signs in as a login holding exactly the four job cards (`administer_medication`, `record_weight`, `add_medical_photos`, `feed_special_diets`), not the Head of Medical role (which now also holds `view_residents`). Retired: "`resident_current_state` returns her nothing" (readable by any card that reads weight or diet, `private.works_with_residents()`, 0265) and "`attachments` returns her nothing" (rows follow the photo cards, 0276). The reasons are written beside the code |
| `page-guards-live` | 4 failed | Removed mechanism, **restated** | volunteer / Head of Medical / management logins replaced by `medical_records`, `view_medical` and `food_forecast` logins (the last holds no `resident.record`). The "volunteer is sent to the card" claims were about the retired volunteer floor and are replaced by "View medical reaches the hub or its card" |
| `residents-sort` | 48 failed | Real red, **repaired** | row links gained a `?list=` suffix (`ResidentsTable.tsx`), so the check saw 0 rows. Pattern fixed; `volunteer` login replaced by exactly `view_residents` |
| `residents-export` | crashed seeding | Real red, **repaired** | `diet_types` is the food stock now; the export reads `resident_diets → diets(name)`, so the seed writes `diets`. The `volunteer` "who and where only" block is restated: with exactly `view_residents` the file holds the record columns and **none of the four medical groups** (prescriptions, visits, diet, weight), which is what `exportScope` actually gates |
| `security-role-picker` | 4 failed, then timed out | Real red + removed mechanism | the create form now lives in an "Add a person" dialog (opened first). "Every live role, in order" compared against a fixed list; the dev project now carries about forty `Dev sign-in: …` roles that other streams left behind, so it compares against the live `roles` table and keeps the order check for the named roles only. **Retired:** sections 3 and 4 (a per-row role `<select>` in a table; changing role there). Since 0196 a login holds several roles and that control is gone |
| `phone-width` | no output in the first sweep (170 s timeout) | **Green on a sample; full run not completed** | it is ~1,700 page loads (7 roles x ~120 pages x 2 languages) and prints nothing until it ends. A full run was stopped by hand after ~85 minutes with no result. A bounded run (`--roles=admin --locales=en --pages=/clinics,/enclosures,/residents,/home`) passed: 3 pages, 184 actions measured, no sideways scroll, every action >= 44 px. **No repair was needed; the full matrix is a release-smoke-test job, not a per-PR one, and has not been re-measured here.** |

## Findings that are not the checks' to fix (filed, not fixed)

- **18 access requests are waiting on dev** (`harness-mapeditor-*@example.invalid` among them) — throwaway
  logins left with no role by an earlier run of another check. Not from this stream; named so nobody
  counts them as real requests.
- **About forty `Dev sign-in: <card>` roles sit on the dev database** (`dev-signin.mjs --cards` leaves one per
  card set). They surface in the Security create form's role picker. This is the same orphan pile the
  `check-menu-coverage` "118 orphans" reading tripped on. Nothing is broken; clearing them is
  housekeeping for whichever stream owns `dev-signin.mjs`.

## What this does not do

No migration, nothing under `src/lib/permissions/` or `supabase/migrations/`, `docs/card-access-faults.md`
untouched. The six diet harnesses, the `doctor-*` and `clinics-readonly` rows, `check-who-does-what`,
`check-menu-coverage` and `doctor-cells` were not touched and not counted. No security is keyed to anything
but a card: every restated login holds exactly named cards and Admin is used only as Admin.
