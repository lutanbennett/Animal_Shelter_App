import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import manual from "@/lib/manual/en";
import { renderManualPdf, screenshotSrcs, type ManualCard, type ManualImages } from "@/lib/manual/manual-pdf";
import { createClient } from "@/lib/supabase/server";
import { cardsForTable, mayViewAll } from "@/lib/manual/for-topic";
import { CARDS, CARD_KEYS } from "@/lib/permissions/cards";
import { loadPermissions } from "@/lib/permissions/load";
import { getT } from "@/lib/i18n/get-t";
import { showMenuForLogin } from "@/lib/menu/show-menu";
import { PREBUILT_DIR, prebuiltName } from "@/lib/manual/prebuilt";

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
 *
 * The whole manual with its pictures is the same for every reader of a language,
 * and laying it out takes 30-100 s, so it is built once at deploy time
 * (scripts/build-manual-pdf.mjs) and read from .manual-pdf/ here. The sign-in
 * check above still runs first. A missing file is a clear 503, never a live
 * render: that is the slow path this exists to remove, and the Worker
 * (which would die on it, error 1102) never gets this path (src/lib/pi-only-paths.ts).
 * docs/decisions/2026-11-05-manual-pdf-prebuilt.md.
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

/** The prebuilt full manual for a language, or null if it was not built or this runtime has no disk. */
async function readPrebuilt(locale: string): Promise<Uint8Array | null> {
  try {
    const [{ readFile }, path] = await Promise.all([import("node:fs/promises"), import("node:path")]);
    return new Uint8Array(await readFile(path.resolve(process.cwd(), PREBUILT_DIR, prebuiltName(locale))));
  } catch {
    return null;
  }
}

function pdfResponse(bytes: Uint8Array, name: string) {
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const withImages = params.get("images") !== "0";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse((await getT()).t.uploads.errors.signInManual, { status: 401 });

  const perms = await loadPermissions();
  const hasMenu = await showMenuForLogin();
  // The whole manual is Admin's alone: ?view=all from anyone else is ignored, and a login whose cards open nothing
  // is not handed it either (that used to be the case).
  const all = mayViewAll(perms, params.get("view")) || perms?.isAdmin === true;
  const { t, locale } = await getT();

  if (all && withImages) {
    const file = await readPrebuilt(locale);
    if (!file) {
      console.error(`manual-pdf: .manual-pdf/${prebuiltName(locale)} is missing; run node scripts/build-manual-pdf.mjs`);
      return new NextResponse(
        "The full manual has not been prepared on this server yet. Ask an administrator to run the manual build (scripts/build-manual-pdf.mjs); the personalised copy still works.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } },
      );
    }
    return pdfResponse(file, "lanna-care-manual.pdf");
  }

  const cards: ManualCard[] = cardsForTable(perms, CARD_KEYS).map((key) => ({
    key,
    label: CARDS[key].label(t),
    description: t.admin.whoDoesWhat.cardsView.description[key],
  }));

  const images: ManualImages = new Map();
  if (withImages) {
    for (const src of new Set(screenshotSrcs(manual, all, perms, hasMenu))) {
      const bytes = await loadImage(src, request.nextUrl.origin);
      if (bytes) images.set(src, bytes);
    }
  }

  // The card names and their one-liners below the heading already come from
  // the reader's dictionary, so the heading over them does too: a Thai reader
  // saw บัตรงานโดยสรุป on /manual and "Cards at a glance" on the PDF of it.
  const pdf = await renderManualPdf(manual, { cards, cardLabels: new Map(CARD_KEYS.map((k) => [k, CARDS[k].label(t)] as const)), cardsHeading: t.manualPage.cardsAtAGlance, all, images, perms, hasMenu });
  return pdfResponse(pdf, `lanna-care-${all ? "manual" : "manual-my-cards"}.pdf`);
}
