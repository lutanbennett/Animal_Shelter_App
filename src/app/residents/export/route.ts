import { requirePermission } from "@/lib/permissions/require";
import { asListRow, readsWhoAndWhereOnly, type WhoAndWhere } from "@/lib/residents/who-and-where";
import { listQuery, resolveListView } from "@/lib/residents/list-view";
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
 * enclosure, search, Show all, Adopted, No microchip) through the same resolver, so the file is the
 * list above the button; `ids` narrows it to the ticked rows. Until the activity question is
 * settled (backlog, 2026-10-05) exporting follows `resident.record`, and each medical column needs
 * its own read, so the file holds what the person could already see on screen.
 */
export async function GET(request: Request) {
  const { supabase, perms } = await requirePermission("resident.record", "read");

  const url = new URL(request.url);
  const params: Record<string, string> = {};
  for (const [key, value] of url.searchParams) params[key] = value;

  const limited = await readsWhoAndWhereOnly();
  const view = await resolveListView(supabase, params, limited);
  const ticked = parseTickedIds(params.ids);

  const { data, error } = await listQuery(supabase, view, limited, ticked).returns<(ResidentRow | WhoAndWhere)[]>();
  if (error) {
    return new Response(`Could not build the file: ${error.message}`, { status: 500 });
  }

  const zoneInternal = new Map(view.zones.map((zone) => [zone.id, zone.internal as boolean | null]));
  const rows: ExportRow[] = (data ?? []).map((row) =>
    limited
      ? {
          ...asListRow(row as WhoAndWhere, zoneInternal.get((row as WhoAndWhere).zone_id ?? "") ?? null),
          species: (row as WhoAndWhere).species,
          sex: (row as WhoAndWhere).sex,
        }
      : (row as ResidentRow),
  );

  const csv = await buildResidentsCsv(supabase, rows, exportScope(perms, limited));
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
