import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { loadRaised, loadStaffAppeal } from "@/lib/appeals/staff";
import type { PublicAppeal } from "@/lib/appeals/public";
import { AppealView, type AppealGalleryItem } from "@/app/appeals/AppealView";

// A draft's preview is read live, for the person writing it only.
export const dynamic = "force-dynamic";

type AttachmentRow = { id: string; drive_file_id: string; file_name: string | null; sub_folder: string | null };
type ChosenRow = { attachment_id: string; is_cover: boolean; is_graphic: boolean; position: number };

const IMAGE = /\.(jpe?g|png|webp|heic|heif|gif)$/i;

/**
 * The staff preview: the public appeal page, drawn by the same component
 * (AppealView) from the staff copy of the appeal, so a draft can be read
 * exactly as visitors will read it before it is published. It lives under
 * /management and asks for appeal.run, so a draft is never served from
 * /appeals/[id], which reads public_appeals and refuses anything unpublished.
 *
 * Photos follow the same rule as the public site: non-Medical images only.
 * Thai wording shows as English here until its translation is reviewed, as it
 * would publicly.
 */
export default async function AppealPreviewPage(props: PageProps<"/management/appeals/[id]/preview">) {
  const { supabase, perms } = await requirePermission("appeal.run");
  const { id } = await props.params;
  const { t, locale } = await getT();
  const a = t.appealsAdmin.publish;

  const appeal = await loadStaffAppeal(supabase, id);
  if (!appeal) notFound();

  const [raisedMap, chosenRes, attachmentsRes, residentRes, origin] = await Promise.all([
    can(perms, "donation.receipt") ? loadRaised(supabase, [appeal.id]) : Promise.resolve(null),
    supabase
      .from("appeal_photos")
      .select("attachment_id, is_cover, is_graphic, position")
      .eq("appeal_id", appeal.id)
      .returns<ChosenRow[]>(),
    supabase
      .from("attachments")
      .select("id, drive_file_id, file_name, sub_folder")
      .eq("owner_type", "resident")
      .eq("owner_id", appeal.resident_id)
      .returns<AttachmentRow[]>(),
    supabase
      .from("residents")
      .select("bio, species, profile_photo_drive_file_id")
      .eq("id", appeal.resident_id)
      .maybeSingle<{ bio: string | null; species: string | null; profile_photo_drive_file_id: string | null }>(),
    getSiteOrigin(),
  ]);
  if (chosenRes.error) throw new Error(`Appeals: could not read the chosen photos: ${chosenRes.error.message}`);
  if (attachmentsRes.error) throw new Error(`Appeals: could not read the photos: ${attachmentsRes.error.message}`);

  const byId = new Map((attachmentsRes.data ?? []).map((x) => [x.id, x]));
  const photos = (chosenRes.data ?? [])
    .map((c) => ({ c, att: byId.get(c.attachment_id) }))
    .filter(
      (x): x is { c: ChosenRow; att: AttachmentRow } =>
        !!x.att &&
        !!x.att.file_name &&
        IMAGE.test(x.att.file_name) &&
        (x.att.sub_folder ?? "").trim().toLowerCase() !== "medical",
    )
    .sort((p, q) => Number(q.c.is_cover) - Number(p.c.is_cover) || p.c.position - q.c.position);

  const gallery: AppealGalleryItem[] = photos.map((p) => ({ id: p.c.attachment_id, fileId: p.att.drive_file_id, isGraphic: p.c.is_graphic }));
  const profile = residentRes.data?.profile_photo_drive_file_id ?? null;
  if (gallery.length === 0 && profile) gallery.push({ id: "profile", fileId: profile, isGraphic: false });

  const raised = raisedMap?.get(appeal.id);
  const asPublic: PublicAppeal = {
    id: appeal.id,
    resident_id: appeal.resident_id,
    resident_name: appeal.residents?.name ?? "",
    resident_thai_name: appeal.residents?.thai_name ?? null,
    species: residentRes.data?.species ?? null,
    title: appeal.title,
    what_is_wrong: appeal.what_is_wrong,
    treatment_needed: appeal.treatment_needed,
    cost_covers: appeal.cost_covers,
    target_amount: appeal.target_amount,
    raised_amount: raised?.raised ?? 0,
    raised_as_of: raised?.asOf ?? null,
    deadline: appeal.deadline,
    // A draft previews as a live appeal: that is what publishing will make it.
    status: appeal.status === "draft" ? "live" : appeal.status,
    outcome_note: appeal.outcome_note,
    display_style: appeal.display_style,
    social_links: appeal.social_links,
    cover_drive_file_id: gallery[0]?.fileId ?? null,
    cover_is_graphic: gallery[0]?.isGraphic ?? false,
    published_at: appeal.published_at,
    closed_at: appeal.closed_at,
    translations: {},
  };

  return (
    <main className="flex flex-1 flex-col">
      <div role="note" className="flex flex-col gap-1 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <BackLink href={`/management/appeals/${appeal.id}`}>{a.previewBack}</BackLink>
        <p className="text-sm font-medium text-foreground">{a.previewBanner}</p>
      </div>
      <div className="font-site bg-site-paper text-site-ink">
        <AppealView
          appeal={asPublic}
          gallery={gallery}
          bio={residentRes.data?.bio ?? ""}
          pageUrl={origin && appeal.status !== "draft" ? new URL(`/appeals/${appeal.id}`, origin).toString() : null}
          locale={locale}
          t={t}
          backHref={`/management/appeals/${appeal.id}`}
        />
      </div>
    </main>
  );
}
