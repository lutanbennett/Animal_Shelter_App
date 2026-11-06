import { NextRequest, NextResponse } from "next/server";
import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { streamDriveVideo, videoNotFound } from "@/lib/google/stream-video";

/**
 * Playback for a reel. Never public: whoever's OWN session can select the reels row (reels_select_perm, social.library
 * at Read) may watch, asked here as the caller, then the file is streamed exactly as /api/videos/[fileId] streams a
 * resident's video (src/lib/google/stream-video.ts). This is the shape the meme photo route used before 0286 folded
 * memes into can_see_drive_file(); a reel is not in that function yet, which is why /api/videos/ cannot serve it. The
 * SQL that would fold it in is in docs/decisions/2026-11-06-reels-app.md, for the next schema PR.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: (await getT()).t.uploads.errors.invalidVideoId }, { status: 400 });
  }
  const supabase = await createClient();
  const { data } = await supabase.from("reels").select("drive_file_id").eq("id", id).limit(1).returns<{ drive_file_id: string }[]>();
  const fileId = data?.[0]?.drive_file_id;
  if (!fileId) return await videoNotFound();
  return streamDriveVideo(request, fileId, false);
}
