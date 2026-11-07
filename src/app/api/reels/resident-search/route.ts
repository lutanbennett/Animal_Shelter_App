import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

/**
 * The # picker's search for a reel (0329, backlog #i7qkz): residents whose name or R-code starts with what was typed.
 * Needs resident.who_and_where at Read, the activity the Reel and Meme cards carry, and reads the resident_who_and_where
 * view, which holds who and where and nothing from the record (no behaviour or past-story notes). The general search at
 * /api/residents/tag-search asks resident.record, which a library card does not hold and must not be widened to.
 */
export async function GET(request: Request) {
  if (!can(await loadPermissions(), "resident.who_and_where", "read")) {
    return NextResponse.json({ error: "not allowed" }, { status: 403 });
  }
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 40);
  const safe = q.replace(/[%_,()\]/g, " ").trim();
  const supabase = await createClient();
  let query = supabase.from("resident_who_and_where").select("id, name, resident_code").order("name").limit(8);
  if (safe) query = query.or(`name.ilike.${safe}%,resident_code.ilike.${safe}%`);
  const { data, error } = await query.returns<{ id: string; name: string; resident_code: string | null }[]>();
  if (error) return NextResponse.json({ error: "search failed" }, { status: 500 });
  return NextResponse.json({ residents: data ?? [] });
}
