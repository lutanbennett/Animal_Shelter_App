import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadPermissions } from "@/lib/permissions/load";
import { PLAN_OBJECT, readPlanImage } from "@/lib/facility-map/plan-store";

/**
 * An uploaded facility plan image (docs/decisions/2026-10-08-facility-map-plans-uploaded.md), for
 * signed-in staff only — the same readers as `facility_maps` itself (0142: any signed-in login, never
 * anon). A signed-out request, or a login with no app access, gets the same 404 as a made-up name,
 * so nobody outside can tell a plan exists.
 *
 * Every upload has a name of its own, so a response is cached for a year in the viewer's browser
 * (`private`: never in a shared cache, the edge included). Replacing a plan changes the row's
 * `image_path`, and the map then asks for a name it has never fetched, so the new drawing shows at once.
 */

const YEAR = 60 * 60 * 24 * 365;

function notFound() {
  return NextResponse.json({ error: "Plan not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const objectName = path.join("/");
  if (!PLAN_OBJECT.test(objectName)) return notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await loadPermissions())) return notFound();

  const image = await readPlanImage(objectName);
  if (!image) return notFound();

  return new NextResponse(image.body, {
    status: 200,
    headers: {
      "Content-Type": image.type,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Cache-Control": `private, max-age=${YEAR}, immutable`,
    },
  });
}
