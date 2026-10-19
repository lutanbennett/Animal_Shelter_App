import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Permissions } from "@/lib/permissions/can";
import { checkMakerSource, type MakerSourceRow } from "./maker-source";
import { checkSourceAttachments, sourcesFor, type OtherAttachment, type SourceKind } from "./sources";

export type SourceLink = { outingId: string | null; maintenanceId: string | null; projectId: string | null };
export type ResolvedSource =
  | ({ ok: true; kind: SourceKind; residentIds: string[] } & SourceLink)
  | { ok: false; reason: "notFound" | "medical" | "notApproved" | "notAllowed" };

const NO_LINK: SourceLink = { outingId: null, maintenanceId: null, projectId: null };

/**
 * Checks a chosen photo on the server, as the caller, for the maker's page and for createMeme's save. Three gates, in
 * order: the login is offered this source at all (sourcesFor mirrors each page's guard); the photo is a row the
 * caller's own session can select (RLS decides, so a hidden row is "not found", the same answer as a made-up id); and
 * the file is not also a Medical or clinical attachment. The picker only hides things; this is the rule.
 */
export async function resolveSource(
  supabase: SupabaseClient,
  perms: Permissions | null | undefined,
  kind: SourceKind,
  fileId: string,
): Promise<ResolvedSource> {
  if (!sourcesFor(perms).includes(kind) || kind === "upload") return { ok: false, reason: "notAllowed" };

  if (kind === "resident") {
    const { data } = await supabase
      .from("attachments")
      .select("owner_id, sub_folder, approved_at")
      .eq("owner_type", "resident")
      .eq("drive_file_id", fileId)
      .returns<MakerSourceRow[]>();
    const r = checkMakerSource(data);
    return r.ok ? { ok: true, kind, residentIds: r.residentIds, ...NO_LINK } : { ok: false, reason: r.reason };
  }

  const link = { ...NO_LINK };
  if (kind === "outing") {
    const { data } = await supabase.from("community_outing_photos").select("outing_id").eq("drive_file_id", fileId).limit(1).returns<{ outing_id: string }[]>();
    if (!data?.[0]) return { ok: false, reason: "notFound" };
    link.outingId = data[0].outing_id;
  } else if (kind === "website") {
    const { data } = await supabase.from("site_content_photos").select("id").eq("drive_file_id", fileId).limit(1).returns<{ id: string }[]>();
    if (!data?.[0]) return { ok: false, reason: "notFound" };
  } else {
    const { data } = await supabase
      .from("attachments")
      .select("owner_id")
      .eq("owner_type", kind)
      .eq("drive_file_id", fileId)
      .limit(1)
      .returns<{ owner_id: string }[]>();
    if (!data?.[0]) return { ok: false, reason: "notFound" };
    if (kind === "maintenance") link.maintenanceId = data[0].owner_id;
    else link.projectId = data[0].owner_id;
  }

  const { data: rows } = await supabase.from("attachments").select("owner_type, sub_folder").eq("drive_file_id", fileId).returns<OtherAttachment[]>();
  if (!checkSourceAttachments(kind, rows ?? []).ok) return { ok: false, reason: "medical" };
  return { ok: true, kind, residentIds: [], ...link };
}
