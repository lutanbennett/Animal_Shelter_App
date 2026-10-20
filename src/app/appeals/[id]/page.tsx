import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { formatBahtExact } from "@/lib/format";
import { bodyLead } from "@/lib/site/body";
import { loadSiteContent } from "@/lib/site/content";
import { defaultShareImage, shareImageMetadata } from "@/lib/site/share";
import { loadPublicResident } from "@/lib/residents/public";
import { localizedField } from "@/lib/translations/localize";
import {
  appealText,
  loadPublicAppeal,
  loadPublicAppealPhotos,
} from "@/lib/appeals/public";
import { PublicHeader } from "../../adopt/PublicHeader";
import { PublicFooter } from "../../adopt/PublicFooter";
import { AppealView } from "../AppealView";

// The raised figure is read live and says when it was last updated.
export const dynamic = "force-dynamic";

/**
 * Open Graph for Facebook and LINE. The picture is never a medical one (0216) or a distressing one: a
 * graphic cover is skipped for the first plain photo, then the resident's
 * profile photo, then the site's default picture, because a link preview is
 * shown to people who did not choose to look.
 */
export async function generateMetadata(props: PageProps<"/appeals/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [supabase, { t, locale }, origin] = await Promise.all([createClient(), getT(), getSiteOrigin()]);
  const appeal = await loadPublicAppeal(supabase, id);
  if (!appeal) return { title: t.appeals.pageTitle };

  const [photos, resident, content] = await Promise.all([
    loadPublicAppealPhotos(supabase, appeal.id),
    loadPublicResident(supabase, appeal.resident_id),
    loadSiteContent(supabase),
  ]);
  const text = appealText(locale, appeal);
  const description =
    bodyLead(text.whatIsWrong, 200) ||
    t.appeals.shareFallback(text.residentName, formatBahtExact(appeal.target_amount, locale));
  const title = `${text.title} · ${t.header.appName}`;
  const plain = photos.find((p) => !p.is_graphic && !p.is_medical);
  const fileId = plain?.drive_file_id ?? resident?.profile_photo_drive_file_id ?? null;
  const image = fileId
    ? { url: driveImageUrl(fileId, 1200), alt: text.residentName }
    : defaultShareImage(content, locale, t.header.appName);
  const share = shareImageMetadata(image, title, description);

  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    alternates: { canonical: `/appeals/${appeal.id}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/appeals/${appeal.id}`,
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      images: share.images,
    },
    twitter: share.twitter,
  };
}

export default async function AppealPage(props: PageProps<"/appeals/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { t, locale } = await getT();
  const appeal = await loadPublicAppeal(supabase, id);
  if (!appeal) notFound();

  const [photos, resident, content, origin] = await Promise.all([
    loadPublicAppealPhotos(supabase, appeal.id),
    loadPublicResident(supabase, appeal.resident_id),
    loadSiteContent(supabase),
    getSiteOrigin(),
  ]);
  const a = t.appeals;
  const text = appealText(locale, appeal);
  const bio = resident ? localizedField(locale, resident.bio, resident.translations, "bio") : "";

  // The appeal's own photos; with none, the resident's profile photo so the
  // page is never bare. That photo is already public on /adopt.
  const gallery = photos.map((p) => ({ id: p.id, fileId: p.drive_file_id, isGraphic: p.is_graphic, isMedical: p.is_medical }));
  if (gallery.length === 0 && resident?.profile_photo_drive_file_id) {
    gallery.push({ id: "profile", fileId: resident.profile_photo_drive_file_id, isGraphic: false, isMedical: false });
  }

  const pageUrl = origin ? new URL(`/appeals/${appeal.id}`, origin).toString() : null;

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader
        current="appeals"
        trail={[{ label: a.navLabel, href: "/appeals" }, { label: text.title }]}
      />

      <AppealView appeal={appeal} gallery={gallery} bio={bio} pageUrl={pageUrl} locale={locale} t={t} backHref="/appeals" />

      <PublicFooter content={content} />
    </main>
  );
}
