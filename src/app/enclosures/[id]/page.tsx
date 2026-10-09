import { notFound } from "next/navigation";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { getTagOrigin } from "@/lib/tags/origin";
import { loadEnclosureDetails } from "@/lib/enclosures/details";
import { EnclosureHub } from "./EnclosureHub";

export default async function EnclosurePage(
  props: PageProps<"/enclosures/[id]">,
) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("facility.enclosures", "read");

  // The same loader as the facility map's details panel, so the two never disagree.
  const [details, tagOrigin] = await Promise.all([loadEnclosureDetails(supabase, id), getTagOrigin()]);
  if (!details) notFound();

  return (
    <EnclosureHub
      enclosure={details.enclosure}
      residents={details.residents}
      canEditEnclosures={can(perms, "facility.enclosures")}
      canWriteMaintenance={can(perms, "maintenance.jobs")}
      maintenanceJobs={details.maintenanceJobs}
      tagOrigin={tagOrigin}
    />
  );
}
