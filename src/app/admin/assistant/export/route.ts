import { createClient } from "@/lib/supabase/server";
import { loadPermissions } from "@/lib/permissions/load";
import { EXPORT_LIMIT, buildEvalCsv, loadCouldNotHelp, parseCouldNotHelpFilters } from "@/lib/assistant/could-not-help";

/**
 * The could-not-help rows as an eval-set file: one row per exchange, with empty columns for the correct
 * answer. Admin only, by the Admin rule rather than a card (CLAUDE.md: Admin sits outside the card system),
 * and the table's own policy would return an empty file to anyone else in any case. It reads the same
 * query string the screen does, so the file is the list above the button.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in to download the assistant log.", { status: 401 });

  const perms = await loadPermissions();
  if (!perms?.isAdmin) return new Response("Only an Admin can download the assistant log.", { status: 403 });

  const params: Record<string, string> = {};
  for (const [key, value] of new URL(request.url).searchParams) params[key] = value;
  const filters = parseCouldNotHelpFilters(params);

  const { rows, error } = await loadCouldNotHelp(supabase, filters, EXPORT_LIMIT);
  if (error) return new Response(`Could not build the file: ${error}`, { status: 500 });

  const today = new Date().toISOString().slice(0, 10);
  // The BOM is what makes Excel read the file as UTF-8, so Thai sentences survive a double-click.
  return new Response("﻿" + buildEvalCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="assistant-could-not-help-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
