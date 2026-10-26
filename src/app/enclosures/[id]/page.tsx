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
      // No read of any resident: the list would be empty and the count 0, which says "nobody" when it means "not allowed".
      canSeeResidents={can(perms, "resident.record", "read") || can(perms, "resident.who_and_where", "read")}
      canEditEnclosures={can(perms, "facility.enclosures")}
      canWriteMaintenance={can(perms, "maintenance.jobs")}
      maintenanceJobs={details.maintenanceJobs}
      tagOrigin={tagOrigin}
    />
  );
}
