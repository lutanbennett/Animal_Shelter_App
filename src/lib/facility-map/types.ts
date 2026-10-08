import type { Point } from "./geometry";
import type { RoomKind } from "./rooms";

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

/** A room that is not an enclosure (map_rooms): drawn on one plan, with nothing to open. */
export type MapRoom = {
  id: string;
  map_id: string;
  kind: RoomKind;
  shape: Point[];
};

export type FacilityMapData = {
  plans: MapPlan[];
  zones: MapZone[];
  enclosures: MapEnclosure[];
  rooms: MapRoom[];
};

/**
 * Plan image files are served from `public/facility-maps/`, so `facility_maps.image_path` is the file
 * name inside it. One function so the place-on-map editor (step 3) can move them to storage with
 * signed URLs without touching the map.
 */
export function planImageUrl(imagePath: string): string {
  return `/facility-maps/${imagePath.split("/").map(encodeURIComponent).join("/")}`;
}
