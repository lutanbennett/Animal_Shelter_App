/**
 * Which placement actions make sense for a resident in each lifecycle
 * status. The hub's Housing card, the housing section and the edit form
 * all read from this one table so they can't drift apart; the server-side
 * helpers in move.ts / hospital.ts / rehome.ts enforce the same rules.
 *
 * Order matters: the last action in each list is the primary one (the
 * filled button on the housing section).
 */
import { can, type Permissions } from "@/lib/permissions/can";

export type PlacementActionKey =
  | "move"
  | "hospital"
  | "hospitalReturn"
  | "rehome"
  | "returnToShelter";

/** Route under `/residents/[id]` for each action. */
export const PLACEMENT_ACTION_PATHS: Record<PlacementActionKey, string> = {
  move: "/move",
  hospital: "/hospital",
  hospitalReturn: "/hospital/return",
  rehome: "/rehome",
  returnToShelter: "/rehome/return",
};

export function availablePlacementActions(
  status: string | null | undefined,
): PlacementActionKey[] {
  switch (status) {
    case "Deceased":
      return [];
    case "Hospitalised":
      // Foster/adopt is offered here so a fostered resident treated by the
      // shelter can go straight back to its carer (or a new one) rather
      // than through a kennel first.
      return ["rehome", "hospitalReturn"];
    case "Fostered":
      // The shelter is still responsible for medical care while fostered.
      // A foster can become an adoption or move to another carer via the
      // same rehome form. Moves are out: they're not in an enclosure.
      return ["hospital", "returnToShelter", "rehome"];
    case "Adopted":
      // Adoption ends the shelter's chain; the only way back is a return.
      return ["returnToShelter"];
    default:
      // Resident / Unassigned / unknown.
      return ["hospital", "rehome", "move"];
  }
}

/** The activity each action's own page and save step ask for (the pages and move.ts / hospital.ts / rehome.ts check these). */
const PLACEMENT_ACTION_ACTIVITY: Record<PlacementActionKey, "placement.move" | "placement.hospital" | "placement.rehome"> = {
  move: "placement.move",
  hospital: "placement.hospital",
  hospitalReturn: "placement.hospital",
  rehome: "placement.rehome",
  returnToShelter: "placement.rehome",
};

/**
 * The actions for this status that this login may use. A button the card cannot use is not drawn, rather than opening a page that
 * refuses (Card review 1, 2026-10-26). The page and the save step still check, so this only decides what is offered.
 */
export function placementActionsFor(
  perms: Permissions | null | undefined,
  status: string | null | undefined,
): PlacementActionKey[] {
  return availablePlacementActions(status).filter((key) => can(perms, PLACEMENT_ACTION_ACTIVITY[key]));
}
