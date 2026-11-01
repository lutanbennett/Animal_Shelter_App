"use server";

import { runWriteAction, type ActionResult } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { writeImmunizations, type ImmunizationRecordResult } from "@/lib/immunizations/record";

export type { ImmunizationRecordResult };

// PI FAILOVER (D), 2026-11-01: the one write here goes through runWriteAction() (docs/decisions/2026-11-01-write-paths-tail-a.md).
export type ImmunizationFormState = ActionResult<{ records: ImmunizationRecordResult[] }> | undefined;

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
    () => writeImmunizations(supabase, t, locale, formData),
  );
}
