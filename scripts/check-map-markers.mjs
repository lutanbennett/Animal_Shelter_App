// The facility map's enclosure markers stay inside their own enclosure, against the real plans on DEV:
//
//   node scripts/check-map-markers.mjs
//
// For every enclosure placed on a zone plan, and for one, two and three markers (medication, special
// diet, maintenance), every marker's square, with its white halo, must sit inside that enclosure's
// outline and touch no other enclosure or room on the plan. That is the 2026-10-09 Main Zone
// screenshot as a test: enclosure 10's icon spilling into 9, and the chips on the small row crowding.
// Read-only. Prints the smallest marker per plan, so "small" is a number, not an impression.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const geo = await import(pathToFileURL(join(root, "src/lib/facility-map/geometry.ts")).href);
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error("refusing: not the dev project");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const failures = [];
const expect = (ok, what) => {
  if (!ok) {
    console.log(`  FAIL ${what}`);
    failures.push(what);
  }
};

// Point in polygon, in drawing space (y already scaled).
function inside([x, y], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
// The halo is a circle of radius 0.62 × size about the square's centre: sample its rim.
function rim({ x, y, size }) {
  const r = size * 0.62;
  return Array.from({ length: 16 }, (_, i) => [x + size / 2 + r * Math.cos((i * Math.PI) / 8), y + size / 2 + r * Math.sin((i * Math.PI) / 8)]);
}

const [{ data: plans }, { data: encl }, { data: rooms }, { data: zones }] = await Promise.all([
  db.from("facility_maps").select("id, kind, zone_id, width, height"),
  db.from("enclosures").select("id, name, zone_id, map_shape"),
  db.from("map_rooms").select("id, map_id, kind, shape"),
  db.from("zones").select("id, name"),
]);
const zoneName = new Map(zones.map((z) => [z.id, z.name]));

let checked = 0;
for (const plan of plans.filter((p) => p.kind === "zone")) {
  const k = plan.height / plan.width;
  const toDrawing = (shape) => shape.map(([x, y]) => [x, y * k]);
  const mine = encl.filter((e) => e.zone_id === plan.zone_id).map((e) => ({ ...e, shape: geo.parseShape(e.map_shape) })).filter((e) => e.shape);
  const others = [...mine.map((e) => ({ name: e.name, poly: toDrawing(e.shape) })), ...rooms.filter((r) => r.map_id === plan.id).map((r) => ({ name: r.kind, poly: toDrawing(geo.parseShape(r.shape)) }))];
  let smallest = Infinity;
  for (const e of mine) {
    const own = toDrawing(e.shape);
    for (const n of [1, 2, 3]) {
      const boxes = geo.markerBoxes(n, e.shape, plan.width, plan.height);
      expect(boxes.length === n, `${e.name}: ${n} markers placed`);
      for (const box of boxes) {
        checked++;
        smallest = Math.min(smallest, box.size);
        expect(box.size > 0 && box.size <= geo.MARKER_MAX, `${e.name}: marker size ${box.size.toFixed(2)} within (0, ${geo.MARKER_MAX}]`);
        const pts = rim(box);
        expect(pts.every((p) => inside(p, own)), `${e.name} (${n} markers): a marker's halo crosses its own outline`);
        for (const o of others) if (o.poly !== own && o.name !== e.name) expect(!pts.some((p) => inside(p, o.poly)), `${e.name} (${n} markers): a marker reaches into ${o.name}`);
      }
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const c = boxes[j];
          expect(a.x + a.size <= c.x || c.x + c.size <= a.x || a.y + a.size <= c.y || c.y + c.size <= a.y, `${e.name} (${n} markers): markers ${i} and ${j} overlap`);
        }
    }
  }
  console.log(`${zoneName.get(plan.zone_id) ?? plan.zone_id}: ${mine.length} enclosures placed, smallest marker ${Number.isFinite(smallest) ? smallest.toFixed(2) : "-"} of 100 across`);
}

console.log(`${checked} markers checked, ${failures.length} failures`);
process.exit(failures.length ? 1 : 0);
