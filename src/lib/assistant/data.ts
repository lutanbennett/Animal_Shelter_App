import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadEnclosureOptions, type EnclosureOption, type ZoneOption } from "@/lib/enclosures/options";

/** Roles that may confirm a write. Volunteers get the lookups only. */
export const ASSISTANT_WRITE_ROLES = new Set(["admin", "management", "staff"]);
/** Roles the assistant opens for at all. The vet role is external (0070). */
export const ASSISTANT_ROLES = new Set([...ASSISTANT_WRITE_ROLES, "volunteer"]);

export function canUseAssistant(role: unknown): boolean {
  return typeof role === "string" && ASSISTANT_ROLES.has(role);
}

export function canWriteWithAssistant(role: unknown): boolean {
  return typeof role === "string" && ASSISTANT_WRITE_ROLES.has(role);
}

/** A resident as the parser matches it and the cards display it. */
export type AssistantResident = {
  id: string;
  name: string;
  thaiName: string | null;
  code: string;
  enclosureId: string | null;
  enclosureName: string | null;
  enclosureNameTh: string | null;
  status: string | null;
  /** For the "which one?" picker — the same thumbnail the enclosure hub shows. */
  photoFileId: string | null;
  /** Where a return from hospital puts them back, when they're in hospital. */
  hospitalPreviousEnclosureId: string | null;
};

export type AssistantVet = { id: string; name: string; clinic_name: string | null };

export type AssistantContext = {
  residents: AssistantResident[];
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  vets: AssistantVet[];
  role: string | null;
  canWrite: boolean;
  error: string | null;
};

type ListRow = {
  resident_id: string;
  name: string;
  thai_name: string | null;
  resident_code: string;
  current_status: string | null;
  enclosure_id: string | null;
  enclosure_name: string | null;
  enclosure_name_th: string | null;
};

/**
 * Everything the assistant matches a sentence against: every resident who
 * isn't deceased, the physical enclosures, the vets, and the caller's role.
 *
 * Loaded once and handed to the browser, where the parsing happens — so
 * "Panda" only resolves when a resident is actually called that, and no
 * keystroke needs a round trip. The rows are the ones the caller's own RLS
 * lets them see.
 *
 * `resident_list_view` carries neither the profile photo nor the enclosure
 * a hospitalised resident came from, so both come alongside it, keyed by
 * resident id — the same two-step the enclosure hub does for its
 * thumbnails.
 */
export async function loadAssistantContext(
  supabase: SupabaseClient,
): Promise<AssistantContext> {
  const [listResult, vetsResult, roleResult, options] = await Promise.all([
    supabase
      .from("resident_list_view")
      .select(
        "resident_id, name, thai_name, resident_code, current_status, enclosure_id, enclosure_name, enclosure_name_th",
      )
      .or("current_status.neq.Deceased,current_status.is.null")
      .order("name")
      .returns<ListRow[]>(),
    supabase
      .from("vets")
      .select("id, name, clinic_name")
      .order("name")
      .returns<AssistantVet[]>(),
    supabase.rpc("current_user_role"),
    loadEnclosureOptions(supabase),
  ]);

  const rows = listResult.data ?? [];
  const ids = rows.map((r) => r.resident_id);

  const [photosResult, stateResult] = await Promise.all([
    ids.length
      ? supabase
          .from("residents")
          .select("id, profile_photo_drive_file_id")
          .in("id", ids)
          .returns<{ id: string; profile_photo_drive_file_id: string | null }[]>()
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? supabase
          .from("resident_current_state")
          .select("resident_id, active_hospital_previous_enclosure")
          .in("resident_id", ids)
          .returns<
            { resident_id: string; active_hospital_previous_enclosure: string | null }[]
          >()
      : Promise.resolve({ data: [], error: null }),
  ]);

  const photoOf = new Map(
    (photosResult.data ?? []).map((r) => [r.id, r.profile_photo_drive_file_id]),
  );
  const previousOf = new Map(
    (stateResult.data ?? []).map((r) => [
      r.resident_id,
      r.active_hospital_previous_enclosure,
    ]),
  );

  const residents: AssistantResident[] = rows.map((r) => ({
    id: r.resident_id,
    name: r.name,
    thaiName: r.thai_name,
    code: r.resident_code,
    enclosureId: r.enclosure_id,
    enclosureName: r.enclosure_name,
    enclosureNameTh: r.enclosure_name_th,
    status: r.current_status,
    photoFileId: photoOf.get(r.resident_id) ?? null,
    // Only meaningful while they're actually in hospital; it is set on
    // every move as well (see the return page).
    hospitalPreviousEnclosureId:
      r.current_status === "Hospitalised"
        ? (previousOf.get(r.resident_id) ?? null)
        : null,
  }));

  const role = typeof roleResult.data === "string" ? roleResult.data : null;

  return {
    residents,
    zones: options.zones,
    enclosures: options.enclosures,
    vets: vetsResult.data ?? [],
    role,
    canWrite: canWriteWithAssistant(role),
    error:
      listResult.error?.message ??
      vetsResult.error?.message ??
      photosResult.error?.message ??
      stateResult.error?.message ??
      options.error,
  };
}
