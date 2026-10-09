# Temple and community dogs: what one "dog helped" means, and the schema behind it

*2026-10-09 · `community-dogs-schema` · migration `0169_community_dogs.sql`*

## The question

The public website's third impact figure, "temple and community dogs supported",
had nothing behind it. A dog the shelter feeds, treats or sterilises at a temple
never becomes a resident. Before anything was built, the options paper
(`docs/design/community-dogs.md`, 2026-10-07) asked the Director eight questions.
She answered all eight on the scanned sheet "Answers for what we need 081026"
(2026-10-08, on Lutan's Desktop\LCA).

## Her answers

| # | Question | Her answer | What the schema does |
|---|---|---|---|
| 1 | Which option? | **Option 2**: a short note after each outing | One row per outing in `community_dog_outings` |
| 2 | Temple and community: one number or two? | **One number**, each note says temple or village | The note names a place, and `community_places.kind` is `temple` or `village`. The figure can be split later without losing anything |
| 3 | What counts as helped? | **All five**: fed, treated, sterilised, vaccinated, rehomed from a temple. Sterilised also counts towards the web totals | Five boolean ticks, at least one required |
| 4 | The same dog helped again? | **Counted again** | No dog identity. The figure is `sum(dog_count)`, never a count of distinct dogs. The baseline row's label says "Dogs helped at our outreach visits" so the public wording does not suggest distinct animals |
| 5 | Who writes the note? | **"Management for now — can this be an option to change later in Settings"** | A permission cell, `community.outings`, held by Management. Every policy asks the cell, so changing the answer needs no migration |
| 6 | Photos? | **Yes**, optional, never public unless ticked | `community_outing_photos`, `is_public` defaults false |
| 7 | Starting number and date | "Can this be set in Settings?" Yes, but the number itself is **still owed** | An empty `community_dogs` row in `impact_baselines` (`0156`). It is hidden from the public until both the number and the date are entered |
| 8 | Do temple sterilisations count in both figures? | **"All should count"**: both | `villages_sterilised` now has a live count, read from the same outing rows |

Answers 5 and 7 differ from what the paper suggested. They are the ones built here.

## Choices made in building it

**Who may write is a cell, not a role (q5).** The paper suggested "any staff".
She said Management, *and* asked for it to be changeable in Settings. In this
app, "a role may do X, changeable in Settings" is exactly what a cell in
`role_permissions` is (`docs/roles-and-permissions.md` §4). So no policy names
Management. Today's answer is one row, `(management, community.outings, 2)`.
The rolled-back check proves that giving staff the same row is all it takes. No
Settings → Roles grid exists yet (custom roles are parked), so the batch-81
feature adds a small control that writes this one cell. `role_permissions`
already allows exactly that: Admin, at aal2. The cell is kind `level`: Edit
writes, corrects and removes a note, its place and its photos (A8, as
`adoption_updates` does), and Read sees them. Its area is `projects`, beside the
sterilisation drives, because outreach is project-shaped work. Sort is 59, and
`donation.receipt` (`0168`, folded into the same PR) is 60.

**Sterilised is a count as well as a tick (q3, q8).** A tick alone cannot feed a
sterilisations figure: an outing that feeds twenty dogs and sterilises three
would add twenty. So a ticked note also records `sterilised_count`, from 1 up to
`dog_count`, and an unticked note has none. The constraint spells out
`sterilised_count is not null`, because a check that evaluates to NULL passes.
The first draft missed this, and the rollback check caught a ticked note with no
count getting through. The other ticks stay ticks. Nothing asked for a separate
count of dogs vaccinated or rehomed, and adding one later is additive.

**The temple/village kind lives on the place, not on each note (q2).** The
outcome she asked for is that every note can be split. A note must name a place
(`place_id not null`), and the place carries the kind. A place entered with the
wrong kind is then corrected once, and every note follows. Copying the kind onto
each note would allow a temple's notes to disagree with each other.

**Places grow from the form and are never deleted.** "Picked from a list that
grows" (the paper): whoever may write a note may add a place. A live name is
unique, ignoring case and surrounding spaces. A place is retired with
`archived_at`, and there is no delete grant, because notes point at it.

**Photos get their own table, not a new `attachment_owner_type`.** This is the
same shape as `maintenance_photos` and `project_photos`. An enum value would need
its own migration file (`docs/decisions` on enum migrations: add-value and use
cannot share the runner's per-file transaction) and a sixth branch in every
`attachments` policy. "Never public unless ticked" holds twice over today: anon
has no grant on the table, and `is_public_drive_file()` (`0084`) does not serve
these files through the photo proxy. Showing ticked photos publicly is future
work: a public view plus that function.

**The live count is strictly after the baseline date (q7)**, as `animals_rehomed`
counts placements (`docs/decisions/2026-10-07-impact-baselines.md`). `outing_on`
is already a shelter day (a `date`, defaulting to today in Asia/Bangkok), so no
`shelter_date()` conversion is needed. A note dated on the baseline day falls
inside the baseline and is never counted twice. The check asserts 100 + 5 = 105
with a 7-dog note on the baseline day excluded.

**What this changes publicly today: nothing.** The `community_dogs` row is empty,
and no outing exists. Once outings are recorded, `villages_sterilised` (if its
baseline has been entered) grows by their sterilised counts after its date.
That is her q8 answer, not a side effect.

## Still owed

- **From the Director:** the starting number and the date it is true up to.
- **Batch 81 (`community-dogs`):** the phone form, the Settings control for the
  cell, the public tile(s), copying her scanned sheet into `docs/roles/`, and
  having the paper's Thai wording checked by a Thai reader, as she asked.
