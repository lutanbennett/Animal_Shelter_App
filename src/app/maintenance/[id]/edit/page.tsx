import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadEnclosureOptions } from "@/lib/enclosures/options";
import { loadContactOptions } from "@/lib/contacts/options";
import { canWriteMaintenance, loadMaintenanceJob } from "@/lib/maintenance/queries";
import { MaintenanceForm } from "../../MaintenanceForm";

export default async function EditMaintenancePage(
  props: PageProps<"/maintenance/[id]/edit">,
) {
  const { id } = await props.params;
  const { t } = await getT();
  const supabase = await createClient();

  const [{ data: role }, job, options, contacts] = await Promise.all([
    supabase.rpc("current_user_role"),
    loadMaintenanceJob(supabase, id),
    loadEnclosureOptions(supabase),
    loadContactOptions(supabase),
  ]);
  if (!job) notFound();

  if (!canWriteMaintenance(role)) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t.maintenance.editJob}</h1>
        <p className="text-sm text-muted">{t.maintenance.detail.readOnly}</p>
        <Link
          href={`/maintenance/${job.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t.maintenance.backToJob}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href={`/maintenance/${job.id}`} className="text-sm text-muted hover:text-foreground">
        {t.maintenance.backToJob}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {job.job_code} · {t.maintenance.editJob}
        </h1>
        <p className="text-sm text-muted">{t.maintenance.editJobSubtitle}</p>
      </div>

      {options.error && (
        <p className="text-sm text-danger">
          {t.enclosures.couldntLoadEnclosures}: {options.error}
        </p>
      )}

      <MaintenanceForm
        mode="edit"
        zones={options.zones}
        enclosures={options.enclosures}
        initial={job}
        cancelHref={`/maintenance/${job.id}`}
        contacts={contacts.contacts}
      />
    </main>
  );
}
