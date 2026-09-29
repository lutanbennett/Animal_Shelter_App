# 2026-09-27 — The manual opens on the reader's role; the rest is hidden until found

- **Filtered by default, by the topic's existing `roles`.** `/manual` reads
  the signed-in role and keeps a topic when it has no `roles` (everyone) or
  lists that role (`src/lib/manual/filter.ts`, `isForRole`). No role the
  manual knows — which cannot happen inside the app today — shows
  everything, ungreyed. A section none of whose topics survive is hidden
  with its intro, because the intros describe whole sections ("Mostly for
  the management and admin roles…").
- **Tucked away, not removed: `hidden="until-found"`.** The item's point was
  that "can I do this?" deserves a greyed answer rather than an empty search.
  The manual has no search box of its own; its search is the browser's Find
  on page, and a topic left out of the HTML is one Find cannot reach. So the
  other roles' topics are still rendered, hidden until found: Find on page
  and an `#anchor` link reveal the match, greyed and labelled "Not part of
  the Vet role". The contents list leaves them out. React 19.2 writes
  `hidden` only as a boolean, so the server renders plain `hidden` and
  `UntilFound.tsx` upgrades it after hydration where the browser supports
  it; elsewhere they stay plainly hidden and an anchor into one is revealed
  by hand. Show everything (`?view=all`, a link, so it is bookmarkable and
  needs no client state) renders every topic, greying the ones outside the
  reader's role, in the contents list too.
- **Tags corrected where the filter exposed them.** A tag used to be a
  badge; now it decides who reads the topic, so a wrong one hides a page
  from the people who use it. Seeing what's assigned and recurring jobs are
  tagged for the four shelter roles, since a vet is given neither (#181) and
  their My tasks is empty; a new vet-only topic says so and points at the
  vet visits. The maintenance board gains `volunteer`, who can read it
  (`canReadMaintenance`) and whose My tasks links to it — without it the
  whole Maintenance section vanished for volunteers. The Management intro
  now says stocktake and deliveries are there for staff and volunteers.
- **`isForRole` is written for more than the manual.** Release notes
  segmented by role (backlog order 12) is the same filter applied to
  `src/lib/releases.ts`; it can import it as it is.
