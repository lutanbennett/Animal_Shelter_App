import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import { canWriteMaintenance, loadMaintenanceJobs } from "@/lib/maintenance/queries";
import { MaintenanceBoard } from "./MaintenanceBoard";

/**
 * /maintenance[?zone=…&enclosure=…&completed=all] — every job, as a
 * Kanban board on a desktop and a status-filtered list on a phone. All
 * jobs are loaded and filtered in the browser: the shelter's open job
 * count is dozens, not thousands, and it keeps the filters instant.
 */
export default async function MaintenancePage(props: PageProps<"/maintenance">) {
  const searchParams = await props.searchParams;
  const { t } = await getT();
  const supabase = await createClient();

  const [{ data: role }, { jobs, error }, options] = await Promise.all([
    supabase.rpc("current_user_role"),
    loadMaintenanceJobs(supabase),
    loadEnclosureOptions(supabase),
  ]);

  const param = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" && value ? value : null;
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
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
        zones={options.zones}
        enclosures={options.enclosures}
        canWrite={canWriteMaintenance(role)}
        initialFilters={{
          zoneId: param("zone"),
          enclosureId: param("enclosure"),
          allCompleted: param("completed") === "all",
        }}
      />
    </main>
  );
}
