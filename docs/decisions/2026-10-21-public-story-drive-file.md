# `is_public_drive_file` knows `public_adoption_updates` (0245)

**Decided 2026-10-21, `claude/public-story-drive-view`.**

A published success story's photo was public by a second route: the photo proxy
(`src/app/api/photos/[fileId]/route.ts`) asked `public_adoption_updates` itself, as the
caller, when `is_public_drive_file` said no. That was because the function listed eleven
views and not this one, and could never have said yes on its own: `public_resident_photos`
excludes Adopted residents (`0231`), and a story is about an adopted animal.

**What changed.** `0245` restates `is_public_drive_file` from `0210`'s body with a twelfth
`union all` over `public_adoption_updates (drive_file_id)`. Same signature, `stable`,
`security invoker`, `set search_path = public`, same grants. The proxy's second route is
removed: one function now says what is public.

**Nothing becomes public that was not.** The proxy already served exactly the rows the view
shows (ticked, approved, not Medical, resident public and alive). Asserted in
`scripts/check-public-story-drive-file.mjs`: unticked photo false, ticked true, Medical false,
a photo from an older branch still true, and untick turns it false again.

**Left alone.** The other eleven views were not audited for similar gaps. The proxy's
`isMemeTheCallerMaySee` special case is a different matter (a meme is never public) and stays.
