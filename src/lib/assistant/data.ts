import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadEnclosureOptions, type EnclosureOption, type ZoneOption } from "@/lib/enclosures/options";
import { can, type Permissions } from "@/lib/permissions/can";
import { NOT_DECEASED } from "@/lib/residents/status";
import { loadCarerOptions, type CarerOption } from "@/lib/contacts/carers";
import { loadDoctorNamesByClinic, type DoctorNamesByClinic } from "@/lib/clinics/doctors";
import { DRAFT_KINDS, toolNeeds } from "./llm-tools";

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

export type AssistantImmunizationType = { id: string; name: string; nameTh: string | null };

export type AssistantClinic = { id: string; name: string };

/** A medicine the prescription card may pick, with the unit its amount is counted in. */
export type AssistantMedication = { id: string; name: string; nameTh: string | null; doseUnit: string };

/** One of the medication rounds (0137), in the order the prescription form shows them. */
export type AssistantRound = { id: string; key: string; name: string; nameTh: string | null };

export type AssistantContext = {
  residents: AssistantResident[];
  zones: ZoneOption[];
  enclosures: EnclosureOption[];
  clinics: AssistantClinic[];
  /** Carers not archived: the foster / adopt card matches against these. */
  carers: CarerOption[];
  /** The vaccines the immunization card offers. */
  immunizationTypes: AssistantImmunizationType[];
  /** Each clinic's active doctors, for the clinic card's optional Doctor field. */
  doctors: DoctorNamesByClinic;
  /** The medicines the prescription card offers. Empty without `medical.prescriptions`. */
  medications: AssistantMedication[];
  /** Morning / Lunch / Evening / Night, for the prescription card's ticks. Empty likewise. */
  rounds: AssistantRound[];
  /** assistant.ask: the assistant opens at all (the doctor's role is external, 0070). */
  canAsk: boolean;
  /** assistant.record: may confirm a write; without it, lookups only. */
  canWrite: boolean;
  /**
   * For every extra activity a tool declares in its own spec (`needs` in
   * llm-tools.ts), whether this login holds it — `medical.prescriptions`
   * today. The browser asks this before drawing that tool's card, so nobody
   * is offered a button its write would refuse (CLAUDE.md, "A button is
   * shown only if the login's cards let it do that action"). A key that is
   * absent reads as no.
   */
  toolCards: Readonly<Record<string, boolean>>;
  error: string | null;
};

/** The answer to every `needs` any tool declares, for this login. */
function toolCardsOf(perms: Permissions): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const kind of DRAFT_KINDS) {
    const needs = toolNeeds(kind);
    if (needs) out[needs] = can(perms, needs, "edit");
  }
  return out;
}

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
 * The context handed to a role the assistant does not open for: no rows at
 * all, so nothing is loaded that the caller could not have asked for
 * through the assistant anyway. `error` is the caller's to fill in.
 */
export function emptyAssistantContext(
  error: string | null = null,
): AssistantContext {
  return { residents: [], zones: [], enclosures: [], clinics: [], carers: [], immunizationTypes: [], doctors: {}, medications: [], rounds: [], canAsk: false, canWrite: false, toolCards: {}, error };
}

/**
 * Everything the assistant matches a sentence against: every resident who
 * isn't deceased, the physical enclosures and the clinics.
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
 *
 * It does no check of its own: the caller checks `can(perms, "assistant.ask")`
 * and only then loads, so a doctor never gets the rows by asking directly
 * (docs/decisions.md, 2026-09-25).
 */
export async function loadAssistantContext(
  supabase: SupabaseClient,
  perms: Permissions,
): Promise<AssistantContext> {
  const [listResult, clinicsResult, options, doctors, carerResult, typesResult] = await Promise.all([
    supabase
      .from("resident_list_view")
      .select(
        "resident_id, name, thai_name, resident_code, current_status, enclosure_id, enclosure_name, enclosure_name_th",
      )
      .or(NOT_DECEASED)
      .order("name")
      .returns<ListRow[]>(),
    supabase
      .from("clinics")
      .select("id, name")
      .order("name")
      .returns<AssistantClinic[]>(),
    loadEnclosureOptions(supabase),
    loadDoctorNamesByClinic(supabase),
    loadCarerOptions(supabase),
    supabase
      .from("picker_immunization_types")
      .select("id, name, name_th")
      .order("name")
      .returns<{ id: string; name: string; name_th: string | null }[]>(),
  ]);

  // The prescription tool's own rows, loaded only for a login that holds the
  // activity its write asks for. Someone who could never press Confirm is
  // not offered the tool, so there is nothing for them to fill in either.
  const toolCards = toolCardsOf(perms);
  const [medicationResult, roundResult] = toolCards["medical.prescriptions"]
    ? await Promise.all([
        supabase
          .from("picker_medications")
          .select("id, name, name_th, dose_unit")
          .order("name")
          .returns<{ id: string; name: string; name_th: string | null; dose_unit: string }[]>(),
        supabase
          .from("rounds")
          .select("id, key, name, name_th")
          .eq("for_medication", true)
          .order("sort_order")
          .returns<{ id: string; key: string; name: string; name_th: string | null }[]>(),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];

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

  return {
    residents,
    zones: options.zones,
    enclosures: options.enclosures,
    clinics: clinicsResult.data ?? [],
    carers: carerResult.carers,
    immunizationTypes: (typesResult.data ?? []).map((ty) => ({ id: ty.id, name: ty.name, nameTh: ty.name_th })),
    doctors,
    medications: (medicationResult.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      nameTh: m.name_th,
      doseUnit: m.dose_unit,
    })),
    rounds: (roundResult.data ?? []).map((r) => ({ id: r.id, key: r.key, name: r.name, nameTh: r.name_th })),
    canAsk: true,
    canWrite: can(perms, "assistant.record"),
    toolCards,
    error:
      listResult.error?.message ??
      clinicsResult.error?.message ??
      photosResult.error?.message ??
      stateResult.error?.message ??
      typesResult.error?.message ??
      medicationResult.error?.message ??
      roundResult.error?.message ??
      options.error,
  };
}
