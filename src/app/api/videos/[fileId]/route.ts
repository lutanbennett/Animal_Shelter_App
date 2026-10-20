import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";

/**
 * Playback for a resident's video, streamed from Drive with the browser's Range header passed through, so an
 * iPhone (which will not play a video from a server that cannot answer a range request) and an Android phone
 * both play it inline and can skip around without downloading the lot.
 *
 * Who may watch is decided exactly as /api/photos/[fileId] decides who may see a photo: a file the public site
 * shows (is_public_drive_file) to anyone, any other file only to a caller whose own session can select the row
 * that holds it (can_see_drive_file), everything else "not found". Nothing is cached anywhere but the browser,
 * and an internal file is `private, no-store`. Only a video is served: a Drive file of any other type is
 * "not found" here, so this route is not a second way to download a PDF.
 */

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,100}$/;

function notFound() {
  return NextResponse.json({ error: "Video not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  if (!FILE_ID_PATTERN.test(fileId)) {
    return NextResponse.json({ error: "Invalid video id." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: isPublic, error: publicError } = await supabase.rpc("is_public_drive_file", {
    p_drive_file_id: fileId,
  });
  if (publicError) return notFound();
  if (isPublic !== true) {
    const { data, error } = await supabase.rpc("can_see_drive_file", { p_drive_file_id: fileId });
    if (error || data !== true) return notFound();
  }

  let upstream: Response;
  try {
    upstream = await getDriveClient().streamFile(fileId, request.headers.get("range"));
  } catch (err) {
    // A range Drive cannot satisfy is the browser's mistake, not an outage.
    const status = (err as { status?: number }).status;
    if (status === 416) return new NextResponse(null, { status: 416 });
    return NextResponse.json({ error: "Could not load video from Drive." }, { status: 502 });
  }

  const contentType = (upstream.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!contentType.startsWith("video/")) {
    await upstream.body?.cancel();
    return notFound();
  }

  const headers = new Headers({
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    "Cache-Control": isPublic === true ? "public, max-age=3600" : "private, no-store",
  });
  for (const name of ["content-length", "content-range"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
