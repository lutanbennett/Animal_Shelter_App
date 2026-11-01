import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import manual from "@/lib/manual/en";
import { renderManualPdf, screenshotSrcs, type ManualCard, type ManualImages } from "@/lib/manual/manual-pdf";
import { createClient } from "@/lib/supabase/server";
import { entersApp } from "@/lib/permissions/can";
import { CARDS, CARD_KEYS } from "@/lib/permissions/cards";
import { loadPermissions } from "@/lib/permissions/load";
import { getT } from "@/lib/i18n/get-t";

/**
 * GET /manual/pdf — the manual as a printable PDF.
 *
 * Signed-in only, like /manual itself: proxy.ts turns a signed-out request
 * away, and this route checks again rather than trusting that it still does
 * (a matcher or public-path edit would silently open it). Nothing here widens
 * it (the manual describes the staff app;
 * making it public would be a scope change, see docs/decisions/). A
 * volunteer without a login gets a copy from someone who has one.
 *
 * It opens on the reader's own cards' topics, as the page does. ?view=all is the
 * whole manual (the office-wall copy); ?images=0 leaves the screenshots out
 * for a small, text-only file.
 */
export const dynamic = "force-dynamic";

/**
 * One screenshot's bytes, or null if it is missing.
 *
 * On the Worker the ASSETS binding serves public/. The Node origin (the Pi,
 * `next start`) has no binding, and fetching its own URL goes through
 * proxy.ts, which redirects an unauthenticated request to /login — react-pdf
 * then got HTML and logged "Incomplete or corrupt PNG file" per image. So
 * there it reads public/ from disk, which is all the binding does anyway.
 */
async function loadImage(src: string, origin: string): Promise<Uint8Array | null> {
  const url = new URL(src, origin);
  const assets = (() => {
    try {
      return (getCloudflareContext().env as { ASSETS?: { fetch(input: URL): Promise<Response> } }).ASSETS;
    } catch {
      return undefined; // not on the Worker
    }
  })();
  if (assets) {
    const res = await assets.fetch(url).catch(() => null);
    return res?.ok ? new Uint8Array(await res.arrayBuffer()) : null;
  }
  return readPublicFile(src);
}

/** A file under public/, or null. Only paths inside public/manual/ are read. */
async function readPublicFile(src: string): Promise<Uint8Array | null> {
  // Dynamic imports keep node:fs out of the Worker's path.
  const [{ readFile }, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
  const root = path.resolve(process.cwd(), "public", "manual");
  const file = path.resolve(process.cwd(), "public", "." + src);
  if (!src.startsWith("/manual/") || !file.startsWith(root + path.sep)) return null;
  return readFile(file).then(
    (b) => new Uint8Array(b),
    () => null,
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const asked = params.get("view") === "all";
  const withImages = params.get("images") !== "0";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Sign in to view the manual.", { status: 401 });

  const perms = await loadPermissions();
  const all = asked || !entersApp(perms) || perms?.isAdmin === true; // Admin is shown every topic anyway
  const { t } = await getT();
  const cards: ManualCard[] = CARD_KEYS.map((key) => ({
    key,
    label: CARDS[key].label(t),
    description: t.admin.whoDoesWhat.cardsView.description[key],
  }));

  const images: ManualImages = new Map();
  if (withImages) {
    for (const src of new Set(screenshotSrcs(manual, all, perms))) {
      const bytes = await loadImage(src, request.nextUrl.origin);
      if (bytes) images.set(src, bytes);
    }
  }

  // The card names and their one-liners below the heading already come from
  // the reader's dictionary, so the heading over them does too: a Thai reader
  // saw บัตรงานโดยสรุป on /manual and "Cards at a glance" on the PDF of it.
  const pdf = await renderManualPdf(manual, { cards, cardsHeading: t.manualPage.cardsAtAGlance, all, images, perms });
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lanna-care-${all ? "manual" : "manual-my-cards"}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
