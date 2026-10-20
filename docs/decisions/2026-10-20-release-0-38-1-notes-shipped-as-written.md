# `0.38.1`'s two half-true release notes ship as written, on Lutan's call (2026-10-20)

Recorded so that nobody "fixes" this later, and nobody re-raises it as an open
question. It is a decision, not an oversight.

## What was raised

The cut was held at the opening message with two of the four notes flagged under
`docs/decisions/2026-10-11-release-note-truth-rule.md`, which says a note must
not promise a user something that still needs an outstanding manual step:

1. **The vet-calendar note** — *"Vet visits in the shelter calendar now sync
   back … and every admin is emailed."* **Production has no calendar token.**
   `calendarConfigured()` in `src/lib/clinics/calendar-sync.ts` needs
   `GOOGLE_CALENDAR_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` and the OAuth pair; the
   backlog records Lutan's own ordering as *"build and test the TWO-WAY
   calendar, then the production token (TBA, his), then share the calendar with
   the Director"*. So on production the poll is dormant and nothing syncs back.
   By the letter of the truth rule this note belonged in whichever PR closes the
   token step.

2. **The desexing-drives note** — it describes *"a new Services menu on the
   website"* and *"a form to sign up"*. `PUBLIC_SITE` is `locked` on both
   environments, so no anonymous visitor reaches `/services/desexing` at all;
   what is genuinely usable today is the Management half.

## The decision

**Lutan, 2026-10-20: ship both as written.** Asked as two separate questions,
each with the alternative (hold the note / reword to the Management half) and
with holding recommended. He chose to ship both unchanged.

## Why this is not the `#518` mistake, and what the difference rests on

`#518`'s false note (`0.25.0`) **was mailed to every admin**. This release is
**minor**, which is the whole of the difference: `majorReleasesSince("0.38.0")`
returns `[]`, no mail is sent, and both notes appear on `/releases` for someone
who goes and looks. A note on a page that overstates what production can do
today costs a reader a moment's confusion; the same note in an inbox is an
announcement nobody asked for and cannot retract.

That is the reasoning, and it is worth stating plainly because **it does not
transfer to a major release.** If either ability is still unconfigured when the
next major is cut, the question is live again — the notes are by then already
released history and are not re-mailed, but the same shape of note written for a
major must not ship while its step is outstanding.

## What this does NOT change

- **The truth rule stands**, unamended. This is one release manager's release
  overriding it on the owner's explicit instruction, recorded in the open, not a
  new general practice. Do not cite this file as precedent for ticking a release-notes
  line in a feature PR whose step is outstanding — `scripts/check-test-plan.mjs`
  still holds that line, and should.
- **Nothing was reworded, so nothing is lost.** Both notes carried across
  byte-identical with their role tags, which the cut's mechanical verification
  asserted.
- **The production calendar token is still outstanding and still his.** It is on
  the backlog in his stated order, ahead of sharing the calendar with the
  Director. This release does not close it and does not claim to.
- **The public site is still locked on both environments.** The desexing public
  page becomes reachable at the cutover, not here.
