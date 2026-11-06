import { NextRequest, NextResponse } from "next/server";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { streamDriveVideo, videoNotFound } from "@/lib/google/stream-video";

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  if (!FILE_ID_PATTERN.test(fileId)) {
    return NextResponse.json({ error: (await getT()).t.uploads.errors.invalidVideoId }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: isPublic, error: publicError } = await supabase.rpc("is_public_drive_file", {
    p_drive_file_id: fileId,
  });
  if (publicError) return await videoNotFound();
  if (isPublic !== true) {
    const { data, error } = await supabase.rpc("can_see_drive_file", { p_drive_file_id: fileId });
    if (error || data !== true) return await videoNotFound();
  }

  return streamDriveVideo(request, fileId, isPublic === true);
}
