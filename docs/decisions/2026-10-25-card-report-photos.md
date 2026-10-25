# Card report, stream 5: photos, website and the assistant (2026-10-25)

Cards written up: `add_photos`, `approve_photos`, `assistant`, `meme_library`, `website`. Reports are in `docs/card-reports/`; the faults are in
`docs/card-access-faults.md` under "Added 2026-10-25 by `claude/card-report-photos`". Nothing was fixed, no grant was changed and no card was proposed.
The format and the generator were not touched; all five cards fitted it. `--check` now reads `21 of 29 cards written up, all well formed`.

## The three questions the brief left open, and what driving answered

1. **Can a resident's profile picture reach the public website? Yes, through approval.** A photo filed by `add_photos` against an enclosure was assigned
   and approved by `approve_photos` (one click, "Assign and approve") to a resident that was public and had no photo. It became the profile picture and was on
   the public Adopt list and page, and its file was fetchable with no sign-in, within seconds. A **Medical** photo that becomes a profile picture
   (stream 2's open question) does **not** reach the public site: not on the pages, and its file returned 404.
2. **Which card ticks an outreach photo onto the public site? `outreach_notes`, and it does not publish anything today.** The edit page of a visit that has a photo
   carries "May be shown on the website" (this contradicts stream 4's "the edit page has no photo control"). Ticked, the row records the wish, and nothing on the
   public site reads it: eight public pages and the file itself were checked with no sign-in. Unticked afterwards. The page says as much.
3. **What does `approve_photos` gate? The Shelter folder and the enclosure route, and a waiting photo is private (404 to a visitor, not the profile picture).
   Approval is real for those. It is bypassed by the `residents` card:** a login holding only that card chose Foster as the folder at upload, the photo was stamped
   approved by its own uploader, and it was on the public Adopt list and page within seconds. That is the finding of the rerun. A second one sits beside it: the
   approve card cannot press its own Approve button on a photo already waiting under a resident (the folder guard from `0152` wants `photos.resident_publish`), and
   `add_photos` cannot save a resident photo at all (`record_attachment()` from `0259` admits only `photos.resident_add`), so the pair meant to work together
   cannot finish the main path. The enclosure route is the one that works end to end.

`assistant` is blind rather than a door: with only this card it cannot name a resident or an enclosure, and its one working answer ("What is due this week?")
reports "Nothing is due, and nothing is overdue" when 7 jobs and 6 visits are past due, because it cannot read them. The recommendation in its report is about
that false answer.

## Choices worth knowing

- **Read-back before every page, as the method says.** A throw-away script in the scratchpad (not committed) read `role_cards` and `role_permissions` for each login and the counts are in the fault log.
- **Public effects were read as a visitor.** `fetch` with credentials omitted for the public pages and for the photo route, run from the signed-in tab, so what a visitor gets and not what the editor gets.
- **A pass-through is a finding, not a pass.** The `website` card's Hide looked unchanged for fifteen minutes because a hidden page streams a not-found inside an HTTP 200 on dev; I read the status and the page title instead of the body. Recorded in the method note so the next stream reads the body. The hide had worked at once.
- **Test data was set up and put back as follows.** One resident (`walk-residents`, R-5644) was set public through the service key to make the public pages meaningful, and set back to not public with no profile picture. The Foster photo and the gallery photo were removed, the page hidden and shown again, the Pet of the week restored to Markey, and the outreach tick cleared. Left on dev: the Medical photo on R-5644, a `walk-meme_library` meme with one share, and the photos filed as `walk-add_photos*`.
- **One diagnosis was proved under the login's claims.** The refusal of Approve was reproduced in a rolled-back harness through the Management API (`set local role authenticated` with the login's `sub`), which named the policy (`attachments_update_folder_guard`). The harness is not committed.
- **Cause of the add failure was read from `0259`, and the failure itself was driven** three times. That the route uploads to Drive before the save is tried is from reading the route and is marked as not driven in the report.

## Not established

- Whether "Current profile photo" and "Move to folder" on a Shelter photo are also refused by the same guard (the rule says so; Move was stopped earlier by the profile-photo message; not pressed).
- What **Discard** on an enclosure photo does (not pressed).
- Whether the stray Drive files left by failed `add_photos` saves exist (not looked for in Drive).
- The `website` Contact & settings, Donate and Projects tabs, the hero-photo replace, and the impact-figures save were looked at but not changed.
- **Edit** and **Archive** on a meme were not pressed.
- The live site's up-to-ten-minutes cache of a hide or a photo change: dev has no such cache, so it was not observed.
