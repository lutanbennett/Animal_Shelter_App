/**
 * Which placement actions make sense for a resident in each lifecycle
 * status. The hub's Housing card, the housing section and the edit form
 * all read from this one table so they can't drift apart; the server-side
 * helpers in move.ts / hospital.ts / rehome.ts enforce the same rules.
 *
 * Order matters: the last action in each list is the primary one (the
 * filled button on the housing section).
 */
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
      // Foster/adopt is offered here so a fostered animal treated by the
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
      // Resident / Outreach (Unassigned) / unknown.
      return ["hospital", "rehome", "move"];
  }
}
