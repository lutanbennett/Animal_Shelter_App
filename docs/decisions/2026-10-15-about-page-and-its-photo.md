# 2026-10-15 — The About page: a slug, a photo column set, and a draft with gaps

**Page.** `/about` is a `site_pages` row (slug `about`) rendered by `SitePageView`, like Foster and
Volunteer. The menu's "About & contact" now goes to it, and the home page's Our story ends with
"Read more about us →". The footer is unchanged and stays the contact anchor; the About page carries
it too.

**It was not data alone.** The brief expected a seed row. Two things said otherwise: the slug check
on `site_pages` (0104) listed seven names and refused an eighth, and the photo needs columns. Both
went into a small schema PR (#649, migration 0206) that merged first, as `CLAUDE.md` asks.

**Photo.** #646's mechanism generalised without a new design: `about_photo_drive_file_id` plus the
English and Thai alt text on `site_content`, the same three columns Donate, Foster and Volunteer
have, listed in `public_site_content` and in `is_public_drive_file`. The admin's Page photos list
and `uploadPagePhoto` simply gained `about`.

**Words.** The page's starter text (a dictionary entry, shown until an admin saves a body, like
International adoption) is Appendix A.3 of `docs/public-site-review-2026-10-13.md` with every fact
the Director owes as a `[bracketed gap]`: registration number and year, who runs it, the address,
how to get here, opening days and hours, what to bring, photograph rules. No plausible placeholder
was used, because a wrong number or hours on a public page is a false statement about a charity.
The team's names and photo come from the Director through Settings, never from this repo (it is
public). The Thai starter is only headings and a gap marker; the Thai wording is hers.

**Release note.** `unreleased` got no line: the page is reachable, but until the Director fills the
gaps it would be a page of "to fill in" markers, so telling users it works now would not be true.
The note goes in whichever change closes that step.
