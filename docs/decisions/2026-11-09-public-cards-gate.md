# 2026-11-09 — The website shows an animal only if it is adoption-ready or has a running appeal (`0347`, #7aev4)

**Ruled by Lutan, 2026-11-09 (not re-asked):** a resident not marked adoption-ready, and without an appeal running, does not appear on the website even if its images are ticked Public ok. CLAUDE.md (A3) plus the appeal override.

## Does the RFID card page count as "the website"? No.
The kennel card (`/r/[code]`, `public_resident_cards`) is what a visitor standing at the kennel sees about the animal in front of them. The 2026-09-22 decision and `check-card-taps.mjs` point 1 require it to answer for any resident, so **`public_resident_cards` is unchanged and keeps every row.** The website is the pages a visitor reaches by browsing: the enclosure page (`/e/[id]`), `/adopt/*`, `/campaigns`.

## What exposed an off-website animal (measured by reading each reader)
| reader | exposes an off-website animal? |
|---|---|
| `/r/[code]` kennel card | yes, by design (not the website) |
| `/e/[id]` via `public_enclosures` | **yes: the whole card row of everyone living there (photo, bio, temperament, translations). The one real exposure, now gated** |
| `/adopt/journey/[id]` | no: behind `public_recent_adoptions` first; the card is read only after that passes |
| `/adopt/stories`, `public_adoption_updates` | name and species only, and only for a resident that passed the adoption-updates view's own gate |
| `is_public_drive_file()` | follows the views; a card-only resident's photo stays servable because the kennel card still shows it |

## What changed
- `private.appeal_running(published, status)` is the one definition of "running": published, and status `live` or `funded` (the `appeals` check allows draft, live, funded, closed). Scalar only, no table read, so it needs no definer rights.
- `public_appeals` and `public_appeal_photos` use it. 0343 had `status <> 'draft'`, which let a **closed** appeal keep an animal public. "Funded" counts as running: the target is met but the appeal is still open until staff close it.
- `public_enclosures` lists only residents with `ready_for_adoption` or a running, text-approved appeal (same function, same `text_approval` test `public_appeals` applies).

## Found, not fixed
`public_resident_profiles` still gates on `is_public_visible`, not on adoption-ready; the two flags are not yet linked (`0318` deferred it). That is the listing's own gate, outside this item's readers. For the planner to file.

## Outstanding
Production needs `0347` applied; on production today the closed appeal "Treatment" stops keeping its animal public. The production before/after count is the planner's (query in the PR body).
