import { NextResponse } from "next/server";
import { loadPermissions } from "@/lib/permissions/load";
import { can } from "@/lib/permissions/can";
import { createClient } from "@/lib/supabase/server";
import { readReportPhoto } from "@/lib/animal-reports/photo-store";

/** A report's photo, for staff holding animal_report.manage at read (the activity the page asks). Everyone else gets the same 404 as a made-up name. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user || !can(await loadPermissions(), "animal_report.manage", "read")) return notFound();
  const body = await readReportPhoto(name);
  if (!body) return notFound();
  return new NextResponse(body, {
    headers: { "Content-Type": "image/jpeg", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline", "Cache-Control": "private, no-store" },
  });
}
