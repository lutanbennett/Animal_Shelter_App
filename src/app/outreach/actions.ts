"use server";

import { revalidatePath } from "next/cache";
import { databaseFailure, runAction, type ActionResult } from "@/lib/action-result";
import { createClient } from "@/lib/supabase/server";
import { getDriveClient } from "@/lib/google/drive";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { todayIso } from "@/lib/format";
import { HELP_KINDS, isPlaceKind, type HelpKind } from "@/lib/outreach/outings";

/*
 * Outreach visit notes (0169). Every write is the person's own session, so
 * RLS asks the community.outings cell as well; the can() checks here are
 * there to answer in words rather than with a bare "nothing changed".
 * The public figures read these rows, so every change revalidates the home
 * page too.
 */

const refuse = (error: string) => ({ ok: false as const, error });

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function revalidateOutreach(outingId?: string) {
  revalidatePath("/outreach");
  if (outingId) revalidatePath(`/outreach/${outingId}/edit`);
  // community_dogs and villages_sterilised count these rows (0169).
  revalidatePath("/");
}

type T = Awaited<ReturnType<typeof getT>>["t"];
type Supabase = Awaited<ReturnType<typeof createClient>>;

type OutingFields = {
  outing_on: string;
  place_id: string;
  dog_count: number;
  sterilised_count: number | null;
  note: string | null;
} & Record<HelpKind, boolean>;

/**
 * The place is either one picked from the list or a new one typed on the
 * form, which is added first: the list grows from the form (0169). A new
 * name that matches a live place, ignoring case, uses that place rather than
 * failing on the unique index.
 */
async function resolvePlace(
  supabase: Supabase,
  formData: FormData,
  t: T,
): Promise<{ placeId: string } | { error: string }> {
  const e = t.outreach.errors;
  const picked = str(formData, "placeId");
  if (picked && picked !== "new") return { placeId: picked };

  const name = str(formData, "newPlaceName");
  const kind = str(formData, "newPlaceKind");
  if (!name) return { error: e.place };
  if (name.length > 120) return { error: e.placeName };
  if (!isPlaceKind(kind)) return { error: e.placeKind };

  const { data: existing } = await supabase
    .from("community_places")
    .select("id, name")
    .is("archived_at", null)
    .returns<{ id: string; name: string }[]>();
  const match = (existing ?? []).find((p) => p.name.trim().toLowerCase() === name.toLowerCase());
  if (match) return { placeId: match.id };

  const { data, error } = await supabase
    .from("community_places")
    .insert({ name, kind })
    .select("id")
    .limit(1)
    .returns<{ id: string }[]>();
  if (error) return { error: databaseFailure("outreach.addPlace", error, t.common).error };
  if (!data?.[0]) return { error: e.notAuthorized };
  return { placeId: data[0].id };
}

/** Everything but the place, checked the way the table's constraints check it, in words. */
function parseOuting(formData: FormData, t: T): Omit<OutingFields, "place_id"> | { error: string } {
  const e = t.outreach.errors;
  const date = str(formData, "outingOn");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { error: e.date };
  if (date > todayIso()) return { error: e.futureDate };

  const ticks = Object.fromEntries(HELP_KINDS.map((k) => [k, formData.get(k) === "on"])) as Record<HelpKind, boolean>;
  if (!HELP_KINDS.some((k) => ticks[k])) return { error: e.someHelp };

  const rawCount = str(formData, "dogCount");
  if (!rawCount || !/^\d{1,5}$/.test(rawCount) || Number(rawCount) < 1) return { error: e.dogCount };
  const dogCount = Number(rawCount);

  // A sterilised tick also says how many: an outing that feeds twenty and
  // sterilises three adds three to the sterilisations figure, not twenty (0169).
  let sterilisedCount: number | null = null;
  if (ticks.sterilised) {
    const raw = str(formData, "sterilisedCount");
    const n = raw && /^\d{1,5}$/.test(raw) ? Number(raw) : NaN;
    if (!(n >= 1 && n <= dogCount)) return { error: e.sterilisedCount(dogCount) };
    sterilisedCount = n;
  }

  const note = str(formData, "note");
  if (note && note.length > 2000) return { error: e.noteTooLong };

  return { outing_on: date, dog_count: dogCount, sterilised_count: sterilisedCount, note, ...ticks };
}

export async function createOuting(formData: FormData): Promise<ActionResult<{ outingId: string }>> {
  const { t } = await getT();
  return runAction("outreach.createOuting", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "community.outings")) return refuse(t.outreach.errors.notAuthorized);
    const fields = parseOuting(formData, t);
    if ("error" in fields) return refuse(fields.error);

    const supabase = await createClient();
    const place = await resolvePlace(supabase, formData, t);
    if ("error" in place) return refuse(place.error);

    const { data, error } = await supabase
      .from("community_dog_outings")
      .insert({ ...fields, place_id: place.placeId })
      .select("id")
      .limit(1)
      .returns<{ id: string }[]>();
    if (error) return databaseFailure("outreach.createOuting", error, t.common);
    const row = data?.[0];
    if (!row) return refuse(t.outreach.errors.notAuthorized);

    revalidateOutreach(row.id);
    return { ok: true, outingId: row.id };
  });
}

export async function updateOuting(formData: FormData): Promise<ActionResult<{ outingId: string }>> {
  const { t } = await getT();
  return runAction("outreach.updateOuting", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "community.outings")) return refuse(t.outreach.errors.notAuthorized);
    const outingId = str(formData, "outingId");
    if (!outingId) return refuse(t.outreach.errors.notFound);
    const fields = parseOuting(formData, t);
    if ("error" in fields) return refuse(fields.error);

    const supabase = await createClient();
    const place = await resolvePlace(supabase, formData, t);
    if ("error" in place) return refuse(place.error);

    const { data, error } = await supabase
      .from("community_dog_outings")
      .update({ ...fields, place_id: place.placeId })
      .eq("id", outingId)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return databaseFailure("outreach.updateOuting", error, t.common);
    // RLS filters rather than rejects: no row back is a refusal or a stale id.
    if (!data?.length) return refuse(t.outreach.errors.notFound);

    revalidateOutreach(outingId);
    return { ok: true, outingId };
  });
}

/**
 * Removes a note and its photo rows (on delete cascade), then puts the
 * photos' Drive files in the bin. The database goes first and is the record;
 * a Drive failure after that leaves an orphaned file, not a wrong figure.
 */
export async function deleteOuting(outingId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("outreach.deleteOuting", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "community.outings")) return refuse(t.outreach.errors.notAuthorized);
    const supabase = await createClient();
    const { data: photos } = await supabase
      .from("community_outing_photos")
      .select("drive_file_id")
      .eq("outing_id", outingId)
      .returns<{ drive_file_id: string }[]>();

    const { data, error } = await supabase
      .from("community_dog_outings")
      .delete()
      .eq("id", outingId)
      .select("id")
      .returns<{ id: string }[]>();
    if (error) return databaseFailure("outreach.deleteOuting", error, t.common);
    if (!data?.length) return refuse(t.outreach.errors.notFound);

    if (photos?.length) {
      const drive = getDriveClient();
      await Promise.all(
        photos.map((p) =>
          drive.trashFile(p.drive_file_id).catch((err) => console.error("[outreach.deleteOuting] drive", err)),
        ),
      );
    }
    revalidateOutreach();
    return { ok: true };
  });
}

/**
 * Records that a photo may be shown on the website. Nothing public reads it
 * yet (0169: anon has no grant, and is_public_drive_file() does not know the
 * table), so this is the Director's "never public unless ticked" kept as a
 * recorded wish until a public view exists.
 */
export async function setOutingPhotoPublic(photoId: string, isPublic: boolean): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("outreach.setOutingPhotoPublic", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "community.outings")) return refuse(t.outreach.errors.notAuthorized);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("community_outing_photos")
      .update({ is_public: isPublic })
      .eq("id", photoId)
      .select("outing_id")
      .returns<{ outing_id: string }[]>();
    if (error) return databaseFailure("outreach.setOutingPhotoPublic", error, t.common);
    if (!data?.[0]) return refuse(t.outreach.errors.photoNotFound);
    revalidateOutreach(data[0].outing_id);
    return { ok: true };
  });
}

export async function deleteOutingPhoto(photoId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("outreach.deleteOutingPhoto", t.common.somethingWentWrong, async () => {
    if (!can(await loadPermissions(), "community.outings")) return refuse(t.outreach.errors.notAuthorized);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("community_outing_photos")
      .delete()
      .eq("id", photoId)
      .select("outing_id, drive_file_id")
      .returns<{ outing_id: string; drive_file_id: string }[]>();
    if (error) return databaseFailure("outreach.deleteOutingPhoto", error, t.common);
    const row = data?.[0];
    if (!row) return refuse(t.outreach.errors.photoNotFound);
    try {
      await getDriveClient().trashFile(row.drive_file_id);
    } catch (err) {
      // The row is gone; an orphaned Drive file is a cleanup, not a wrong record.
      console.error("[outreach.deleteOutingPhoto] drive", err);
    }
    revalidateOutreach(row.outing_id);
    return { ok: true };
  });
}
