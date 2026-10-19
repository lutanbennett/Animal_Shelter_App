import { can, type Permissions } from "@/lib/permissions/can";
import { isMedicalFolder } from "@/lib/google/drive-client";

/**
 * Where a meme's photo can come from (memes.source_kind, 0228). A source is offered only to a login that may already
 * open the page those photos live on, so the maker never shows a picture someone could not otherwise see. Medical is
 * not a source: a file that is also a Medical photo, or any clinical attachment, is refused whichever tab it came
 * through. docs/decisions/2026-10-19-meme-sources-app.md.
 */
export const SOURCE_KINDS = ["resident", "outing", "maintenance", "project", "website", "upload"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

export const isSourceKind = (v: unknown): v is SourceKind => typeof v === "string" && (SOURCE_KINDS as readonly string[]).includes(v);

/** The tabs this login is offered, in tab order. Residents are as stage 2 had them; each other tab mirrors its page's guard. */
export function sourcesFor(perms: Permissions | null | undefined): SourceKind[] {
  return SOURCE_KINDS.filter((k) => {
    switch (k) {
      case "outing":
        return can(perms, "community.outings", "read");
      case "maintenance":
        return can(perms, "maintenance.jobs", "read");
      case "project":
        return can(perms, "projects.folders", "read");
      case "website":
        return can(perms, "website.content");
      default:
        return true;
    }
  });
}

export type OtherAttachment = { owner_type: string; sub_folder: string | null };

/** attachments.owner_type values a source's own photos legitimately carry; any other row means the file is something else too. */
const OWN_OWNER_TYPES: Partial<Record<SourceKind, readonly string[]>> = { maintenance: ["maintenance"], project: ["project"] };

/**
 * `rows` are every attachments row that holds the chosen Drive file. Refused when any is Medical, or belongs to
 * another kind of record than the source (a blood test, a procedure, a resident's file). Outreach and website photos
 * are not attachments at all, so any row there is a sign the file is something else.
 */
export function checkSourceAttachments(kind: SourceKind, rows: readonly OtherAttachment[]): { ok: boolean } {
  const own = OWN_OWNER_TYPES[kind] ?? [];
  return { ok: !rows.some((r) => isMedicalFolder(r.sub_folder) || !own.includes(r.owner_type)) };
}
