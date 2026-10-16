import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { formatBahtExact, formatDate } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { loadRaised, loadStaffAppeal } from "@/lib/appeals/staff";
import { publishBlocker, type AppealFields } from "@/lib/appeals/form";
import { AppealForm } from "../AppealForm";
import { AppealControls } from "../AppealControls";
import { AppealGifts, type GiftItem } from "../AppealGifts";
import { AppealPhotosEditor, type PhotoCandidate, type PhotoChosen } from "../AppealPhotosEditor";

type AttachmentRow = { id: string; drive_file_id: string; file_name: string | null; sub_folder: string | null };
type GiftRow = { id: string; received_on: string; donor_name: string; donation_lines: { amount: number | string | null }[] };

const IMAGE = /\.(jpe?g|png|webp|heic|heif|gif)$/i;

function giftItem(r: GiftRow): GiftItem {
  const amounts = r.donation_lines.map((l) => l.amount);
  const inKind = amounts.every((a) => a == null);
  const satang = amounts.reduce<number>((s, a) => s + (a == null ? 0 : Math.round(Number(a) * 100)), 0);
  return { id: r.id, receivedOn: r.received_on, donor: r.donor_name, amount: inKind ? null : satang / 100 };
}

/**
 * Management → Appeals → one appeal: its words, photos, status, gifts and the
 * way to close it. Everything on this page is staff-only; the public page is
 * /appeals/[id], and a draft is never reachable there.
 */
export default async function AppealPage(props: PageProps<"/management/appeals/[id]">) {
  const { supabase, perms } = await requirePermission("appeal.run");
  const { id } = await props.params;
  const { t, locale } = await getT();
  const a = t.appealsAdmin;

  const appeal = await loadStaffAppeal(supabase, id);
  if (!appeal) notFound();
  const canSeeGifts = can(perms, "donation.receipt");

  const [raisedMap, attachments, chosenRows, resident, counted, movable] = await Promise.all([
    canSeeGifts ? loadRaised(supabase, [appeal.id]) : Promise.resolve(null),
    supabase
      .from("attachments")
      .select("id, drive_file_id, file_name, sub_folder")
      .eq("owner_type", "resident")
      .eq("owner_id", appeal.resident_id)
      .order("uploaded_at", { ascending: true })
      .returns<AttachmentRow[]>(),
    supabase
      .from("appeal_photos")
      .select("attachment_id, is_cover, is_graphic, position")
      .eq("appeal_id", appeal.id)
      .order("position")
      .returns<{ attachment_id: string; is_cover: boolean; is_graphic: boolean; position: number }[]>(),
    supabase.from("residents").select("is_public_visible").eq("id", appeal.resident_id).maybeSingle<{ is_public_visible: boolean }>(),
    canSeeGifts
      ? supabase
          .from("donations")
          .select("id, received_on, donor_name, donation_lines(amount)")
          .eq("designation", "appeal")
          .eq("designation_appeal_id", appeal.id)
          .order("received_on", { ascending: false })
          .returns<GiftRow[]>()
      : Promise.resolve(null),
    canSeeGifts
      ? supabase
          .from("donations")
          .select("id, received_on, donor_name, donation_lines(amount)")
          .eq("designation", "resident")
          .eq("designation_resident_id", appeal.resident_id)
          .order("received_on", { ascending: false })
          .returns<GiftRow[]>()
      : Promise.resolve(null),
  ]);
  if (attachments.error) throw new Error(`Appeals: could not read the photos: ${attachments.error.message}`);
  if (chosenRows.error) throw new Error(`Appeals: could not read the chosen photos: ${chosenRows.error.message}`);
  if (counted?.error) throw new Error(`Appeals: could not read the gifts: ${counted.error.message}`);
  if (movable?.error) throw new Error(`Appeals: could not read the resident's gifts: ${movable.error.message}`);

  // Only non-Medical images are offered. The database refuses the rest as well.
  const candidates: PhotoCandidate[] = (attachments.data ?? [])
    .filter((x) => x.file_name && IMAGE.test(x.file_name) && (x.sub_folder ?? "").trim().toLowerCase() !== "medical")
    .map((x) => ({ attachmentId: x.id, fileId: x.drive_file_id, name: x.file_name ?? "" }));
  const chosen: PhotoChosen[] = (chosenRows.data ?? [])
    .filter((c) => candidates.some((x) => x.attachmentId === c.attachment_id))
    .map((c) => ({ attachmentId: c.attachment_id, isCover: c.is_cover, isGraphic: c.is_graphic }));

  const raised = raisedMap?.get(appeal.id);
  const name = (locale === "th" && appeal.residents?.thai_name) || appeal.residents?.name || "";
  const initial: AppealFields = {
    residentId: appeal.resident_id,
    title: appeal.title,
    whatIsWrong: appeal.what_is_wrong ?? "",
    treatmentNeeded: appeal.treatment_needed ?? "",
    costCovers: appeal.cost_covers ?? "",
    target: String(appeal.target_amount),
    deadline: appeal.deadline ?? "",
    displayStyle: appeal.display_style,
    socialLinks: appeal.social_links.join("\n"),
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <BackLink href="/management/appeals">{a.backToList}</BackLink>
        <h1 className="text-2xl font-semibold text-foreground" lang="und">{appeal.title}</h1>
        <p className="text-sm text-muted">
          <Link href={`/residents/${appeal.resident_id}`} className="underline">{a.forResident(name)}</Link>
          {" · "}
          {a.status[appeal.status]}
          {" · "}
          {appeal.published ? a.onSite.yes : a.onSite.no}
        </p>
      </div>

      <AppealControls
        appealId={appeal.id}
        status={appeal.status}
        published={appeal.published}
        hasStory={!publishBlocker(appeal)}
        residentPublic={resident.data?.is_public_visible ?? false}
        outcome={appeal.outcome_note}
      />

      <section className="flex max-w-3xl flex-col gap-3 rounded border border-border bg-surface p-4">
        <h2 className="text-base font-semibold text-foreground">{a.gifts.heading}</h2>
        {canSeeGifts ? (
          <>
            <p className="text-lg font-semibold text-foreground">
              {a.gifts.raised(formatBahtExact(raised?.raised ?? 0, locale), formatBahtExact(appeal.target_amount, locale))}
            </p>
            {raised?.asOf && <p className="text-sm text-muted">{a.gifts.asOf(formatDate(raised.asOf, locale))}</p>}
            <p className="text-sm text-muted">{a.gifts.explain}</p>
            {appeal.status !== "closed" && (
              <Link
                href={`/management/donations/new?appeal=${appeal.id}`}
                className="inline-flex min-h-11 items-center self-start rounded border border-border px-4 text-sm font-medium text-foreground hover:bg-surface-hover"
              >
                {a.gifts.record}
              </Link>
            )}
            <AppealGifts
              appealId={appeal.id}
              closed={appeal.status === "closed"}
              canMove
              counted={(counted?.data ?? []).map(giftItem)}
              movable={(movable?.data ?? []).map(giftItem)}
            />
          </>
        ) : (
          <p className="text-sm text-muted">{a.gifts.noAccess}</p>
        )}
      </section>

      <AppealForm mode="edit" appealId={appeal.id} initial={initial} raised={raised?.raised ?? 0} />

      <AppealPhotosEditor appealId={appeal.id} candidates={candidates} chosen={chosen} />
    </main>
  );
}
