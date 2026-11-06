import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getT } from "@/lib/i18n/get-t";
import { getDriveClient } from "@/lib/google/drive";
import { openMirroredVideo } from "@/lib/mirror-read";

/**
 * The streaming half of a video route, shared by /api/videos/[fileId] (a resident's video) and /api/reels/[id]/video
 * (a reel). The CALLER decides who may watch, before calling this: nothing here checks a permission. Drive's answer
 * passes the browser's Range header through (an iPhone will not play a video from a server that cannot answer a range
 * request), only a Drive file of type video/* is served, and an internal file is `private, no-store`.
 */
export async function videoNotFound() {
  return NextResponse.json({ error: (await getT()).t.uploads.errors.videoNotFound }, { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function streamDriveVideo(request: NextRequest, fileId: string, isPublic: boolean): Promise<NextResponse> {
  // An internal video on the Pi mirror (src/lib/mirror-read.ts). A public file is left to Drive, as photos are.
  // Any miss falls through to Drive below.
  if (!isPublic) {
    const mirrored = await openMirroredVideo(fileId, request.headers.get("range"));
    if (mirrored && "unsatisfiable" in mirrored) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${mirrored.unsatisfiable}` } });
    }
    if (mirrored) {
      return new NextResponse(mirrored.body, {
        status: mirrored.status,
        headers: {
          ...mirrored.headers,
          "Content-Type": mirrored.contentType,
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "inline",
          "Cache-Control": "private, no-store",
        },
      });
    }
  }

  let upstream: Response;
  try {
    upstream = await getDriveClient().streamFile(fileId, request.headers.get("range"));
  } catch (err) {
    // A range Drive cannot satisfy is the browser's mistake, not an outage.
    const status = (err as { status?: number }).status;
    if (status === 416) return new NextResponse(null, { status: 416 });
    return NextResponse.json({ error: (await getT()).t.uploads.errors.couldNotLoadVideo }, { status: 502 });
  }

  const contentType = (upstream.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!contentType.startsWith("video/")) {
    await upstream.body?.cancel();
    return await videoNotFound();
  }

  const headers = new Headers({
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    "Cache-Control": isPublic ? "public, max-age=3600" : "private, no-store",
  });
  for (const name of ["content-length", "content-range"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
