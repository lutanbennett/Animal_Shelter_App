# Public site: unused JavaScript (#7bd5u (a)), the last of the five

**There is no speed regression and none is claimed.** (a) was the last open item; this closes `#7bd5u`.

## What the 94 KiB / 280 KiB actually was

Read from the served HTML of `/` (`next build` + `next start`), not guessed. One chunk, **`~260 KB` raw, held the Supabase browser client**
(`@supabase/ssr` / `GoTrueClient` / realtime). It was sent to every visitor of every public page, signed in or not, because two small
client components imported it at the top of the file: `SignOutButton` (drawn by the public header and the staff header) and `ThemePicker`
(in the account menu). Both use the client **only inside a click handler**. The rest of the shared set is React, `react-dom` and Next's own
client runtime (~430 KB raw across the root files), which is not ours to split. So this was **one narrow change, not a bundle restructure.**

## Change

`SignOutButton.tsx` and `ThemePicker.tsx` now `await import("@/lib/supabase/client")` inside the press handler instead of importing it at
the top. Nothing else changed. `AppHeader.tsx`'s logo and the Shelter Friends map were not touched.

## Figures (bytes are the claim; the score is NOT)

Script bytes the home page requests, raw, same tree before and after: **1,059,455 B (16 scripts) → 799,899 B (15 scripts), -259,556 B**, and the
Supabase chunk is no longer in `/`'s HTML at all (0 references). Deterministic and independent of machine load.

**No Lighthouse score is claimed.** The machine was not quiet: CPU 58-97% over five samples before any reading (other streams were building
and the user's Chrome was open), so the "quiet" standard of #1609 could not be met, and the bracket rule (baselines within ~1.3) was not run.
Per `CLAUDE.md`, a score taken under that load is not a reading. Given a 260 KB raw (roughly 60-70 KB compressed) drop of script that
no longer parses on first load, a gain is expected but unmeasured. Nobody needs to re-measure it to close the item.

## Proof nothing broke (separate from the bytes)

Built output, signed in as the disposable dev admin, in the built-in browser, reaching the account menu by click (`requestAnimationFrame` fired):

- **Theme pick:** chose a different theme; `<html data-theme>` changed to `light`, no error shown, and the Supabase chunk was requested **at that
  press** (it was absent from the page's initial resources). Chose Dark again; default restored.
- **Sign out:** pressed Sign out in the staff header; landed on `/login`.
- Staff paths were therefore checked (the shared header is on every signed-in address). The public header's own Sign out uses the same component.
- Not driven: Thai, the adopter-account public Sign out press (same component, same import, not separately pressed).

## Left alone

The ~430 KB of React/Next runtime; legacy JS (13 KiB); render delay; photo LCP. Recorded as not wanted earlier.
