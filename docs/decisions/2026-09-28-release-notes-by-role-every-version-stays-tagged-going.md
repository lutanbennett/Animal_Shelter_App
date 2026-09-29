# 2026-09-28 — Release notes by role: every version stays, tagged going forward

- **Every release stays listed, with its number.** The item's warning was
  that releases are numbered for the whole app, so a filtered list jumping
  from 0.7.0 to 0.4.0 reads as a broken page. Of the two ways out — keep
  every version and say "nothing for you", or drop version numbers and show
  dated changes — this keeps the numbers. They are what the rest of the
  system speaks: the release mail's subject, `#v0.8.0` links (opened by
  `OpenReleaseFromHash`), the running release on System status and
  `/api/releases/current`. A vet told "you're on 0.9.0" should find 0.9.0
  on the page. So a release with nothing for the reader keeps its row, gets
  a muted "Nothing for Vet" badge beside Major and the environment, and
  opening it says its changes are for other roles, with a Show everything
  link to that release (`/releases?view=all#v0.8.0`). A line under the
  filter bar says the numbers run in order on purpose. Within a release
  the container rule from #189 applies: the notes list goes when nothing
  survives, and so does the dev-only "Not released yet" box.
- **Same filter as the manual, imported as it is.** `isForRole` from
  `src/lib/manual/filter.ts` (written for this) and `asManualRole` for the
  signed-in role; no role the manual knows shows everything, ungreyed.
  `?view=all` is a link, bookmarkable, and greys the notes outside the
  reader's role with "Not for the Vet role". No `hidden="until-found"`:
  the manual needed it because Find on page is its search; a release note
  is not something anyone searches for to learn whether it's theirs, and
  Show everything is one click away.
- **A note is a string, or `{ text, roles }`.** `ReleaseRole` repeats the
  manual's role union in `releases.ts`, which may not import (deploy.mjs
  type-strips it, the Worker bundles it). `check-test-plan.mjs` reads
  `unreleased` as text and pulled every string literal out of it, so it now
  drops `roles: [...]` first — otherwise tagging a line read as adding
  lines called "vet".
- **Tag going forward; released history stays untagged.** Untagged means
  everyone, so nothing released can vanish, and 0.0.1–0.8.0 read exactly as
  before for every role. Back-filling tags onto shipped entries is a
  judgement about history the brief said not to make silently; it is
  offered as a follow-up rather than done. Three of the pending
  `unreleased` lines are tagged (the clinic-per-vet-account line for admin
  and vet; the International adoption page and the Clear-a-date lines for
  the four shelter roles), since those are not history yet. Tag only a line
  that is plainly not for some role: a wrong tag hides it from the people
  it is for.
- **The release mail stays unfiltered and admin-only.** It goes to admins,
  who run the whole system and are the ones asked about any change, and it
  is the release's record in their inbox. Mailing other roles their slice
  would be a new feature (who opts in, how often), not part of this one.
