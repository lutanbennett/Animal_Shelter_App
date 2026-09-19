import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";

/**
 * Image proxy for Drive-backed photos. Fetches a file once via the
 * authenticated Drive API (files.get + alt=media) and caches the bytes, so
 * that N pageviews of a photo cost Drive at most one request per cache
 * lifetime instead of N direct hits to the public "anyone with the link"
 * endpoint — see docs/decisions.md for why that endpoint is unsafe under
 * bursty traffic (undocumented per-file abuse throttle, ~24h file-wide
 * blackout when tripped).
 *
 * Caching is layered:
 *  - Cloudflare's edge Cache API (`caches.default`) when running in a
 *    Workers-compatible runtime — the actual fix for the throttling risk,
 *    since it de-dupes concurrent/rapid requests at the edge before they
 *    ever reach this handler. Not available under plain `next dev`/Node
 *    hosting, so it's feature-detected rather than assumed.
 *  - A `Cache-Control` header on every response, so browsers (and any
 *    CDN/proxy that respects it) also avoid re-requesting unchanged photos.
 *    This layer works everywhere, including local dev.
 *
 * No cache is invalidated when a photo is deleted (deletePhoto in
 * src/app/residents/[id]/photos/actions.ts) — once a photo is removed from
 * the DB, no URL in the app references its file ID again, so the stale
 * cache entry is harmless and simply expires with the TTL below.
 */

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,100}$/;
const CACHE_SECONDS = 60 * 60 * 24; // 24h — well under Drive's throttle window either way.

function getEdgeCache(): Cache | null {
  const c = (globalThis as { caches?: CacheStorage }).caches;
  return c && "default" in c ? (c as unknown as { default: Cache }).default : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  if (!FILE_ID_PATTERN.test(fileId)) {
    return NextResponse.json({ error: "Invalid photo id." }, { status: 400 });
  }

  const cache = getEdgeCache();
  const cacheKey = new Request(request.url, { method: "GET" });

  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const supabase = await createClient();
  const { data: isKnown, error: lookupError } = await supabase.rpc(
    "is_known_drive_file",
    { p_drive_file_id: fileId },
  );
  if (lookupError || !isKnown) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  let contentType: string;
  let body: Buffer;
  try {
    const drive = getDriveClient();
    // gaxios doesn't surface response headers on the alt=media call (its
    // `headers` come back empty for arraybuffer responses), so the file's
    // mimeType has to come from a separate metadata request run alongside it.
    const [metaRes, mediaRes] = await Promise.all([
      drive.files.get({ fileId, fields: "mimeType" }),
      drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" }),
    ]);
    contentType = metaRes.data.mimeType || "application/octet-stream";
    body = Buffer.from(mediaRes.data as ArrayBuffer);
  } catch {
    // Drive itself may be unavailable (including, ironically, a throttled
    // file) — surface a clean error rather than caching a failure.
    return NextResponse.json({ error: "Could not load photo from Drive." }, { status: 502 });
  }

  const response = new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, immutable`,
    },
  });

  if (cache) {
    await cache.put(cacheKey, response.clone());
  }

  return response;
}
