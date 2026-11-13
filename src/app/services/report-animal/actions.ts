"use server";

// write-requests: row-keyed -- the visitor writes as anon, so claim_write_request() has no auth.uid() to claim as.
// The browser's request id is the report row's own id (the desexing sign-up's pattern, 0297): a replay hits the primary key
// (23505) and is answered as done, so it takes no second row.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { databaseFailure, runAction, type ActionRefusal, type ActionResult } from "@/lib/action-result";
import { getT } from "@/lib/i18n/get-t";
import { checkReport, type ReportFields } from "@/lib/animal-reports/form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const refuse = (error: string): ActionRefusal => ({ ok: false, error });

/**
 * The public report (0372). Written as the anon role on purpose, never as whoever's session the request carries, so a
 * signed-in staff member trying the form gets exactly what a visitor gets. The insert asks for nothing back, because
 * anon has no SELECT on reports and the page must never echo a person's details. This page cannot be hidden
 * (docs/decisions/2026-11-13-report-an-animal.md), so there is no hidden-page check here.
 */
export async function reportAnAnimal(fields: ReportFields, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  return runAction("animalReport.submit", t.common.somethingWentWrong, async () => {
    if (!UUID.test(requestId)) return refuse(t.common.somethingWentWrong("animalReport.submit"));
    const checked = checkReport(fields);
    if (!checked.ok) return refuse(t.animalReport.errors[checked.problem]);

    const anon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { error } = await anon.from("animal_reports").insert({ id: requestId, ...checked.report });
    // 23505: the same request id arrived twice at once and the first wrote the row. That is done, not an error.
    if (error && error.code !== "23505") return databaseFailure("animalReport.submit", error, t.common);
    return { ok: true };
  });
}
