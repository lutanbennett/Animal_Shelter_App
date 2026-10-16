# Weigh these first: the app half, and the access it deliberately does not take

2026-10-16, `claude/weigh-first-app`. The screen half of the backlog item Lutan asked for on
2026-10-15: Record Weight opens on the residents a vet saw yesterday or today with no weight since,
and everyone else below by enclosure. The schema half shipped in `0207`.

## The page reads `weigh_first_visits()` and nothing else about visits

The Head of Medical is this tile's main user, and she cannot open a resident's record or read
`clinic_visits` (`0134`). That is the whole reason `/medical/weight` exists as its own page rather
than as a card on the resident hub, and it is the thing this change could most easily have broken.

So `src/lib/medical/weigh-first.ts` calls `weigh_first_visits()` — the `security definer` function
of `0207`, returning resident id, the visit's instant and the clinic's name for non-cancelled,
non-archived visits yesterday or today — and reads no visit data by any other route. There is no
join to `clinic_visits` for the clinic name, no view added, and **no row of `role_permissions`,
`role_extras` or any card bundle was touched.** Nothing needed one, and the point of writing this
down is that the next session asked to put more on this page knows that widening her cells is the
failure mode here, not a shortcut.

Two consequences worth stating, because they look like omissions:

- **The weight comparison is done in TypeScript, not in the function.** `weight` is a table she
  *can* read (its policy asks `medical.weight`), so pushing the comparison into a definer function
  would buy no access she lacks and would hide the rule in SQL. The page reads `weight` for the
  candidates it has and compares dates itself.
- **The visits are matched against the picker's own list.** `loadWeighFirst` takes the
  `resident_who_and_where` rows the picker already loaded and drops any visit whose resident is not
  among them. So a Deceased or Adopted resident, or one a login may not see, stays off the list
  without this file deciding who may be seen — the view keeps that job. It also means the second
  read costs nothing extra.

Tapping a row opens `?resident=`, the weight form, exactly as a picker tile does. There is no link
to the visit and none to the resident's hub, and there must not be: she cannot open either.

## The latest visit is the one tested

A resident can have two visits in the window. Each visit wants a weight dated on or after its own
day, so the **latest** visit is the hardest of them to satisfy: if it is met, every earlier one is
too. `loadWeighFirst` therefore keeps one candidate per resident, the latest, and tests that. This
is also what the row shows, which is what anyone would expect — the reason you are being asked to
weigh the animal is the most recent time a vet saw it.

Order is oldest visit first, so yesterday's come before today's: the longest wait is at the top of
a list you are working down.

## Bangkok dates, and the one line where this breaks

A visit at 01:00 Bangkok is **today** and the *previous day* in UTC, so the day of a visit is
`todayIso(new Date(visit_at))` — the shelter-date helper — and never the ISO string's own first ten
characters, which would be yesterday. `weight.date` is already a shelter calendar day, so the
comparison is a plain string compare once both sides are shelter dates. The function in `0207` does
the same test in SQL through `shelter_time_zone()`, so the two halves agree about which day a visit
is on.

The time shown in a row comes from `shelterTime()` (`src/lib/clinics/shelter-visits.ts`), not from
`formatDateTime()`: `formatDateTime` reads its parts in the *runtime's* zone, so on Cloudflare (UTC)
it would print 09:30 as 02:30. That is a trap in `src/lib/format.ts` worth knowing about, and this
is the second feature to meet it.

## Everyone by enclosure was mostly already built

The item asks for the picker to be grouped by zone then enclosure in the enclosure page's order,
with the search box kept at the top. `ResidentPicker` has done all of that since it was written —
it sorts through `loadPlaceOrder()` and groups with `groupByPlace()`. The item was written from the
tile's behaviour, not from the component, so this part needed checking rather than building, and the
only genuinely missing piece was the off-site group.

So `groupByPlace()` now puts anyone off site — `residentPlace(status) === "external"`, which is
Hospitalised, Fostered and the external zones — in **one group at the end**, headed "Away from the
shelter", keeping their place as a sub-heading inside it. Previously they fell wherever their
pseudo-zone sorted. They are still in the shelter's care but a keeper walking the site will not find
them, so they do not belong among the enclosures being walked.

`PickerZone` gained a `kind` of `"zone" | "nowhere" | "offSite"`, because `zone: null` already meant
"no enclosure on record" and the two groups read differently. **This changes `/photos/add` too**,
which shares the picker: the same residents move to the same group there. That is the same
improvement for the same reason, and leaving the two pickers grouping differently would have been
worse than changing both.

## "Weigh these first" sits in the picker's `before` slot

The picker already has a `before` slot, documented as "shown under the search, above the list". The
weigh-first section and the "Everyone by enclosure" heading go there, so the search box stays at the
very top where the item asks for it, the urgent list is the first content under it, and
`ResidentPicker` needed no new prop for the layout.

While a search is running the weigh-first list is filtered by the same query, and when nothing in it
matches the section renders **nothing** rather than its "nobody is waiting" line — that line would
be a lie about the shelter when it is really a statement about the search.

## No migration, and nothing left outstanding

This stream carried no migration and wrote none; `0207` had everything the screen needed. Nothing
here waits on a deploy or a hand edit, so the release note is written as shipped and §7 is ticked.
