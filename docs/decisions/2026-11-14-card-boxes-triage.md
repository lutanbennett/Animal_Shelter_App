# Triage of the first `check-who-does-what` reading (2026-11-14, `#t4wqp`)

Stream `card-boxes-triage`. One migration (`0378`, additive), fixture and classification changes to the check, two entries in
`FIXED_FOR_NOW`. Analysed by card and activity; roles appear only as today's transient context.

## Step zero

Own reading on dev, 2026-11-14, ~19 s run: **385 boxes, 316 obeyed, 3 wrong, 1 sticky, 4 shared, 61 inert, 9 probe faults, red.**
Identical to #1579's. **Re-own (0375):** no sign it moved anything. Every finding below has a cause in a policy or a fixture
that predates it, and no definer function read 0 rows.

## Findings

| Finding | Verdict | Evidence |
|---|---|---|
| `suppliers.directory` **read** allowed with the box at no (3 logins) | **Intended, mis-classified by the check.** Not a card fault. | `suppliers_select_perm` (0335, kept by 0338 on purpose: "every screen that has to NAME a supplier") also admits `stock.delivery`, `stock.purchasing`, `bills.general`, `bills.utilities`, `maintenance.bills`, `friends.manage`, `friends.view` and `contacts.directory` at read. The probe already declared the first seven as `sharedWith` but the check applied `sharedWith` only to a box that says **yes**. It now also proves a box that says **no**: the sharers are taken away, the box left alone, and the read must close. It did, for all three logins. `contacts.directory` was missing from the probe's list (it kept management's read open) and is added. Recorded under `databaseWider` (not shown on the grid). |
| `recurring.do_own` **sticky** | **Intended: a prerequisite, not a cache.** | `record_recurring_job()` lets a holder of `recurring.do_any` record any date, their own included (0178), and `do_any` is held through the card that carries `recurring.manage`, `do_any` and `do_own` together. Removing `do_own` leaves `do_any` open. This is `PREREQUISITES.includedByAny` in `prerequisites.ts`, which the grid already refuses and names, so no `FIXED_FOR_NOW` entry is needed (the check's `byRule`). No cache and no re-sign-in problem: the access disappears when `do_any` does. |
| Doctor `clinicRule` overlisted (17) | **EXPECTED TEST STATE. Not a fault. Do not file, do not "fix".** | Doctor is where cards are tested one at a time; while it holds them these boxes are obeyed, and the red is the proof that the Who-does-what card save works. Written into `fixed-for-now.ts` beside the entry and printed as a `NOTE:` under the failing list. Doctor's cards untouched; the check still exits red on purpose while that state stands. |

## Probe faults

- **`photos.resident_manage`**: fixture. `set_resident_profile_photo` refuses a photo not approved for the public site (0318,
  `photo.profile_not_approved`). The fixture photos were inserted and `attachments_approval_stamp` (0346) always clears approval on a
  resident photo insert. Now approved by an UPDATE after the insert. Runs.
- **`text.approve`**: fixture. `text_review_queue()` lists only public text not yet reviewed; the harness had none. The fixture
  adoption updates are now `share_publicly`. Runs.
- **`shop.manage`**: **not a fixture: a real app fault, fixed by migration `0378`.** `text_approval_stamp()` (0346) refuses an insert that
  names an approval state unless the login holds `text.approve`; `shop_links` and `shelter_friends` still defaulted the column to
  `'public_ok'`, so a plain insert counted as naming one. A login holding `shop.manage` (or `friends.manage`) without `text.approve` could not
  add a shop link or a Shelter Friend (`P0001 You do not have permission to approve public text`). Both defaults are now NULL. Nothing reads
  the column on either (`public_shop_links`, `public_shelter_friends`). Applied to dev; **production apply: next release, before deploy,
  additive**. User-visible, so a release note, card-tagged.

## What INERT means (61), and the hole it is

`INERT` = the box says **no**, the database **refuses**, and **still refuses with the box set to yes** (`check-who-does-what.mjs`, state rule).
Its comment calls it "often a missing prerequisite". It is **a hole in the instrument for the yes direction**: for these boxes the check
proves the refusal but **cannot prove that granting the box lets the action happen**, so a card that grants nothing here would pass. It
is **not** the same as a probe fault (which is counted nothing). Size: 61 boxes over 12 activities (`medical.archive`, `photos.resident_add`
and `photos.resident_publish`, `maintenance.delete`, `maintenance.progress`, `projects.publish`, `clinics.doctors`, `contacts.directory`
edit, `suppliers.directory` read, `friends.manage`, `stock.correct`, `recurring.manage`). Most refuse for **every** login, which points at the
probe needing more than the one box it flips (a second box, a fixture state), not at the cards. **Not investigated further here**; for the
planner to file: give each of those probes the extra it needs so the yes direction runs.

## Left

Nothing new accepted except the three above. 61 inert is the one residue, named. `#t4wqp`'s done-when is met: wrong and sticky settled,
faults run, doctor written down. Its title described the *open* state and is now ticked, so it reads correctly as done.

## The lesson, and what would have caught it

**A probe fault can hide a real defect.** The item says a probe fault is "indistinguishable from a box that passed". The `shop.manage` fault was
worse: it was read as a broken fixture because Admin passed it, and it was an app defect (`0378`). It hid from the check and from the first
triage alike. That is the argument for fixing a faulted probe promptly and proving *why* it faults, not assuming a fixture.
It is also a card **not fully applying its access**: the grant row for `shop.manage` existed, so `check-card-grants.mjs` (which asks
whether a card grants anything) could not see that the insert it unlocks was still refused by another guard. The check that could have
caught it is this one, `check-who-does-what.mjs`, which is exactly what the faulted probe was. No new check is proposed.
