"use server";

import { databaseFailure, runWriteAction, type ActionResult } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import { isFutureDate, isIsoDate } from "@/lib/placements/dates";

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

// PI FAILOVER (D), 2026-11-01: the one write here goes through runWriteAction() (docs/decisions/2026-11-01-write-paths-tail-a.md).
export type ImmunizationFormState = ActionResult<{ records: ImmunizationRecordResult[] }> | undefined;

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
  immunization_types: { name: string; name_th: string | null; interval_months: number | null } | null;
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
  const { t, locale } = await getT();
  const supabase = await createClient();
  return runWriteAction<{ records: ImmunizationRecordResult[] }>(
    "immunizations.record",
    {
      somethingWentWrong: t.common.somethingWentWrong,
      saveUnknown: t.common.saveUnknown,
      reloadToSave: t.common.reloadToSave,
    },
    { id: writeRequestIdFrom(formData), action: "immunizations.record", db: supabase },
    async () => {
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
        return { ok: false, error: t.immunizations.errors.selectResident };
      }
      if (immunizationTypeIds.length === 0) {
        return { ok: false, error: t.immunizations.errors.selectType };
      }
      if (typeof dateAdministered !== "string" || !dateAdministered) {
        return { ok: false, error: t.immunizations.errors.enterDate };
      }

      if (
        !isIsoDate(dateAdministered) ||
        Number.isNaN(new Date(dateAdministered).getTime())
      ) {
        return { ok: false, error: t.immunizations.errors.invalidDate };
      }
      if (isFutureDate(dateAdministered, new Date())) {
        return { ok: false, error: t.immunizations.errors.dateInFuture };
      }

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

      if (error) return databaseFailure("immunizations.record", error, t.common);

      const rows = (data ?? []) as FanoutRow[];
      if (rows.length === 0) {
        return { ok: true, records: [] };
      }

      const { data: enrichedData, error: enrichError } = await supabase
        .from("immunization_records")
        .select(
          "id, resident_id, date_administered, immunization_type_id, residents(name), immunization_types:picker_immunization_types(name, name_th, interval_months)",
        )
        .in(
          "id",
          rows.map((r) => r.id),
        )
        .returns<EnrichedRow[]>();

      if (enrichError) {
        return { ok: false, error: enrichError.message };
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
              (row.immunization_types && localLabel(locale, row.immunization_types.name, row.immunization_types.name_th)) ||
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

      return { ok: true, records };    },
  );
}
