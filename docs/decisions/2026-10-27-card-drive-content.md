# Card drive: `translations`, `website_photos` and `website` (2026-10-27)

Three cards driven on dev, each as a login holding only that card, at 375 px. Nothing was fixed and no card proposed (Lutan: the log is
reviewed as a set, and fixes follow it). The rows are under `## Added 2026-10-27 by claude/card-drive-content` in
`docs/card-access-faults.md`.

## Step zero: was each pass needed?

The brief said to prove it before driving. Evidence, side by side:

| card | last driven | what changed it since | verdict |
|---|---|---|---|
| `translations` | never (no mention in the log) | new in `0271`, applied to production 2026-10-27 12:06 | **needed** |
| `website_photos` | never (no mention in the log) | new in `0268` | **needed** |
| `website` | 2026-10-25, `claude/card-report-photos`, 7 rows | **the app half, `e53ccf0c`, 2026-10-26 22:52**; no `026*`/`027*` migration names it | **needed**: the pass expired on code, not on a migration |

The migration grep (`'translations'`, `'website_photos'`, `'website'` over `supabase/migrations/02*.sql`) matched `0209`, `0225`, `0228`,
`0255`, `0257`, `0268` and `0271`. Only `0268` and `0271` are after the 2026-10-25 pass, and neither touches `website`'s grants.

## The two questions, per card

**`translations` (5 steps).** Enough to finish the job: **yes.** Home shows one tile; the page loads; a Thai description and a Thai long text
were saved and read back; the Website count fell 14, 13, 12. Nothing more than the label: the page offers Save & approve on public-site
text and Remove translation on approved Thai, which the label covers ("Translate the website"), so it is a judgement row, not pressed on
existing text. **One thing that does not work:** every Open record link (117 in the All view; all seven kinds tried) lands on
`/no-access`, because the card holds none of the pages it points to.

**`website_photos` (5 steps).** Enough to finish the job: **partly.** Add (with a required English description), move and remove (with a
confirm) all work. **It cannot set the hero photo**, which is the known gap; `0274` in `claude/card-review-2-schema` is the fix in flight
and the row says so rather than treating it as new. The card holds `website.content` at read only, but shows none of it, so step 2 has
nothing to look at (walkthrough wording row).

**`website` (4 steps).** Enough to finish the job: **yes for the content** (a Contact and settings field saved, read back after reload,
cleared). **The photo strip is no longer manageable from this card:** its Gallery tab lists the photos with no add, move or remove,
because those actions ask `website.gallery`, the other card's. That is correct by the card split and is the one visible effect of the app
half on this card; the row asks only that the tab say why it is bare.

## A finding that is not about the cards

A direct load of `/admin/website?tab=contact` leaves the Contact form unwired on dev: Save sends it as a plain link, with every field in the
address bar, and saves nothing. Reached by clicking the tab from the Home page tab, the same Save works. Reproduced twice. **Only the Contact
tab and only the dev server were tried**, so whether production or the other tabs behave the same is not established. It is in the log because
it stopped a step, not because a card is at fault.

## What I did to my own evidence

The console error on the Translations page (a hydration mismatch) was caused by test ids I added to two elements, and is not a finding. The
gallery photo I added was removed; the Thai registration text I set was cleared; the two Thai translations I saved on the Translations page
(`walk-translations` on a website photo description and on "DonorBox") were **left in place**, so dev's Website count is now 12 missing,
not 14. **The three one-card logins were not removed**: `dev-signin.mjs --remove --cards translations,website_photos,website` answered
"nothing to remove" (I did not establish why; `--remove` alone refuses without a role or `all`, and `all` would sign other streams out).

## Not done, said plainly

- The public website was not fetched, so none of the writes was seen from a reader's side.
- The hero's Replace photo and Remove were seen offered to `website` and **not pressed**: they upload to, or delete from, Drive.
- The database refusal for the hero under `website_photos` was not reproduced under the login's claims; the missing control and
  `actions.ts:450`/`:495` are what the row rests on.
- Production was not read from this worktree. Who holds `translations` there is not established.
- `translations` Open record links were each opened once per kind, not all 117.

## The parent item

It covers nineteen cards and this stream drove three: **`translations`, `website_photos`, `website`. Sixteen remain.** The box is left open
for the planner, per the brief.

## Release note

`n/a`: a recording pass; nothing a user sees changed. `src/lib/releases.ts` is untouched.
