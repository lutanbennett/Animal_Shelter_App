# Reads that failed looked like empty lists (silent-empty-reads)

2026-10-11. No migration.

## The count

The item said eight files, "a lower bound", 64 files in all. Counted by `grep` on `data ?? []`
(Supabase reads, not every `?? []`): **97 files** use it, **10 never mention `error`**: the item's
eight (`order.ts` does mention it, in a comment, so it was never really in the set) plus
`clinics/doctors.ts`, `home/roles.ts`, `residents/public.ts` and `site/pages.ts`. Files that check
some queries and not others were not swept (see the backlog item filed for them).

## The shape

The codebase's existing convention is `if (result.error) throw new Error(...)` (clinics, contacts,
who-does-what). Followed, not replaced. Message names the place and the read; a page throws to the
error boundary, an export throws to a failed download. Each site carries a comment saying why.

## Judged file by file (empty = a wrong answer that looks right?)

- **Fixed (throw):** `residents/export.ts` (blank weight/diet/visit columns look like "none
  recorded"; one `rowsOf` helper), `residents/list-view.ts` (zones/enclosures: chips vanish and
  `?zone=` links drop as stale; microchip ids: "no microchip" would match everyone),
  `enclosures/details.ts` (an enclosure shown with nobody in it), `admin/website/page.tsx` (an
  editor showing empty lists invites re-entering what exists), `home/roles.ts` (no roles to preview).
- **Left alone, on purpose:** `enclosures/order.ts` (already documented: a failed read falls back to
  name order, which is cosmetic), `clinics/doctors.ts` (suggestions only; the field stays free text),
  `residents/public.ts` similar animals (a suggestion strip), `site/pages.ts` (falls back to built-in
  copy), `app/page.tsx` and `adopt/[id]/page.tsx` photos (decorative gallery; page is otherwise whole),
  and `residents/page.tsx` where the main list already reads `error`.

## Hazard for release

A read that returned `[]` and now throws will surface a failure that was invisible. If one of these
queries is quietly broken on production, a page that looked empty starts showing an error. That is
the point of the change.
