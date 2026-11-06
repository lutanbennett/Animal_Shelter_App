# Activities no card grants: the folders card, and four rulings recorded (backlog #wdjt0)

2026-11-06, `claude/ungranted-activities-cards`. Migration `0323_project_folders_card.sql`.

## Step zero

- `maintenance.photos` is **not** granted by "no card". `cards.ts` does not list it, but the **job cards** do: `do_maintenance` holds it
  (`src/lib/permissions/jobs.ts:108`, and `0257_card_grants.sql:295`). The brief's grep read `cards.ts` only. A one-card login holding
  `do_maintenance` can already drive the new-job photo picker and the job page's Add photo and Remove controls.
  **Lutan was asked 2026-11-06 and answered: no separate card; folders card only.** Nothing was built for it.
- `projects.folders` at edit: still granted by no card. `placement.death_withdraw`, `facility.enclosures` edit: still none, on purpose (below).

## The four rulings, by activity

| activity | outcome |
|---|---|
| `projects.folders` edit | **new card `project_folders`** ("Look after project folders") |
| `maintenance.photos` | already on `do_maintenance`; **no new card** (Lutan, after the finding above) |
| `facility.enclosures` edit | **Admin-only on purpose** (Lutan, 2026-11-06) |
| `placement.death_withdraw` | **Admin-only on purpose** (Lutan, 2026-11-06) |

**Why the two stay Admin-only** (the reason the item asks to have written down): moving an enclosure's plan and withdrawing a recorded
death are rare, consequential acts that the shelter wants to remain with the administrator, not something a card should hand out by
default. `cards.ts:112` already says the death withdrawal was kept off the residents card for exactly that reason. This is not debt and
not a hard-coded-security fault: nothing is keyed on a role; the activities sit in no bundle by choice.

## Judgement: one card or two?

One card, because there is only one card. With `maintenance.photos` already carried, the question collapses. Had both been needed, two
cards would still have been right: they belong to different features (projects and maintenance) and a person who tidies folders is not
thereby someone who photographs repairs.

**What the card holds:** `projects.folders` at edit and nothing else. Not `projects.photos` and not `projects.publish`, which are
separate activities with separate controls. Edit implies read, so the card opens `/projects` on its own. Name and description are
written for a shelter worker, and the description says what it does not do. Thai is in both dictionaries and is **unreviewed**.

## Consequence for the sweeps (for `#79sqf`'s remainder)

A sweep cannot drive a control whose activity no card grants, because no one-card login can hold it. After this change that is true of
exactly two controls: the `facility.enclosures` edit controls and the `placement.death_withdraw` control. A sweep **reads** those; it does
not drive them. `maintenance.photos` and the `projects.folders` edit controls are now drivable with `--cards do_maintenance` and
`--cards project_folders`. **For the planner to file on `#79sqf`:** drop the "maintenance.photos: no card holds it" line; the sweep needs
`do_maintenance` for the new-job photo picker. (`/photos/add` asks `photos.shelter_add`, which `add_photos` holds, a different activity.)

## Driven proof (dev, one-card login `--cards project_folders`)

Home shows one tile, **Look after project folders**, opening `/projects`. `/projects` shows no "read only" note. Inside a category the
**New folder** control is drawn; it asks `projects.folders` at edit, the same activity the action and the table policies ask. The
read-only counterpart (a login without the card) was not re-driven this session.

## Release note draft (not ticked: 0318 to 0323 are pending on production)

`n/a: needs 0323 applied to production`. Wording for when it is: "A new permission, Look after project folders, lets someone add,
rename, move and delete project folders and write their stories, without being able to add photos or publish."

## Not done, said plainly

Nothing checks the mirror of `role-cards-coverage` (an activity held by no card). That is the item's own suggestion and remains
backlog material, for the planner to file.
