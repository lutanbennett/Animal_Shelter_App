import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { inListOrder, listQuery, resolveListView } from "@/lib/residents/list-view";
import {
  buildResidentsCsv,
  exportFilename,
  exportScope,
  parseTickedIds,
  type ExportRow,
} from "@/lib/residents/export";
import type { ResidentRow } from "../ResidentsTable";

/**
 * The residents list as a spreadsheet. It reads the same query string /residents does (place, zone,
 * enclosure, Unallocated, search, Show all, the status chips, No microchip) through the same resolver, so the file is the
 * list above the button; `ids` narrows it to the ticked rows. Until the activity question is
 * settled (backlog, 2026-10-05) exporting follows `resident.record`, and each medical column needs
 * its own read, so the file holds what the person could already see on screen.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in to download the residents list.", { status: 401 });

  const perms = await loadPermissions();
  if (!can(perms, "resident.record", "read")) {
    return new Response("Your role cannot read the residents list.", { status: 403 });
  }

  const url = new URL(request.url);
  const params: Record<string, string> = {};
  for (const [key, value] of url.searchParams) params[key] = value;

  const view = await resolveListView(supabase, params);
  const ticked = parseTickedIds(params.ids);

  const { data, error } = await listQuery(supabase, view, ticked).returns<ResidentRow[]>();
  if (error) {
    return new Response(`Could not build the file: ${error.message}`, { status: 500 });
  }

  const rows: ExportRow[] = inListOrder(view, data ?? []);

  const csv = await buildResidentsCsv(supabase, rows, exportScope(perms));
  const filename = exportFilename({ ...view.filters, showAll: view.showAll, noChip: view.noChip }, ticked.length);

  // The BOM is what makes Excel read the file as UTF-8, so a Thai name survives a double-click.
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
