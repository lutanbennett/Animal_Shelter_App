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

/** An `image_path` that names an object in the plan store rather than a file in `public/`. */
export const STORED_PREFIX = "storage:";

/** Whether a plan is in the plan store (uploaded) rather than a file committed under `public/facility-maps/`. */
export function isStoredPlan(imagePath: string): boolean {
  return imagePath.startsWith(STORED_PREFIX);
}

/**
 * The URL of a plan image. An uploaded plan (`storage:plans/<id>/<name>`) is served by
 * `/api/facility-maps/…` to signed-in users only (docs/decisions/2026-10-08-facility-map-plans-uploaded.md);
 * a plain file name is one of the plans committed under `public/facility-maps/` before uploads existed,
 * served from there until it is moved into the store. The map and the editor read this URL, never the path.
 */
export function planImageUrl(imagePath: string): string {
  const stored = isStoredPlan(imagePath);
  const path = stored ? imagePath.slice(STORED_PREFIX.length) : imagePath;
  return `${stored ? "/api/facility-maps" : "/facility-maps"}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
