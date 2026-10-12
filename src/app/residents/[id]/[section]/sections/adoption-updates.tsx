import { formatDate } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { PhotoGallery, type PhotoRow } from "@/components/PhotoGallery";
import { type PhotoProvenance } from "@/lib/adoption-updates/options";
import { AdoptionUpdateActions } from "../../adoption-updates/AdoptionUpdateActions";
import { ActionLink } from "@/components/ActionLink";
import { SECTION_ICONS } from "@/components/hub-icons";
import type { SectionContext } from "./types";
import { Placeholder } from "./shared";

export async function renderAdoptionUpdatesSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, resident, residentState, perms, t, locale, supabase, photoSelect, contactEmbed } = ctx;
  // Shown for any resident who has ever been adopted, not only one
  // adopted now: a resident returned to the shelter keeps the news from
  // their time away, and it can still arrive late (0097 leaves where
  // the section shows to the hub; docs/decisions.md, 2026-09-27).
  const [updatesResult, photosResult, adoptCountResult] = await Promise.all([
    supabase
      .from("adoption_updates")
      .select(`id, received_on, channel, note, created_at, sender:${contactEmbed()}`)
      .eq("resident_id", id)
      .order("received_on", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<
        {
          id: string;
          received_on: string;
          channel: string;
          note: string | null;
          created_at: string;
          sender: { name: string } | null;
        }[]
      >(),
    supabase
      .from("attachments")
      .select(photoSelect)
      .eq("owner_type", "resident")
      .eq("owner_id", id)
      .not("adoption_update_id", "is", null)
      .order("uploaded_at", { ascending: true })
      .returns<PhotoRow[]>(),
    supabase
      .from("placement_history")
      .select("id", { count: "exact", head: true })
      .eq("resident_id", id)
      .eq("placement_type", "Adopt"),
  ]);
  const updates = updatesResult.data ?? [];
  const photos = photosResult.data ?? [];
  const canWrite =
    can(perms, "resident.adoption_news") && (adoptCountResult.count ?? 0) > 0;
  const a = t.adoptionUpdates;
  const channelLabel = (code: string) =>
    (a.channels as Record<string, string>)[code] ?? code;
  return (
    <div className="flex flex-col gap-4">
      {canWrite && (
        <div className="flex justify-end">
          <ActionLink
            href={`/residents/${id}/adoption-updates/new`}
            label={a.addUpdate}
            icon={SECTION_ICONS["adoption-updates"]}
            variant="primary"
            iconOnlyOnMobile={false}
          />
        </div>
      )}
      {residentState?.current_status !== "Adopted" && updates.length > 0 && (
        <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted">
          {a.notAdoptedNow}
        </p>
      )}
      {(updatesResult.error || photosResult.error) && (
        <p className="text-sm text-danger">
          {(updatesResult.error ?? photosResult.error)?.message}
        </p>
      )}
      {updates.length === 0 ? (
        <Placeholder>
          {(adoptCountResult.count ?? 0) > 0 ? a.empty : a.neverAdoptedEmpty}
        </Placeholder>
      ) : (
        <ul className="flex flex-col gap-4">
          {updates.map((update) => {
            const updatePhotos = photos.filter(
              (p) => (p.adoption_update as PhotoProvenance | null)?.id === update.id,
            );
            return (
              <li
                key={update.id}
                id={`update-${update.id}`}
                className="flex scroll-mt-6 flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-sm target:ring-2 target:ring-primary/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {formatDate(update.received_on, locale)}
                      <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        {channelLabel(update.channel)}
                      </span>
                    </span>
                    <span className="text-xs text-muted">
                      {update.sender?.name ? a.sentBy(update.sender.name) : a.senderUnknown}
                    </span>
                  </div>
                  {canWrite && (
                    <AdoptionUpdateActions
                      residentId={id}
                      updateId={update.id}
                      photoCount={updatePhotos.length}
                      subject={formatDate(update.received_on, locale)}
                    />
                  )}
                </div>
                {update.note && (
                  <p className="whitespace-pre-line text-foreground">{update.note}</p>
                )}
                {updatePhotos.length > 0 && (
                  <PhotoGallery
                    residentId={id}
                    photos={updatePhotos}
                    profilePhotoDriveFileId={resident.profile_photo_drive_file_id}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
