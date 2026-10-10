import type { Point } from "./geometry";
import type { PublicTranslations } from "@/lib/translations/types";

/** One `facility_maps` row, with the file's URL resolved. */
export type MapPlan = {
  id: string;
  kind: "overview" | "zone";
  /** Null for the overview. */
  zone_id: string | null;
  image_url: string;
  width: number;
  height: number;
};

/** A physical, on-site zone: an outline on the overview, a plan to open, and a count of what is in it. */
export type MapZone = {
  id: string;
  name: string;
  name_th: string | null;
  /** zones.colour (0162): a dot beside the zone's name in the plan list and card, never the outline's fill. */
  colour: string | null;
  shape: Point[] | null;
  enclosure_count: number;
  resident_count: number;
  /** Sum of the capacities that are set; null when none is. */
  capacity: number | null;
};

/** The facts the map shows about one enclosure, all already on /enclosures. */
export type MapEnclosure = {
  id: string;
  name: string;
  name_th: string | null;
  zone_id: string;
  shape: Point[] | null;
  capacity: number | null;
  resident_count: number;
  open_jobs: number;
  special_diet_count: number;
  /** Residents here on a current prescription; 0 for a role that cannot read prescriptions. */
  medication_count: number;
};

/** A room that is not an enclosure (map_rooms): drawn on one plan, with nothing to open but its card. */
export type MapRoom = {
  id: string;
  map_id: string;
  name: string;
  name_th: string | null;
  /** What the room is for, as typed (in either language); null when nobody has written one. */
  description: string | null;
  /** The description's approved translation, if there is one: `{ description: { lang, text } }`. */
  translations: PublicTranslations;
  shape: Point[];
};

export type FacilityMapData = {
  plans: MapPlan[];
  zones: MapZone[];
  enclosures: MapEnclosure[];
  rooms: MapRoom[];
};

/** The prefix of every `image_path`: the plan is an object in the plan store. */
export const STORED_PREFIX = "storage:";

/**
 * The URL of a plan image: an uploaded plan (`storage:plans/<id>/<name>`), served by `/api/facility-maps/…`
 * to signed-in users only (docs/decisions/2026-10-08-facility-map-plans-uploaded.md). Every plan is uploaded:
 * the three committed under `public/facility-maps/` before uploads existed were deleted on 2026-10-10, after
 * checking no row in dev or production still named one. The map and the editor read this URL, never the path.
 */
export function planImageUrl(imagePath: string): string {
  const path = imagePath.startsWith(STORED_PREFIX) ? imagePath.slice(STORED_PREFIX.length) : imagePath;
  return `/api/facility-maps/${path.split("/").map(encodeURIComponent).join("/")}`;
}
