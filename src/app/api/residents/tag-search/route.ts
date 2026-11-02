import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

/**
 * The # picker's search: residents whose name or R-code starts with what was typed. Needs resident.record at read,
 * the same activity the link table's own policies ask, so a login that cannot link gets nothing here either. Reading
 * residents is still governed by the residents policy; this only narrows.
 */
export async function GET(request: Request) {
  if (!can(await loadPermissions(), "resident.record", "read")) {
    return NextResponse.json({ error: "not allowed" }, { status: 403 });
  }
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 40);
  const safe = q.replace(/[%_,()\\]/g, " ").trim();
  const supabase = await createClient();
  let query = supabase.from("residents").select("id, name, resident_code").order("name").limit(8);
  if (safe) query = query.or(`name.ilike.${safe}%,resident_code.ilike.${safe}%`);
  const { data, error } = await query.returns<{ id: string; name: string; resident_code: string | null }[]>();
  if (error) return NextResponse.json({ error: "search failed" }, { status: 500 });
  return NextResponse.json({ residents: data ?? [] });
}
