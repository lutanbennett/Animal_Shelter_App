import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appUserLabel, loadAppUsersById } from "@/lib/auth/app-users";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import { loadPlaceOrder } from "@/lib/enclosures/order";

/**
 * Photos filed against an ENCLOSURE because the filer did not know the animal (pending_photos, 0218). Never public:
 * the table has no approval state and no resident. docs/decisions/2026-10-17-enclosure-photos-app.md.
 */

/** A pending photo older than this is listed on System status so it does not wait unseen. */
export const STALE_PENDING_DAYS = 30;

/** One resident who was in the photo's enclosure on the day, with their own photo for the approver to compare. */
export type PendingCandidate = {
  residentId: string;
  code: string | null;
  name: string;
  species: string | null;
  /** The resident's profile photo, so the approver compares faces and never names alone. */
  photoFileId: string | null;
};

export type PendingPhoto = {
  id: string;
  driveFileId: string;
  fileName: string | null;
  takenAt: string;
  uploadedAt: string;
  enclosureId: string;
  /** "Blue Enclosure 3": null when this login cannot read the enclosure. */
  enclosureName: string | null;
  enclosureNameTh: string | null;
  addedBy: string;
  candidates: PendingCandidate[];
};

type PendingRow = {
  id: string;
  drive_file_id: string;
  file_name: string | null;
  taken_at: string;
  uploaded_at: string;
  uploaded_by: string;
  enclosure_id: string;
  enclosures: { name: string; name_th: string | null } | null;
};

type CandidateRow = { resident_id: string; resident_code: string | null; name: string; species: string | null };

/** The pending photos, oldest first, each with who was in its enclosure that day. Approvers only (RLS). */
export async function loadPendingPhotos(supabase: SupabaseClient): Promise<PendingPhoto[]> {
  const { data } = await supabase
    .from("pending_photos")
    .select("id, drive_file_id, file_name, taken_at, uploaded_at, uploaded_by, enclosure_id, enclosures(name, name_th)")
    .order("uploaded_at", { ascending: true })
    .returns<PendingRow[]>();
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const [users, candidateSets] = await Promise.all([
    loadAppUsersById(supabase, [...new Set(rows.map((r) => r.uploaded_by))]),
    Promise.all(
      rows.map(async (r) => {
        const { data: found } = await supabase.rpc("pending_photo_candidates", { p_pending_id: r.id });
        return (found ?? []) as CandidateRow[];
      }),
    ),
  ]);

  // Their own photos, in one read.
  const candidateIds = [...new Set(candidateSets.flat().map((c) => c.resident_id))];
  const photoOf = new Map<string, string | null>();
  if (candidateIds.length > 0) {
    const { data: photos } = await supabase
      .from("residents")
      .select("id, profile_photo_drive_file_id")
      .in("id", candidateIds)
      .returns<{ id: string; profile_photo_drive_file_id: string | null }[]>();
    for (const p of photos ?? []) photoOf.set(p.id, p.profile_photo_drive_file_id);
  }

  return rows.map((r, i) => ({
    id: r.id,
    driveFileId: r.drive_file_id,
    fileName: r.file_name,
    takenAt: r.taken_at,
    uploadedAt: r.uploaded_at,
    enclosureId: r.enclosure_id,
    enclosureName: r.enclosures?.name ?? null,
    enclosureNameTh: r.enclosures?.name_th ?? null,
    addedBy: appUserLabel(users.get(r.uploaded_by)),
    candidates: candidateSets[i].map((c) => ({
      residentId: c.resident_id,
      code: c.resident_code,
      name: c.name,
      species: c.species,
      photoFileId: photoOf.get(c.resident_id) ?? null,
    })),
  }));
}

/** Pending photos filed more than STALE_PENDING_DAYS ago, and the age in days of the oldest. */
export async function countStalePending(
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<{ error: string | null; count: number; oldestDays: number }> {
  const cutoff = new Date(now.getTime() - STALE_PENDING_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("pending_photos")
    .select("uploaded_at")
    .lt("uploaded_at", cutoff)
    .order("uploaded_at", { ascending: true })
    .returns<{ uploaded_at: string }[]>();
  if (error) return { error: error.message, count: 0, oldestDays: 0 };
  const rows = data ?? [];
  const oldestDays = rows[0] ? Math.floor((now.getTime() - new Date(rows[0].uploaded_at).getTime()) / 86_400_000) : 0;
  return { error: null, count: rows.length, oldestDays };
}

/** One zone and its enclosures, as the "which enclosure" picker draws them. */
export type EnclosureChoices = {
  zones: { id: string; name: string; nameTh: string | null; colour: string | null; enclosures: { id: string; name: string; nameTh: string | null }[] }[];
};

type WhereRow = {
  enclosure_id: string;
  enclosure_name: string;
  enclosure_name_th: string | null;
  zone_id: string;
  zone_name: string;
  zone_name_th: string | null;
  zone_colour: string | null;
};

/**
 * The zones and enclosures a person can tag a photo to. A login that reads the facility (Management, Admin) gets
 * every physical enclosure. A volunteer holding only Add Shelter Photos cannot read `enclosures`, only who-and-where
 * (0134), so the list falls back to the enclosures somebody is living in now: the place a volunteer stood is, in
 * practice, one with an animal in it. An empty enclosure is the one thing that path cannot offer.
 */
export async function loadEnclosureChoices(supabase: SupabaseClient): Promise<EnclosureChoices> {
  const direct = await loadEnclosureOptions(supabase);
  if (!direct.error && direct.enclosures.length > 0) {
    return {
      zones: direct.zones
        .map((z) => ({
          id: z.id,
          name: z.name,
          nameTh: z.name_th,
          colour: z.colour,
          enclosures: direct.enclosures
            .filter((e) => e.zoneId === z.id)
            .map((e) => ({ id: e.id, name: e.name, nameTh: e.name_th })),
        }))
        .filter((z) => z.enclosures.length > 0),
    };
  }

  const [{ data }, order] = await Promise.all([
    supabase
      .from("resident_who_and_where")
      .select("enclosure_id, enclosure_name, enclosure_name_th, zone_id, zone_name, zone_name_th, zone_colour")
      .not("enclosure_id", "is", null)
      .returns<WhereRow[]>(),
    loadPlaceOrder(supabase),
  ]);
  const zones = new Map<string, EnclosureChoices["zones"][number]>();
  for (const row of data ?? []) {
    if (!row.enclosure_id || !row.zone_id) continue;
    const zone =
      zones.get(row.zone_id) ??
      { id: row.zone_id, name: row.zone_name, nameTh: row.zone_name_th, colour: row.zone_colour, enclosures: [] };
    if (!zone.enclosures.some((e) => e.id === row.enclosure_id)) {
      zone.enclosures.push({ id: row.enclosure_id, name: row.enclosure_name, nameTh: row.enclosure_name_th });
    }
    zones.set(row.zone_id, zone);
  }
  const ordered = [...zones.values()].sort((a, b) => order.compareZones(a.name, b.name));
  for (const z of ordered) z.enclosures.sort((a, b) => order.compareEnclosures(a, b));
  return { zones: ordered };
}

/** The name of an enclosure this login may tag a photo to (the same two reads as the picker), or null. */
export async function enclosureNameFor(supabase: SupabaseClient, enclosureId: string): Promise<string | null> {
  const { data: direct } = await supabase
    .from("enclosures")
    .select("name")
    .eq("id", enclosureId)
    .limit(1)
    .returns<{ name: string }[]>();
  if (direct?.[0]) return direct[0].name;
  const { data: seen } = await supabase
    .from("resident_who_and_where")
    .select("enclosure_name")
    .eq("enclosure_id", enclosureId)
    .limit(1)
    .returns<{ enclosure_name: string | null }[]>();
  return seen?.[0]?.enclosure_name ?? null;
}
