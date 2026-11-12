import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadPermissions } from "@/lib/permissions/load";
import { canImportBills } from "@/lib/bills/import-access";
import { loadImportCatalogue } from "@/lib/bills/import-load";
import { templateRows } from "@/lib/bills/import";
import { toCsv } from "@/lib/csv";

/**
 * The spreadsheet to fill in: the exact columns the importer accepts, and two worked examples written with this shelter's own
 * kind and place names, so the typist picks rather than spells. Asks the same question the page does (canImportBills).
 * UTF-8 with a byte-order mark, so Excel opens Thai names correctly.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { t } = await getT();
  if (!user) return new Response(t.bills.import.fault.notAllowed, { status: 401 });
  const perms = await loadPermissions();
  if (!canImportBills(perms)) return new Response(t.bills.import.fault.notAllowed, { status: 403 });
  const cat = await loadImportCatalogue(supabase, perms);
  if ("error" in cat) return new Response(t.bills.import.fault.loadFailed(cat.error), { status: 500 });
  return new Response("﻿" + toCsv(templateRows(cat)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bills-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
