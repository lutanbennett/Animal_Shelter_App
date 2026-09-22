import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import { AssistantDemo, type AssistantResident, type AssistantVet } from "./AssistantDemo";

/**
 * Demo assistant: a throwaway sketch to show the Director, not the real
 * thing (that is the "Assistant" item in docs/backlog.md). The page loads
 * the rows the keyword parser matches against — every non-deceased
 * resident, the physical enclosures, the vets — and hands them to the
 * client, which does the understanding; the writes go through the same
 * server-side operations the move page and the booking form use.
 */
export default async function AssistantPage() {
  const { t } = await getT();
  const supabase = await createClient();

  const [residentsResult, vetsResult, options] = await Promise.all([
    supabase
      .from("resident_list_view")
      .select(
        "resident_id, name, thai_name, resident_code, enclosure_id, enclosure_name, enclosure_name_th",
      )
      .or("current_status.neq.Deceased,current_status.is.null")
      .order("name")
      .returns<
        {
          resident_id: string;
          name: string;
          thai_name: string | null;
          resident_code: string;
          enclosure_id: string | null;
          enclosure_name: string | null;
          enclosure_name_th: string | null;
        }[]
      >(),
    supabase
      .from("vets")
      .select("id, name, clinic_name")
      .order("name")
      .returns<AssistantVet[]>(),
    loadEnclosureOptions(supabase),
  ]);

  const residents: AssistantResident[] = (residentsResult.data ?? []).map((r) => ({
    id: r.resident_id,
    name: r.name,
    thaiName: r.thai_name,
    code: r.resident_code,
    enclosureId: r.enclosure_id,
    enclosureName: r.enclosure_name,
    enclosureNameTh: r.enclosure_name_th,
  }));
  const loadError =
    residentsResult.error?.message ?? vetsResult.error?.message ?? options.error;

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
          {t.assistant.pageTitle}
          <span className="rounded-full border border-current px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
            {t.nav.demoBadge}
          </span>
        </h1>
        <p className="text-sm text-muted">{t.assistant.pageSubtitle}</p>
      </div>

      {loadError && (
        <p className="text-sm text-danger">
          {t.assistant.couldntLoad}: {loadError}
        </p>
      )}

      <AssistantDemo
        residents={residents}
        zones={options.zones}
        enclosures={options.enclosures}
        vets={vetsResult.data ?? []}
      />
    </main>
  );
}
