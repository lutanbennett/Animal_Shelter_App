import { notFound } from "next/navigation";
import { TextApprovalBar } from "@/components/TextApprovalBar";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { loadEventPhotos, loadLinkChoices, loadStaffEvent } from "@/lib/events/staff";
import type { EventFields } from "@/lib/events/form";
import { EventForm } from "../EventForm";
import { EventPhotos } from "../EventPhotos";
import { EventPublish } from "../EventPublish";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Management → Events → one event: its words, its gallery and whether it is on the website. */
export default async function EventPage(props: PageProps<"/management/events/[id]">) {
  const { supabase, perms } = await requirePermission("events.run");
  const { t } = await getT();
  const a = t.eventsAdmin;
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();

  const event = await loadStaffEvent(supabase, id);
  if (!event) notFound();
  const [photos, { appeals, projects }] = await Promise.all([loadEventPhotos(supabase, id), loadLinkChoices(supabase)]);

  const initial: EventFields = {
    title: event.title,
    summary: event.summary ?? "",
    description: event.description ?? "",
    eventDate: event.event_date,
    endDate: event.end_date ?? "",
    location: event.location ?? "",
    status: event.status,
    appealId: event.appeal_id ?? "",
    projectFolderId: event.project_folder_id ?? "",
    socialLinks: event.social_links.join("\n"),
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/events">{a.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground" lang="und">{event.title}</h1>
        <p className="text-sm text-muted">
          {a.status[event.status]} · {event.published ? a.onSite.yes : a.onSite.no}
        </p>
      </div>

      <EventPublish
        eventId={event.id}
        published={event.published}
        cancelled={event.status === "cancelled"}
        waitingPhotos={photos.filter((p) => !p.approved).length}
      />
      <TextApprovalBar kind="event" id={event.id} />
      <EventForm mode="edit" eventId={event.id} initial={initial} published={event.published} appeals={appeals} projects={projects} canSeeAppeals={can(perms, "appeal.run")} canSeeProjects={can(perms, "projects.folders", "read")} />
      <EventPhotos eventId={event.id} photos={photos} />
    </main>
  );
}
