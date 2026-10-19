import { notFound } from "next/navigation";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { loadMaintenanceJob } from "@/lib/maintenance/queries";
import { loadJobBills } from "@/lib/maintenance/bills";
import { loadTranslations } from "@/lib/translations/queries";
import { MaintenanceJobView } from "./MaintenanceJobView";

/**
 * /maintenance/[id] — one job: status control, details, and the before /
 * after photo sections with their uploaders. This is the page a phone
 * lands on from the mobile list, so everything a person on site needs
 * (move it along, photograph the finished work) is here rather than on
 * the board.
 */
export default async function MaintenanceJobPage(props: PageProps<"/maintenance/[id]">) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("maintenance.jobs", "read");

  const [job, translations] = await Promise.all([
    loadMaintenanceJob(supabase, id),
    // The job's title and description in the other language (0057).
    loadTranslations(supabase, "maintenance", [id]),
  ]);
  if (!job) notFound();

  // Bills and their amounts are Management's (maintenance.bills): for anyone else nothing is read.
  const canBills = can(perms, "maintenance.bills") && perms.scopes.clinical !== "own_clinic";
  const { bills, cost } = canBills ? await loadJobBills(supabase, id) : { bills: [], cost: null };

  return (
    <MaintenanceJobView
      job={job}
      canWrite={can(perms, "maintenance.jobs")}
      canMakeMeme={can(perms, "social.library")}
      canMove={can(perms, "maintenance.progress")}
      canDelete={can(perms, "maintenance.delete")}
      canBills={canBills}
      bills={bills}
      cost={cost}
      canManageTranslations={can(perms, "translations.manage")}
      translations={Array.from(translations.values())}
    />
  );
}
