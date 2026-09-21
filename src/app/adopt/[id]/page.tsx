import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { driveImageUrl } from "@/lib/google/drive-client";
import { getT } from "@/lib/i18n/get-t";
import { getSiteOrigin } from "@/lib/site-origin";
import { localizedField } from "@/lib/translations/localize";
import {
  compatibilityLabel,
  energyLevelLabel,
  speciesLabel,
  sexLabel,
  sizeLabel,
} from "@/lib/i18n/enum-labels";
import { formatAge } from "@/lib/format";
import {
  bioLead,
  loadPublicResident,
  loadSimilarResidents,
} from "@/lib/residents/public";
import { lineLink, loadSiteContent, visitingHoursLines } from "@/lib/site/content";
import { ShareButton } from "@/components/ShareButton";
import { PublicHeader } from "../PublicHeader";
import { PublicFooter } from "../PublicFooter";
import { ResidentCard } from "../ResidentCard";
import { PhotoGallery } from "./PhotoGallery";

/**
 * Open Graph tags so a profile pasted into Facebook or LINE previews with
 * the resident's photo and the first line of their bio (the same
 * treatment as /our-work/[id]). The photo goes through the image proxy,
 * so the scrapers fetch it unauthenticated as a browser would.
 */
export async function generateMetadata(
  props: PageProps<"/adopt/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const [supabase, { t, locale }, origin] = await Promise.all([
    createClient(),
    getT(),
    getSiteOrigin(),
  ]);
  const resident = await loadPublicResident(supabase, id);
  if (!resident) return { title: t.adopt.pageTitle };

  const bio = localizedField(locale, resident.bio, resident.translations, "bio");
  const description = bioLead(bio) || t.adopt.shareFallback(resident.name);
  const title = `${resident.name} · ${t.header.appName}`;
  const image = resident.profile_photo_drive_file_id
    ? driveImageUrl(resident.profile_photo_drive_file_id)
    : undefined;

  return {
    title,
    description,
    ...(origin ? { metadataBase: origin } : {}),
    openGraph: {
      type: "profile",
      title,
      description,
      url: `/adopt/${resident.id}`,
      siteName: t.header.appName,
      locale: locale === "th" ? "th_TH" : "en_GB",
      ...(image ? { images: [{ url: image, alt: resident.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function PublicResidentPage(
  props: PageProps<"/adopt/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();
  const { t, locale } = await getT();

  const [resident, photosResult, content] = await Promise.all([
    loadPublicResident(supabase, id),
    supabase
      .from("public_resident_photos")
      .select("drive_file_id")
      .eq("resident_id", id)
      .order("uploaded_at")
      .returns<{ drive_file_id: string }[]>(),
    loadSiteContent(supabase),
  ]);
  if (!resident) notFound();
  const similar = await loadSimilarResidents(supabase, resident);

  // Each profile field in the visitor's language when a manager has
  // approved a translation into it, else as staff wrote it (0056).
  const text = {
    bio: localizedField(locale, resident.bio, resident.translations, "bio"),
    temperament: localizedField(locale, resident.temperament_notes, resident.translations, "temperament_notes"),
    pastStory: localizedField(locale, resident.past_story_notes, resident.translations, "past_story_notes"),
  };

  // Profile photo first (it's the resident's chosen cover shot), then the
  // rest of their gallery, deduplicated — record_attachment always inserts
  // an attachments row for the profile photo too, so it'd otherwise appear
  // twice.
  const photoIds = [
    resident.profile_photo_drive_file_id,
    ...(photosResult.data ?? []).map((p) => p.drive_file_id),
  ].filter((fileId, index, all): fileId is string => {
    return Boolean(fileId) && all.indexOf(fileId) === index;
  });

  const d = t.adopt.details;
  const details = [
    resident.species && { label: d.species, value: speciesLabel(t, resident.species) },
    resident.breed && { label: d.breed, value: resident.breed },
    resident.sex && { label: d.sex, value: sexLabel(t, resident.sex) },
    resident.size && { label: d.size, value: sizeLabel(t, resident.size) },
    resident.colour && { label: d.colour, value: resident.colour },
    resident.estimated_age_years != null && {
      label: d.age,
      value: formatAge(t, resident.estimated_age_years, resident.age_estimated_on),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  // Health facts as chips — only what is known to be true. "Not desexed"
  // is a vet conversation, not a badge.
  const healthChips = [
    resident.is_desexed === true && t.adopt.health.desexed,
    resident.is_vaccinated && t.adopt.health.vaccinated,
  ].filter(Boolean) as string[];

  // "Is {name} right for you?" — the recommendation fields (0060) that
  // have been set. The block hides itself when none have.
  const r = t.adopt.recommendation;
  const recommendation = [
    resident.good_with_dogs && {
      label: r.goodWithDogs,
      value: compatibilityLabel(t, resident.good_with_dogs),
      tone: resident.good_with_dogs,
    },
    resident.good_with_cats && {
      label: r.goodWithCats,
      value: compatibilityLabel(t, resident.good_with_cats),
      tone: resident.good_with_cats,
    },
    resident.good_with_children && {
      label: r.goodWithChildren,
      value: compatibilityLabel(t, resident.good_with_children),
      tone: resident.good_with_children,
    },
    resident.energy_level && {
      label: r.energyLevel,
      value: energyLevelLabel(t, resident.energy_level),
      tone: "neutral",
    },
  ].filter(Boolean) as { label: string; value: string; tone: string }[];
  const toneClass: Record<string, string> = {
    Yes: "border-success/40 bg-success/10 text-success",
    No: "border-danger/40 bg-danger/10 text-danger",
    Unknown: "border-border bg-background text-muted",
    neutral: "border-primary/40 bg-primary/10 text-primary",
  };

  const hours = visitingHoursLines(locale, content);
  const line = lineLink(content?.contact_line);
  const email = content?.contact_email ?? "lannacareforanimals@gmail.com";
  const m = t.adopt.meet;

  return (
    <main className="flex flex-1 flex-col">
      <PublicHeader current="adopt" />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 sm:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/adopt"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            {t.adopt.backToAll}
          </Link>
          <ShareButton
            title={`${resident.name} · ${t.header.appName}`}
            text={t.adopt.shareText(resident.name)}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <PhotoGallery residentName={resident.name} photoIds={photoIds} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {resident.ready_for_adoption && (
                <span className="w-fit rounded bg-success px-2 py-1 text-xs font-semibold text-success-foreground">
                  {t.adopt.availableForAdoption}
                </span>
              )}
              <h1 className="text-2xl font-semibold text-foreground">
                {resident.name}
              </h1>
            </div>

            {details.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {details.map((detail) => (
                  <div key={detail.label}>
                    <dt className="text-muted">{detail.label}</dt>
                    <dd className="text-foreground">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {healthChips.length > 0 && (
              <ul className="flex flex-wrap gap-2" aria-label={t.adopt.health.heading}>
                {healthChips.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success"
                  >
                    ✓ {chip}
                  </li>
                ))}
              </ul>
            )}

            {text.bio && (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  {t.adopt.about(resident.name)}
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {text.bio}
                </p>
              </div>
            )}

            {text.temperament && (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  {t.adopt.temperament}
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {text.temperament}
                </p>
              </div>
            )}

            {text.pastStory && (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-foreground">
                  {t.adopt.theirStory}
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {text.pastStory}
                </p>
              </div>
            )}

            {recommendation.length > 0 && (
              <section
                aria-labelledby="recommendation-heading"
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
              >
                <h2 id="recommendation-heading" className="text-sm font-semibold text-foreground">
                  {r.heading(resident.name)}
                </h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {recommendation.map((item) => (
                    <div key={item.label} className="flex flex-col gap-1">
                      <dt className="text-xs text-muted">{item.label}</dt>
                      <dd>
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClass[item.tone]}`}
                        >
                          {item.value}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="text-xs text-muted">{r.note}</p>
              </section>
            )}
          </div>
        </div>

        <section
          aria-labelledby="meet-heading"
          className="flex flex-col gap-4 rounded-lg border border-primary/30 bg-surface p-6"
        >
          <div className="flex flex-col gap-1">
            <h2 id="meet-heading" className="text-lg font-semibold text-foreground">
              {m.heading(resident.name)}
            </h2>
            <p className="text-sm text-muted">{m.intro(resident.name)}</p>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2">
            {content?.contact_address && (
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{m.where}</span>
                  {content.contact_map_url ? (
                    <a
                      href={content.contact_map_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted underline hover:text-foreground"
                    >
                      {content.contact_address}
                    </a>
                  ) : (
                    <span className="text-muted">{content.contact_address}</span>
                  )}
                </div>
              </div>
            )}
            {hours.length > 0 && (
              <div className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{m.when}</span>
                  {hours.map((h) => (
                    <span key={h} className="text-muted">{h}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{m.email}</span>
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent(m.emailSubject(resident.name))}`}
                  className="text-muted underline hover:text-foreground"
                >
                  {email}
                </a>
              </div>
            </div>
            {(line || content?.contact_phone) && (
              <div className="flex gap-3">
                {line ? (
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                ) : (
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                )}
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{m.message}</span>
                  {line && (
                    <a
                      href={line.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted underline hover:text-foreground"
                    >
                      LINE: {line.label}
                    </a>
                  )}
                  {content?.contact_phone && (
                    <a
                      href={`tel:${content.contact_phone.replace(/\s+/g, "")}`}
                      className="text-muted underline hover:text-foreground"
                    >
                      {content.contact_phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <p className="rounded border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
            {m.honestNote}{" "}
            <Link href="/adopt#how-to-adopt" className="font-medium text-primary hover:underline">
              {m.processLink}
            </Link>
          </p>
        </section>

        {similar.length > 0 && (
          <section aria-labelledby="similar-heading" className="flex flex-col gap-4 pt-4">
            <h2 id="similar-heading" className="text-lg font-semibold text-foreground">
              {t.adopt.similar(resident.name)}
            </h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {similar.map((other) => (
                <ResidentCard key={other.id} resident={other} t={t} />
              ))}
            </div>
          </section>
        )}
      </div>

      <PublicFooter content={content} />
    </main>
  );
}
