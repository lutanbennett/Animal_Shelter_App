import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import { canWriteMaintenance, loadMaintenanceJobs } from "@/lib/maintenance/queries";
import { loadTranslations } from "@/lib/translations/queries";
import { MaintenanceBoard } from "./MaintenanceBoard";

/**
 * /maintenance[?zone=…&enclosure=…&completed=all&assignee=me|all] — every
 * job, as a Kanban board on a desktop and a status-filtered list on a
 * phone. All jobs are loaded and filtered in the browser: the shelter's
 * open job count is dozens, not thousands, and it keeps the filters
 * instant.
 *
 * Staff and volunteers open on their own jobs ("what do I need to work
 * on"), management and admin on everyone's; a link that names a zone or
 * enclosure shows everything there. `assignee=` overrides either way.
 */
export default async function MaintenancePage(props: PageProps<"/maintenance">) {
  const searchParams = await props.searchParams;
  const { t } = await getT();
  const supabase = await createClient();

  const [{ data: role }, { data: auth }, { jobs, error }, options] = await Promise.all([
    supabase.rpc("current_user_role"),
    supabase.auth.getUser(),
    loadMaintenanceJobs(supabase),
    loadEnclosureOptions(supabase),
  ]);

  // Approved title translations, so a Thai reader's board reads in Thai
  // (0057). Only the title is on a card; the description is on the job.
  const titleTranslations = await loadTranslations(
    supabase,
    "maintenance",
    jobs.map((job) => job.id),
  );
  const titles: Record<string, { lang: "en" | "th"; text: string }> = {};
  for (const row of titleTranslations.values()) {
    if (row.column_name === "title" && row.status === "approved" && row.text) {
      titles[row.row_id] = { lang: row.target_lang, text: row.text };
    }
  }

  const param = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" && value ? value : null;
  };
  const assignee = param("assignee");
  const mine =
    assignee === "me" ||
    (assignee !== "all" &&
      !param("zone") &&
      !param("enclosure") &&
      (role === "staff" || role === "volunteer"));

  return (
    // min-w-0: the phone layout's status chips scroll sideways inside their
    // row; without it the row's intrinsic width would widen <main> (a flex
    // item defaults to min-width: auto) and the whole page with it.
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.maintenance.pageTitle}</h1>
        <p className="text-sm text-muted">{t.maintenance.pageSubtitle}</p>
      </div>

      {error && (
        <p className="text-sm text-danger">
          {t.maintenance.couldntLoad}: {error}
        </p>
      )}

      <MaintenanceBoard
        jobs={jobs}
        titles={titles}
        zones={options.zones}
        enclosures={options.enclosures}
        canWrite={canWriteMaintenance(role)}
        currentUserId={auth.user?.id ?? null}
        initialFilters={{
          zoneId: param("zone"),
          enclosureId: param("enclosure"),
          allCompleted: param("completed") === "all",
          mine,
        }}
      />
    </main>
  );
}
