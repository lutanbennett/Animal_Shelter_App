import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";
import { readMirroredFile } from "@/lib/mirror-read";

/**
 * Staff documents opened through the app instead of in Drive (docs/decisions/2026-10-30-documents-through-the-app.md):
 * a donation receipt's filed copy and a deceased resident's summary PDF and offline index. Same shape as
 * /api/photos/[fileId]: ask who is asking BEFORE any disk or Drive read, read the Pi's mirror copy when it
 * has one (src/lib/mirror-read.ts), fetch from Drive when it does not, so the Worker and `next dev` keep working.
 *
 * Who may fetch what, every request, as the caller (RLS answers, so a signed-out visitor, an archived login
 * and a login without the card all see nothing):
 *  - a file held by a row can_see_drive_file() knows (0193/0218, and since 0286 also a donation receipt's filed copy
 *    and a deceased resident's summary or index, each answered by that table's own RLS: donation.receipt, resident read);
 *  - anything else is "Document not found.", so an internal file cannot be told from a made-up id.
 *
 * Never public, never cached: `private, no-store`. Only raster images and PDFs render in the browser; anything
 * else (HTML, SVG, text) is downloaded, so an uploaded file cannot run as a page on our origin.
 */

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,100}$/;

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function callerMaySee(supabase: Supabase, fileId: string) {
  const { data, error } = await supabase.rpc("can_see_drive_file", { p_drive_file_id: fileId });
  return !error && data === true;
}

function safeToRenderInline(contentType: string) {
  const type = contentType.split(";")[0].trim().toLowerCase();
  return (type.startsWith("image/") && type !== "image/svg+xml") || type === "application/pdf";
}

function notFound() {
  return NextResponse.json({ error: "Document not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
}

function respond(contentType: string, body: BodyInit) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": safeToRenderInline(contentType) ? "inline" : "attachment",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  if (!FILE_ID_PATTERN.test(fileId)) {
    return NextResponse.json({ error: "Invalid document id." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!(await callerMaySee(supabase, fileId))) return notFound();

  const mirrored = await readMirroredFile(fileId);
  if (mirrored) return respond(mirrored.contentType, new Uint8Array(mirrored.body));

  try {
    const { contentType, body } = await getDriveClient().downloadFile(fileId);
    return respond(contentType, body);
  } catch {
    return NextResponse.json({ error: "Could not load document from Drive." }, { status: 502 });
  }
}
