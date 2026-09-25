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
 * Who may fetch what (docs/decisions.md, 2026-09-25, "The photo proxy asks
 * who is asking"):
 *  - A file the public site shows (`is_public_drive_file`, 0084) is served
 *    to anyone, and cached as public.
 *  - Any other file — blood-test and procedure attachments, a resident's
 *    non-profile photos, maintenance photos, unpublished project photos and
 *    Friend logos — only to a caller whose own session can select the row
 *    that holds it (`canSeeInternalFile`), so RLS decides: signed out, an
 *    archived login and a role with no app access all see nothing, and a
 *    vet is refused a maintenance photo as the maintenance pages refuse
 *    them. It is never cached anywhere: `private, no-store`.
 *  - Everything else is "Photo not found.", so a signed-out visitor can't
 *    tell an internal file from a made-up id.
 *
 * Caching is layered, and only ever holds public files:
 *  - Cloudflare's edge Cache API (`caches.default`) when running in a
 *    Workers-compatible runtime — the actual fix for the throttling risk,
 *    since it de-dupes concurrent/rapid requests at the edge before they
 *    ever reach Drive. Not available under plain `next dev`/Node hosting,
 *    so it's feature-detected rather than assumed. It is consulted before
 *    the database, which is safe only because nothing but a public file is
 *    ever put in it. The key is the file id under its own namespace, not the
 *    request URL: entries written before this rule (when internal files were
 *    cached too) are never matched again, and a query string can't be used
 *    to bypass the cache.
 *  - A `Cache-Control` header on every response, so browsers (and any
 *    CDN/proxy that respects it) also avoid re-requesting unchanged photos.
 *    This layer works everywhere, including local dev.
 *
 * No cache is invalidated when a photo is deleted or stops being public
 * (a resident hidden, a project unpublished) — the entry simply expires with
 * the TTL below, as any browser's copy does. Deleted photos are no longer
 * referenced by any URL in the app, so that is harmless.
 */

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,100}$/;
const CACHE_SECONDS = 60 * 60 * 24; // 24h — well under Drive's throttle window either way.
// Bump the version to orphan every entry the edge cache holds.
const EDGE_CACHE_NAMESPACE = "public-v2";

function getEdgeCache(): Cache | null {
  const c = (globalThis as { caches?: CacheStorage }).caches;
  return c && "default" in c ? (c as unknown as { default: Cache }).default : null;
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Whether the caller's session can read a row that holds this file: the
 * non-public half of is_known_drive_file (0076), asked as the caller rather
 * than as the definer. site_content(_photos) are left out because anyone
 * may read them, so is_public_drive_file has already said yes to theirs.
 */
async function canSeeInternalFile(supabase: Supabase, fileId: string) {
  const lookups = [
    supabase.from("attachments").select("id").eq("drive_file_id", fileId).limit(1),
    supabase.from("project_photos").select("id").eq("drive_file_id", fileId).limit(1),
    supabase.from("maintenance_photos").select("id").eq("drive_file_id", fileId).limit(1),
    supabase.from("shelter_friends").select("id").eq("logo_drive_file_id", fileId).limit(1),
  ];
  const results = await Promise.all(lookups);
  return results.some(({ data }) => (data?.length ?? 0) > 0);
}

function notFound() {
  return NextResponse.json(
    { error: "Photo not found." },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
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
  const cacheKey = new Request(
    new URL(`/api/photos/${fileId}?edge=${EDGE_CACHE_NAMESPACE}`, request.url),
    { method: "GET" },
  );

  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const supabase = await createClient();
  const { data: isPublic, error: publicError } = await supabase.rpc(
    "is_public_drive_file",
    { p_drive_file_id: fileId },
  );
  if (publicError) return notFound();

  if (!isPublic) {
    if (!(await canSeeInternalFile(supabase, fileId))) return notFound();
  }

  let contentType: string;
  let body: ArrayBuffer;
  try {
    ({ contentType, body } = await getDriveClient().downloadFile(fileId));
  } catch {
    // Drive itself may be unavailable (including, ironically, a throttled
    // file) — surface a clean error rather than caching a failure.
    return NextResponse.json({ error: "Could not load photo from Drive." }, { status: 502 });
  }

  const response = new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": isPublic
        ? `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, immutable`
        : "private, no-store",
    },
  });

  if (cache && isPublic) {
    await cache.put(cacheKey, response.clone());
  }

  return response;
}
