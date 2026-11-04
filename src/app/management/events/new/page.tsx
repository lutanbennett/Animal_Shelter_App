import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { loadLinkChoices } from "@/lib/events/staff";
import type { EventFields } from "@/lib/events/form";
import { EventForm } from "../EventForm";

/** Management → Events → Add an event. Saving makes an unpublished event and opens it to add photos and publish. */
export default async function NewEventPage() {
  const { supabase } = await requirePermission("events.run");
  const { t } = await getT();
  const a = t.eventsAdmin;
  const { appeals, projects } = await loadLinkChoices(supabase);
  const initial: EventFields = {
    title: "",
    summary: "",
    description: "",
    eventDate: "",
    endDate: "",
    location: "",
    status: "planned",
    appealId: "",
    projectFolderId: "",
    socialLinks: "",
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/events">{a.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground">{a.form.newTitle}</h1>
        <p className="text-sm text-muted">{a.form.newSubtitle}</p>
      </div>
      <EventForm mode="new" initial={initial} published={false} appeals={appeals} projects={projects} />
    </main>
  );
}
