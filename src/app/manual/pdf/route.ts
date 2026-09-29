import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import manual from "@/lib/manual/en";
import { asManualRole } from "@/lib/manual/filter";
import { renderManualPdf, screenshotSrcs, type ManualImages } from "@/lib/manual/manual-pdf";
import { createClient } from "@/lib/supabase/server";
import { loadCurrentRole } from "@/lib/auth/app-access";

/**
 * GET /manual/pdf — the manual as a printable PDF.
 *
 * Signed-in only, like /manual itself: proxy.ts turns a signed-out request
 * away, and nothing here widens that (the manual describes the staff app;
 * making it public would be a scope change, see docs/decisions/). A
 * volunteer without a login gets a copy from someone who has one.
 *
 * It opens on the reader's own role, as the page does. ?view=all is the
 * whole manual (the office-wall copy); ?images=0 leaves the screenshots out
 * for a small, text-only file.
 */
export const dynamic = "force-dynamic";

/** One screenshot's bytes from the static assets, or null if it is missing. */
async function loadImage(src: string, origin: string): Promise<Uint8Array | null> {
  const url = new URL(src, origin);
  let res: Response;
  try {
    // On the Worker the ASSETS binding serves public/ without a public round trip.
    const assets = (getCloudflareContext().env as { ASSETS?: Fetcher }).ASSETS;
    res = await (assets ? assets.fetch(url) : fetch(url));
  } catch {
    res = await fetch(url).catch(() => new Response(null, { status: 500 }));
  }
  return res.ok ? new Uint8Array(await res.arrayBuffer()) : null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const asked = params.get("view") === "all";
  const withImages = params.get("images") !== "0";
  const role = asManualRole(await createClient().then(loadCurrentRole));
  const all = asked || !role;

  const images: ManualImages = new Map();
  if (withImages) {
    for (const src of new Set(screenshotSrcs(manual, role, all))) {
      const bytes = await loadImage(src, request.nextUrl.origin);
      if (bytes) images.set(src, bytes);
    }
  }

  const pdf = await renderManualPdf(manual, { role, all, images });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lanna-care-${all ? "manual" : `manual-${role}`}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
