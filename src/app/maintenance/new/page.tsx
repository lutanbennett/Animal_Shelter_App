import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import { canWriteMaintenance } from "@/lib/maintenance/queries";
import { MaintenanceForm } from "../MaintenanceForm";

/**
 * /maintenance/new[?enclosureId=…|?zoneId=…] — from the board's "Log
 * maintenance" button or an enclosure hub's Maintenance card (which
 * preselects the enclosure). Staff and admins only; volunteers can read
 * the board but not log jobs (RLS in 0001).
 */
export default async function NewMaintenancePage(props: PageProps<"/maintenance/new">) {
  const searchParams = await props.searchParams;
  const { t } = await getT();
  const supabase = await createClient();

  const [{ data: role }, options] = await Promise.all([
    supabase.rpc("current_user_role"),
    loadEnclosureOptions(supabase),
  ]);

  if (!canWriteMaintenance(role)) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.maintenance.newJob}</h1>
        <p className="text-sm text-muted">{t.maintenance.detail.readOnly}</p>
        <Link href="/maintenance" className="text-sm font-medium text-primary hover:underline">
          {t.maintenance.backToBoard}
        </Link>
      </main>
    );
  }

  const enclosureId =
    typeof searchParams.enclosureId === "string" ? searchParams.enclosureId : null;
  const zoneId = typeof searchParams.zoneId === "string" ? searchParams.zoneId : null;
  const enclosure = enclosureId
    ? options.enclosures.find((e) => e.id === enclosureId) ?? null
    : null;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={enclosure ? `/enclosures/${enclosure.id}` : "/maintenance"}
        className="text-sm text-muted hover:text-foreground"
      >
        {enclosure
          ? t.maintenance.backToEnclosure(enclosure.name)
          : t.maintenance.backToBoard}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.maintenance.newJob}</h1>
        <p className="text-sm text-muted">{t.maintenance.newJobSubtitle}</p>
      </div>

      {options.error && (
        <p className="text-sm text-danger">
          {t.enclosures.couldntLoadEnclosures}: {options.error}
        </p>
      )}

      <MaintenanceForm
        mode="create"
        zones={options.zones}
        enclosures={options.enclosures}
        preselectedEnclosureId={enclosure?.id ?? null}
        preselectedZoneId={zoneId}
        cancelHref={enclosure ? `/enclosures/${enclosure.id}` : "/maintenance"}
      />
    </main>
  );
}
