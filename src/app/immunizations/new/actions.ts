"use server";

import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";

export type ImmunizationRecordResult = {
  id: string;
  residentId: string;
  residentName: string;
  immunizationTypeId: string;
  immunizationTypeName: string;
  dateAdministered: string;
  intervalMonths: number | null;
  nextDueDate: string | null;
};

export type ImmunizationFormState =
  | { error: string }
  | { success: true; records: ImmunizationRecordResult[] }
  | undefined;

type FanoutRow = {
  id: string;
  resident_id: string;
  immunization_type_id: string;
  date_administered: string;
};

type EnrichedRow = {
  id: string;
  resident_id: string;
  date_administered: string;
  immunization_type_id: string;
  residents: { name: string } | null;
  immunization_types: { name: string; interval_months: number | null } | null;
};

/** Adds whole months to an ISO (YYYY-MM-DD) date string, in UTC to avoid
 * local-timezone drift, and returns the result as an ISO date string. */
function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export async function recordImmunizations(
  _state: ImmunizationFormState,
  formData: FormData,
): Promise<ImmunizationFormState> {
  const { t } = await getT();
  const residentIds = formData
    .getAll("residentIds")
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const immunizationTypeIds = formData
    .getAll("immunizationTypeIds")
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  const dateAdministered = formData.get("dateAdministered");
  const administeredBy = formData.get("administeredBy");
  const notes = formData.get("notes");

  if (residentIds.length === 0) {
    return { error: t.immunizations.errors.selectResident };
  }
  if (immunizationTypeIds.length === 0) {
    return { error: t.immunizations.errors.selectType };
  }
  if (typeof dateAdministered !== "string" || !dateAdministered) {
    return { error: t.immunizations.errors.enterDate };
  }

  const parsedDate = new Date(dateAdministered);
  if (Number.isNaN(parsedDate.getTime())) {
    return { error: t.immunizations.errors.invalidDate };
  }
  if (parsedDate.getTime() > Date.now()) {
    return { error: t.immunizations.errors.dateInFuture };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_immunizations_fanout", {
    p_resident_ids: residentIds,
    p_immunization_type_ids: immunizationTypeIds,
    p_date_administered: dateAdministered,
    p_administered_by:
      typeof administeredBy === "string" && administeredBy
        ? administeredBy
        : null,
    p_notes: typeof notes === "string" && notes ? notes : null,
  });

  if (error) {
    return { error: error.message };
  }

  const rows = (data ?? []) as FanoutRow[];
  if (rows.length === 0) {
    return { success: true, records: [] };
  }

  const { data: enrichedData, error: enrichError } = await supabase
    .from("immunization_records")
    .select(
      "id, resident_id, date_administered, immunization_type_id, residents(name), immunization_types(name, interval_months)",
    )
    .in(
      "id",
      rows.map((r) => r.id),
    )
    .returns<EnrichedRow[]>();

  if (enrichError) {
    return { error: enrichError.message };
  }

  const records: ImmunizationRecordResult[] = (enrichedData ?? [])
    .map((row) => {
      const intervalMonths = row.immunization_types?.interval_months ?? null;
      return {
        id: row.id,
        residentId: row.resident_id,
        residentName:
          row.residents?.name ?? t.immunizations.resultTable.unknownResident,
        immunizationTypeId: row.immunization_type_id,
        immunizationTypeName:
          row.immunization_types?.name ??
          t.immunizations.resultTable.unknownImmunization,
        dateAdministered: row.date_administered,
        intervalMonths,
        nextDueDate:
          intervalMonths != null
            ? addMonthsIso(row.date_administered, intervalMonths)
            : null,
      };
    })
    .sort(
      (a, b) =>
        a.residentName.localeCompare(b.residentName) ||
        a.immunizationTypeName.localeCompare(b.immunizationTypeName),
    );

  return { success: true, records };
}
