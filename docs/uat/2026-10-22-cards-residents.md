# Card walkthrough, 2026-10-22: `residents`, `view_residents`, `my_tasks`

Run on dev (port 3005), at 375 px, one throwaway login per card (`dev-signin.mjs --cards <key>`, aal1).
Branch `claude/cards-run-residents`. Logins and card roles removed afterwards (`--remove`).

## Summary

| card | result |
|---|---|
| `view_residents` | **pass** (4 of 4 steps) |
| `my_tasks` | **pass with a gap**: opens and refuses correctly; the one write step could not be run (no job to act on) |
| `residents` | **FAIL**, and **mostly blocked by the sign-in script**, not the card (finding A). Finding B is a genuine card gap. |

## Findings

**A. The throwaway login is a "who and where only" login, so the resident hub never opens (script, not card).**
`scripts/dev-signin.mjs:97` creates the card role with `scope_residents: "who_and_where"`.
`on_volunteer_floor()` (0196) is then true, and `src/app/residents/[id]/page.tsx:39` redirects every
resident page to the name card `/r/<id>`. That page has no microchip, news, move, hospital, rehome,
death or photo controls. So steps 2 and 4–12 of `residents` cannot be reached by any card login the
script makes. Real roles that hold this card (Management, Director) have scope `all`, so this says
nothing about the card itself. It affects every run stream that walks a card with a resident page
(`medical_records`, `book_clinic_visits`, ...). Also: `ignoreDuplicates: true` means an existing
throwaway role would not be corrected by changing the line alone.

**B. Register a resident fails for a login holding only the `residents` card (card gap).**
Step 3: all six intake steps filled in, "Register resident" gives *Something went wrong, reference
`ad4b0760`*. Server log: `P0001 Unassigned pseudo-enclosure not found — check the Lifecycle zone seed
data`. Cause: `record_intake` (0242) is `security invoker` and looks up the Lifecycle/Unassigned
enclosure; `zones` and `enclosures` are readable only with `facility.enclosures:read`
(0145 lines 90–101), which the `residents` card does not include. The Arrival step's zone list was
also empty for the same reason. The seed data is fine. No `walk-residents` row was created.
This is independent of finding A (the policy is on the tables, whatever the resident scope).

**C. Cookie sharing.** Not observed: no page showed a card I was not holding, but only my own
sign-ins ran in this browser during the walk, so this does not answer the planner's question.

**D. Home tile.** Step 0 says the home screen shows the tile. `/my` after sign-in shows no tiles
(the page is My tasks). Not checked further; the step may mean `/home`.

## `view_residents`

| step | result |
|---|---|
| 0 sign in | pass |
| 1 `/residents` loads | pass (list, search, filter, spreadsheet download) |
| 2 read only, no add/edit/save | pass: no register or edit control on the list |
| 3 refused `/operations/medication-list` | pass: lands on `/no-access` |

## `my_tasks`

| step | result |
|---|---|
| 0 sign in | pass |
| 1 `/my` loads | pass ("Nothing is assigned to you right now") |
| 2 mark a recurring job done/skipped, read back | **not run**: the throwaway login has no job assigned and this card cannot assign one. Needs a job assigned to the login first (another card, or the walkthrough should say so). |
| 3 refused `/operations/medication-list` | pass: `/no-access` |

## `residents`

| step | result |
|---|---|
| 0 sign in | pass (header reads `Dev sign-in: residents`) |
| 1 `/residents` loads | pass (90 residents, 9 deceased hidden) |
| 2 TODO resident details | blocked by A; see TODOs |
| 3 Register a new resident | **FAIL**, finding B |
| 4 TODO microchip | blocked by A |
| 5 TODO adopter news | blocked by A |
| 6 Move enclosure | blocked by A (and B: no zones listed) |
| 7–12 TODO hospital, rehome, death, photos, publish | blocked by A |
| 13 refused `/operations/medication-list` | pass: `/no-access` |

### TODOs

None answered; none guessed. What was learned by reading the code (not by doing the write, so
**not** put into the generator):

- Microchip: also asked for at intake, step 3 of the wizard ("Microchip number"); the edit lives on the resident hub, gated `resident.microchip` (`page.tsx:294`).
- Adopter news: hub control gated `resident.adoption_news` (`page.tsx:333`).
- Death: hub control gated `placement.death`; withdraw is `placement.death_withdraw`, which is not in the card.
- All nine remain **still-TODO**: they need a login that reaches the hub (fix A first), then a run.

## Filed on the backlog

Two items on the `backlog` branch: the sign-in script's resident scope (A) and the `residents` card's missing enclosure read (B). Nothing else was filed. No app code was changed.
