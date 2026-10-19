import { isMedicalFolder } from "@/lib/google/drive-client";

/**
 * The one rule the meme maker's save path asks of its source photo. A Medical photo must never become a meme: a joke
 * made from a suffering animal's picture, posted under the shelter's name, is the worst thing this feature could do.
 * So this runs on the server, on the attachment rows for the file, not in the picker (which only hides them).
 */
export type MakerSourceRow = { owner_id: string; sub_folder: string | null; approved_at: string | null };
export type MakerSourceCheck =
  | { ok: true; residentIds: string[] }
  | { ok: false; reason: "notFound" | "medical" | "notApproved" };

export function checkMakerSource(rows: readonly MakerSourceRow[] | null | undefined): MakerSourceCheck {
  if (!rows || rows.length === 0) return { ok: false, reason: "notFound" };
  // Any Medical row refuses the file: the same Drive file must not be reachable through a looser sibling row.
  if (rows.some((r) => isMedicalFolder(r.sub_folder))) return { ok: false, reason: "medical" };
  if (rows.some((r) => r.approved_at === null)) return { ok: false, reason: "notApproved" };
  return { ok: true, residentIds: [...new Set(rows.map((r) => r.owner_id))] };
}
