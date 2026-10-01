import { notFound } from "next/navigation";
import { isShelterRole } from "@/lib/auth/app-access";
import { requireRole } from "@/lib/auth/require-role";
import { MapPrototype, type Shape } from "./MapPrototype";

/**
 * PROTOTYPE for docs/facility-map-scope.md — not a feature. It answers one
 * question: does tapping a shape laid over a plan image work on a phone?
 * Hand-drawn polygons, three real enclosures, no editor, no schema. Hidden
 * in production builds.
 */
const POLYGONS = [
  "480,90 640,90 640,250 480,250", // percentages are derived below
  "660,90 900,90 900,250 660,250",
  "60,360 380,360 380,520 60,520",
];

export default async function MapPrototypePage() {
  if (process.env.NODE_ENV === "production") notFound();
  const { supabase } = await requireRole(isShelterRole);

  const { data } = await supabase
    .from("enclosures")
    .select("id, name, capacity, zones!inner(name, internal)")
    .eq("zones.internal", true)
    .neq("zones.name", "Lifecycle")
    .order("name")
    .limit(POLYGONS.length)
    .returns<{ id: string; name: string; capacity: number | null }[]>();

  const { data: residents } = await supabase
    .from("resident_list_view")
    .select("enclosure_id")
    .not("enclosure_id", "is", null)
    .returns<{ enclosure_id: string }[]>();
  const counts = new Map<string, number>();
  for (const r of residents ?? []) counts.set(r.enclosure_id, (counts.get(r.enclosure_id) ?? 0) + 1);

  const shapes: Shape[] = (data ?? []).map((e, i) => ({
    id: e.id,
    name: e.name,
    capacity: e.capacity,
    count: counts.get(e.id) ?? 0,
    // Plan is 1000x600; store as percentages so it scales with the image.
    points: POLYGONS[i].split(" ").map((p) => {
      const [x, y] = p.split(",").map(Number);
      return [(x / 1000) * 100, (y / 600) * 100] as [number, number];
    }),
  }));

  return <MapPrototype shapes={shapes} />;
}
