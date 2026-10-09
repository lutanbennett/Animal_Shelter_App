import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { loadReceipt, receiptPdf } from "@/lib/donations/receipts-server";

/**
 * GET /management/donations/receipts/<id>/pdf: one receipt as its PDF, drawn
 * from what the register row says was printed (content and issuer as issued),
 * so a re-print is the page the donor received. A voided receipt comes stamped
 * VOID. ?download=1 asks the browser to save rather than show it.
 *
 * Checks donation.receipt itself rather than trusting proxy.ts; RLS on
 * donation_receipts asks the same cell, so a refused caller reads no row.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, ctx: RouteContext<"/management/donations/receipts/[id]/pdf">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Sign in to view receipts.", { status: 401 });
  if (!can(await loadPermissions(), "donation.receipt")) return new NextResponse("Not allowed.", { status: 403 });

  const row = await loadReceipt(supabase, id).catch(() => null);
  if (!row) return new NextResponse("No such receipt.", { status: 404 });

  const { bytes, fileName } = await receiptPdf(row);
  const disposition = request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
  // A Thai donor name makes a non-ASCII file name: filename* carries it, filename is the ASCII fallback.
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_");
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
