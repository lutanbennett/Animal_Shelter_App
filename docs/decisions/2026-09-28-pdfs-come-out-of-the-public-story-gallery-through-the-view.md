# 2026-09-28 — PDFs come out of the public story gallery through the view, not the page (`0109`)

Noticed while building the file-type icon (`claude/file-type-icon`): project
uploads accept PDFs, and `public_project_photos` (0042, last redefined in
0056) returned every attachment in a public project folder with no type
filter, so a PDF filed there would reach `/our-work/[id]` as a broken
`next/image`. Not reproduced — checked on dev (`qxkmhwybjggxvsfxsxbd`)
2026-09-28, no public project folder holds a PDF or any other non-image
attachment today.

- **Fixed in the view, not `StoryGallery.tsx` / `ThumbnailStrip.tsx`.** The
  page-side fix (skip non-images when rendering) would have left the file
  reachable through `is_public_drive_file()` (0084), which asks
  `public_project_photos` directly. That function is the photo proxy's
  question for a signed-out visitor, so a page-only fix would have kept
  serving a PDF filed in a public folder to anyone with its link — the more
  important half, closed for free by fixing the one place both read. Same
  pattern as 0101 and 0103, which closed the resident gallery and the
  profile photo separately after finding the gap between them; here there
  was only one place to close, so one migration does it.
- **The filter is `file_name ~* '\.(jpe?g|png|webp|heic|heif|gif)$'`** — the
  same extensions `src/lib/uploads/file-kind.ts` calls `"image"` — rather
  than a denylist of `.pdf`, so any other non-image type the upload route
  might later accept is excluded by default instead of needing its own fix.
- **The trap 0094/0101/0103 document for `private.resident_current_state`
  reaches `private.approved_translations` too.** `public_project_photos`
  calls it; re-creating the view from 0056's unqualified text (written
  before 0082 moved the function to `private`) would have failed outright
  rather than silently binding to a gate, since nothing of that name is
  left in `public`. Re-created from the live definition
  (`pg_get_viewdef` on dev), confirmed to match before applying.
- **`scripts/check-public-views.mjs` gained a matching case** — a non-image
  attachment in a public project folder must read `false` from
  `is_public_drive_file()` — mirroring the medical-photo case 0101 added.
  It skips today, same as that one sometimes does on production, for lack of
  a real row to ask about; not a new instance of that gap, since dev has
  none either.
