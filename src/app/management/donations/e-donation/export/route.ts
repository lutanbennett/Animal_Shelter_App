import { NextResponse } from "next/server";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { loadTaxIdList } from "@/lib/donations/tax-id-list";

/**
 * GET: the gifts still to record, as a plain CSV for the accountant. NOT the Revenue Department's
 * import format (none was established). Checks donation.receipt itself; RLS asks the same cell.
 */
export const dynamic = "force-dynamic";

// A leading = + - @ would run as a formula in a spreadsheet; quote everything.
const cell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export async function GET() {
  const { t } = await getT();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(t.uploads.errors.signInReceipts, { status: 401 });
  if (!can(await loadPermissions(), "donation.receipt")) return new NextResponse("Not allowed.", { status: 403 });
  const { rows, error } = await loadTaxIdList(supabase, false);
  if (error) return new NextResponse(t.donations.taxId.couldntLoad, { status: 500 });
  const lines = [["Gift date", "Donor", "Tax ID", "Kind", "Amount (THB)"].map(cell).join(",")];
  for (const r of rows) {
    lines.push([r.receivedOn, r.donorName, r.taxId, r.holderKind, r.amount == null ? "in kind" : r.amount.toFixed(2)].map(cell).join(","));
  }
  return new NextResponse("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="e-donation-to-record.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
