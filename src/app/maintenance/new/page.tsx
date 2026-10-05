import Link from "next/link";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { placeName } from "@/lib/enclosures/names";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import { loadAssignableUsers } from "@/lib/auth/app-users";
import { MaintenanceForm } from "../MaintenanceForm";

/**
 * /maintenance/new[?enclosureId=…|?zoneId=…] — from the board's "Log
 * maintenance" button or an enclosure hub's Maintenance card (which
 * preselects the enclosure). Staff and admins only; volunteers can read
 * the board but not log jobs (RLS in 0001).
 */
export default async function NewMaintenancePage(props: PageProps<"/maintenance/new">) {
  const searchParams = await props.searchParams;
  const { t, locale } = await getT();
  const { supabase, perms } = await requirePermission("maintenance.jobs", "read");

  const [options, assignees] = await Promise.all([
    loadEnclosureOptions(supabase),
    loadAssignableUsers(supabase),
  ]);

  if (!can(perms, "maintenance.jobs")) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.maintenance.newJob}</h1>
        <p className="text-sm text-muted">{t.maintenance.detail.readOnly}</p>
        <div>
          <ActionLink href="/maintenance" label={t.maintenance.backToBoard} icon={ACTION_ICONS.back} iconOnlyOnMobile={false} />
        </div>
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
          ? t.maintenance.backToEnclosure(placeName(locale, enclosure.name, enclosure.name_th))
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
        assignees={assignees.users}
      />
    </main>
  );
}
