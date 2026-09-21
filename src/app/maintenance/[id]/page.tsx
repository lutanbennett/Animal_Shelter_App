import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canWriteMaintenance, loadMaintenanceJob } from "@/lib/maintenance/queries";
import { canManage } from "@/lib/auth/require-management";
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
  const supabase = await createClient();

  const [{ data: role }, job, translations] = await Promise.all([
    supabase.rpc("current_user_role"),
    loadMaintenanceJob(supabase, id),
    // The job's title and description in the other language (0057).
    loadTranslations(supabase, "maintenance", [id]),
  ]);
  if (!job) notFound();

  return (
    <MaintenanceJobView
      job={job}
      canWrite={canWriteMaintenance(role)}
      canManageTranslations={canManage(role)}
      translations={Array.from(translations.values())}
    />
  );
}
