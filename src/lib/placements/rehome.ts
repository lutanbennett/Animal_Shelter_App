import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import { CARER_CONTACT_TYPE } from "@/lib/contacts/carers";
import { isFutureDate, isIsoDate, placementStartDate } from "./dates";

/** Names of the Lifecycle pseudo-enclosures for residents living with a carer. */
export const FOSTERED_ENCLOSURE = "Fostered";
export const ADOPTED_ENCLOSURE = "Adopted";

export type RehomeKind = "foster" | "adopt";

/** Details for a carer created on the spot, when none of the existing ones fit. */
export type NewCarer = {
  name: string;
  phone: string | null;
  email: string | null;
  lineId: string | null;
};

export type RehomeResidentInput = {
  residentId: string;
  kind: RehomeKind;
  /** An existing contact of type Carer; ignored when newCarer is given. */
  carerId: string | null;
  newCarer: NewCarer | null;
  /** YYYY-MM-DD from a date input. */
  date: string;
  notes: string | null;
};

export type RehomeResidentResult = { error: string } | { ok: true };

export type ReturnToShelterInput = {
  residentId: string;
  /** The physical enclosure they're coming back into. */
  enclosureId: string;
  /** YYYY-MM-DD from a date input. */
  date: string;
  notes: string | null;
};

export type ReturnToShelterResult = { error: string } | { ok: true };

/**
 * Roles whose placement_history insert policy admits Foster / Adopt /
 * ReturnToShelter — the same boundary as hospital placements
 * (docs/decisions.md, "Volunteer tier").
 */
export const REHOME_ROLES = new Set(["admin", "management", "staff"]);

const KIND_ENCLOSURE: Record<RehomeKind, string> = {
  foster: FOSTERED_ENCLOSURE,
  adopt: ADOPTED_ENCLOSURE,
};

const KIND_PLACEMENT_TYPE: Record<RehomeKind, "Foster" | "Adopt"> = {
  foster: "Foster",
  adopt: "Adopt",
};

/**
 * Records a Foster or Adopt placement into the matching Lifecycle
 * pseudo-enclosure with the carer on the row, so resident_current_state
 * reports the status and current_carer_id. previous_enclosure_id is the
 * enclosure they left, so a later ReturnToShelter can offer it back.
 *
 * Allowed from anywhere but Adopted (adoption ends the chain — return to
 * the shelter first) and Deceased. A fostered resident can be adopted or
 * moved to a different carer through the same call; sending them to the
 * carer they're already with is rejected as a no-op. Hospitalised
 * residents are allowed so a fostered animal treated by the shelter can go
 * straight back to its carer.
 *
 * A carer can be created inline (newCarer) when the right person isn't in
 * contacts yet. That's a second statement rather than one transaction: if
 * the placement then fails, the contact stays, which is harmless — they
 * are a real carer either way.
 */
export async function rehomeResident(
  supabase: SupabaseClient,
  t: Dictionary,
  input: RehomeResidentInput,
): Promise<RehomeResidentResult> {
  const errors = t.residents.rehome.errors;

  // RLS would reject the insert for a vet or volunteer with a raw policy
  // error — say why.
  const { data: role } = await supabase.rpc("current_user_role");
  if (typeof role !== "string" || !REHOME_ROLES.has(role)) {
    return { error: t.residents.rehome.notAuthorized };
  }

  if (input.kind !== "foster" && input.kind !== "adopt") {
    return { error: errors.selectKind };
  }
  if (!input.newCarer && !input.carerId) return { error: errors.selectCarer };
  if (input.newCarer && !input.newCarer.name) {
    return { error: errors.newCarerName };
  }
  if (!isIsoDate(input.date)) return { error: errors.enterDate };
  const now = new Date();
  if (isFutureDate(input.date, now)) return { error: errors.dateInFuture };

  const [targetResult, currentResult, stateResult, carerResult] =
    await Promise.all([
      supabase
        .from("enclosures")
        .select("id, zone_id, zones!inner(name)")
        .eq("name", KIND_ENCLOSURE[input.kind])
        .eq("zones.name", SYSTEM_ZONE)
        .limit(1)
        .returns<{ id: string; zone_id: string }[]>(),
      supabase
        .from("placement_history")
        .select("enclosure_id, carer_id, start_date")
        .eq("resident_id", input.residentId)
        .is("end_date", null)
        .limit(1)
        .returns<
          { enclosure_id: string | null; carer_id: string | null; start_date: string }[]
        >(),
      supabase
        .from("resident_current_state")
        .select("current_status, is_deceased")
        .eq("resident_id", input.residentId)
        .limit(1)
        .returns<{ current_status: string | null; is_deceased: boolean }[]>(),
      input.carerId && !input.newCarer
        ? supabase
            .from("contacts")
            .select("id, type")
            .eq("id", input.carerId)
            .limit(1)
            .returns<{ id: string; type: string }[]>()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (targetResult.error) return { error: targetResult.error.message };
  if (currentResult.error) return { error: currentResult.error.message };
  if (stateResult.error) return { error: stateResult.error.message };
  if (carerResult.error) return { error: carerResult.error.message };

  const target = targetResult.data?.[0];
  if (!target) return { error: errors.enclosureNotFound(KIND_ENCLOSURE[input.kind]) };

  const state = stateResult.data?.[0];
  if (!state) return { error: errors.residentNotFound };
  if (state.is_deceased) return { error: errors.deceased };
  if (state.current_status === "Adopted") {
    return {
      error: input.kind === "adopt" ? errors.alreadyAdopted : errors.adoptedNoFoster,
    };
  }

  // The check_carer_type trigger would reject a non-Carer contact too, but
  // with a raw exception rather than something a person can act on.
  if (!input.newCarer) {
    const carer = carerResult.data?.[0];
    if (!carer) return { error: errors.carerNotFound };
    if (carer.type !== CARER_CONTACT_TYPE) return { error: errors.carerNotCarer };
  }

  const current = currentResult.data?.[0];
  if (
    input.kind === "foster" &&
    state.current_status === "Fostered" &&
    !input.newCarer &&
    current?.carer_id === input.carerId
  ) {
    return { error: errors.sameCarer };
  }

  const startDate = placementStartDate(input.date, now);
  // end_after_start on the prior row would reject this anyway, but with a
  // constraint name rather than something a person can act on.
  if (current && new Date(startDate) <= new Date(current.start_date)) {
    return { error: errors.dateBeforeCurrent };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let carerId = input.carerId;
  if (input.newCarer) {
    const { data: created, error } = await supabase
      .from("contacts")
      .insert({
        name: input.newCarer.name,
        type: CARER_CONTACT_TYPE,
        phone: input.newCarer.phone,
        email: input.newCarer.email,
        line_id: input.newCarer.lineId,
      })
      .select("id")
      .single<{ id: string }>();
    if (error) return { error: error.message };
    carerId = created.id;
  }

  const { error } = await supabase.from("placement_history").insert({
    resident_id: input.residentId,
    placement_type: KIND_PLACEMENT_TYPE[input.kind],
    start_date: startDate,
    zone_id: target.zone_id,
    enclosure_id: target.id,
    previous_enclosure_id: current?.enclosure_id ?? null,
    carer_id: carerId,
    notes: input.notes,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  return { ok: true };
}

/**
 * Records a ReturnToShelter placement into a physical enclosure for a
 * fostered or adopted resident. The form defaults to the enclosure stored
 * as previous_enclosure_id on the Foster / Adopt row (where they were
 * before leaving), but any physical enclosure is accepted — like a return
 * from hospital. previous_enclosure_id on the new row is the Fostered /
 * Adopted pseudo-enclosure, so the history reads "Fostered → Kennel 3".
 * No carer on the row, so current_carer_id clears.
 */
export async function returnResidentToShelter(
  supabase: SupabaseClient,
  t: Dictionary,
  input: ReturnToShelterInput,
): Promise<ReturnToShelterResult> {
  const errors = t.residents.shelterReturn.errors;

  // RLS would reject the insert for a vet or volunteer with a raw policy
  // error — say why.
  const { data: role } = await supabase.rpc("current_user_role");
  if (typeof role !== "string" || !REHOME_ROLES.has(role)) {
    return { error: t.residents.shelterReturn.notAuthorized };
  }

  if (!input.enclosureId) return { error: errors.selectEnclosure };
  if (!isIsoDate(input.date)) return { error: errors.enterDate };
  const now = new Date();
  if (isFutureDate(input.date, now)) return { error: errors.dateInFuture };

  const [targetResult, currentResult, stateResult] = await Promise.all([
    supabase
      .from("enclosures")
      .select("id, zone_id, zones!inner(name)")
      .eq("id", input.enclosureId)
      .limit(1)
      .returns<{ id: string; zone_id: string; zones: { name: string } }[]>(),
    supabase
      .from("placement_history")
      .select("enclosure_id, start_date")
      .eq("resident_id", input.residentId)
      .is("end_date", null)
      .limit(1)
      .returns<{ enclosure_id: string | null; start_date: string }[]>(),
    supabase
      .from("resident_current_state")
      .select("current_status, is_deceased")
      .eq("resident_id", input.residentId)
      .limit(1)
      .returns<{ current_status: string | null; is_deceased: boolean }[]>(),
  ]);

  if (targetResult.error) return { error: targetResult.error.message };
  if (currentResult.error) return { error: currentResult.error.message };
  if (stateResult.error) return { error: stateResult.error.message };

  const target = targetResult.data?.[0];
  if (!target) return { error: errors.enclosureNotFound };
  if (target.zones.name === SYSTEM_ZONE) return { error: errors.systemEnclosure };

  const state = stateResult.data?.[0];
  if (!state) return { error: errors.residentNotFound };
  if (state.is_deceased) return { error: errors.deceased };
  if (state.current_status !== "Fostered" && state.current_status !== "Adopted") {
    return { error: errors.notWithCarer };
  }

  const current = currentResult.data?.[0];
  const startDate = placementStartDate(input.date, now);
  // end_after_start on the prior row would reject this anyway, but with a
  // constraint name rather than something a person can act on.
  if (current && new Date(startDate) <= new Date(current.start_date)) {
    return { error: errors.dateBeforeLeft };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("placement_history").insert({
    resident_id: input.residentId,
    placement_type: "ReturnToShelter",
    start_date: startDate,
    zone_id: target.zone_id,
    enclosure_id: target.id,
    previous_enclosure_id: current?.enclosure_id ?? null,
    notes: input.notes,
    created_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  return { ok: true };
}
