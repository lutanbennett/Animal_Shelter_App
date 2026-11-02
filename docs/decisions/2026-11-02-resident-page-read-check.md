# The resident hub states the activity it needs for the hashtag links

**Page:** `/residents/[id]` (`src/app/residents/[id]/page.tsx`), the block loading `loadNoteTags` and
`loadMentions`. Established by reading the file: #1197 left a comment there, "No page-level check on purpose", and
`MentionedIn.tsx` is correctly un-gated (it draws only what the page hands it and has no action). The enclosing
`requireFullResident()` gates the page itself but states no activity, so the two link reads leaned on RLS alone.

**Change:** `can(perms, "resident.record", "read")` now decides whether the page loads the links at all; without it the
page passes empty maps. The pinned entry for `/residents/[id]` in `scripts/check-permission-catalogue.mjs` gained
`"resident.record:read"`. The check reads levels separately (`resident.record` there was the edit-level
`canEditResident`), so the pin did have to change, as #1197 said.

**Not changed:** the `resident_note_tags` policies, `requireFullResident`, and every other check. This is intent made
visible, not protection; nobody's access changes, because the policies already asked the same activity.

**Other pins (deliverable 5):** the check compares each page's pin to what its body asks as an exact set, so a pin
that disagrees with its page fails; none does. Nothing found to file.
