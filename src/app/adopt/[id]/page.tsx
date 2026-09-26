import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
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

/** The page's reading column; lines up with the header's edges on a phone. */
const column = "mx-auto w-full max-w-3xl px-5 lg:px-8";
const storyHeading = "font-display text-[26px] font-bold leading-tight text-site-ink lg:text-[30px]";
const prose = "whitespace-pre-line text-[17px] leading-relaxed text-site-ink";
// The mockup sets its small headings ("Gets along with", "How to meet") in
// the body face. globals.css gives every public h1–h3 Fraunces with a
// :root:has() selector no utility class outranks, hence `font-site!`.
const textLink =
  "inline-flex min-h-11 items-center font-bold text-site-action-hover underline underline-offset-4 hover:text-site-action";

/**
 * Open Graph tags so a profile pasted into Facebook or LINE previews with
 * the resident's photo and their hook line — or, until staff write one,
 * the first line of their bio (the same treatment as /our-work/[id]). The
 * photo goes through the image proxy, so the scrapers fetch it
 * unauthenticated as a browser would.
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

  const hook = localizedField(locale, resident.hook_line, resident.translations, "hook_line");
  const bio = localizedField(locale, resident.bio, resident.translations, "bio");
  const description = hook || bioLead(bio) || t.adopt.shareFallback(resident.name);
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

/**
 * A resident's public profile, built on Lanna Care's mockup
 * (docs/design/resident-profile-mobile.png, part 3 of the redesign): photo,
 * status, name and hook; quick facts; "Gets along with"; story and ideal
 * home; how to meet; a sponsor line; and a sticky "Ask on LINE" / "Book a
 * visit" bar. Every field behind it is optional and most residents have
 * none of the prose yet, so each block drops out when it has nothing to
 * say rather than showing an empty heading (docs/decisions.md, 2026-09-26).
 */
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
  // approved a translation into it, else as staff wrote it (0056, 0094).
  const field = (original: string | null, column: string) =>
    localizedField(locale, original, resident.translations, column);
  const hook = field(resident.hook_line, "hook_line");
  const idealHome = field(resident.ideal_home, "ideal_home");
  // The mockup's story is how they came to us, then what they're like now:
  // the past story first, then the bio and temperament notes.
  const story = [
    field(resident.past_story_notes, "past_story_notes"),
    field(resident.bio, "bio"),
    field(resident.temperament_notes, "temperament_notes"),
  ].filter(Boolean);

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

  // Quick facts, in the mockup's order. Only what is known: "Not desexed"
  // is a vet conversation, not a fact to lead with. Breed stands in for
  // species (the photo says dog or cat); species shows only without one.
  const d = t.adopt.details;
  const p = t.adopt.profile;
  const health = [
    resident.is_desexed === true && t.adopt.health.desexed,
    resident.is_vaccinated && t.adopt.health.vaccinated,
  ].filter(Boolean);
  const facts = [
    resident.estimated_age_years != null && {
      label: d.age,
      value: formatAge(t, resident.estimated_age_years, resident.age_estimated_on),
    },
    resident.sex && { label: d.sex, value: sexLabel(t, resident.sex) },
    resident.breed
      ? { label: d.breed, value: resident.breed }
      : resident.species && { label: d.species, value: speciesLabel(t, resident.species) },
    resident.size && { label: d.size, value: sizeLabel(t, resident.size) },
    health.length > 0 && { label: p.health, value: health.join(" · ") },
    resident.energy_level && { label: p.energy, value: energyLevelLabel(t, resident.energy_level) },
  ].filter(Boolean) as { label: string; value: string }[];

  // "Gets along with" (0060): the ones staff have set, "Not yet known"
  // included — it is an answer a visitor would otherwise ask for.
  const getsAlong = [
    resident.good_with_dogs && p.dogs(compatibilityLabel(t, resident.good_with_dogs)),
    resident.good_with_cats && p.cats(compatibilityLabel(t, resident.good_with_cats)),
    resident.good_with_children && p.children(compatibilityLabel(t, resident.good_with_children)),
  ].filter(Boolean) as string[];

  const hours = visitingHoursLines(locale, content);
  const line = lineLink(content?.contact_line);
  const phone = content?.contact_phone?.replace(/\s+/g, "");
  const email = content?.contact_email ?? "lannacareforanimals@gmail.com";
  // "Book a visit" rings the shelter, as the mockup's "Message us on LINE
  // or call" has it; with no phone number on file it becomes an email.
  const bookHref = phone
    ? `tel:${phone}`
    : `mailto:${email}?subject=${encodeURIComponent(p.emailSubject(resident.name))}`;

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader current="adopt" />

      {/* The sticky bar is the last child of this wrapper, so it rides the
          bottom of the screen while the profile scrolls and comes to rest
          after it, above the footer — it never sits over the sponsor line
          at the end (the mockup's bar covers it). */}
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-2 lg:px-8 lg:py-4">
          <Link
            href="/adopt"
            className="flex min-h-11 items-center gap-1.5 rounded-full px-1 text-base font-semibold text-site-ink hover:text-site-action-hover"
          >
            <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
            {p.allAnimals}
          </Link>
          <ShareButton
            variant="site"
            title={`${resident.name} · ${t.header.appName}`}
            text={t.adopt.shareText(resident.name)}
          />
        </div>

        <div className="mx-auto grid w-full max-w-6xl lg:grid-cols-2 lg:items-start lg:gap-12 lg:px-8">
          <PhotoGallery residentName={resident.name} photoIds={photoIds} />

          <div className="flex flex-col gap-5 px-5 pt-5 lg:px-0 lg:pt-0">
            <div className="flex flex-col gap-2.5">
              {resident.ready_for_adoption && (
                <span className="self-start rounded-full bg-site-accent-soft px-3 py-1.5 text-sm font-bold text-site-on-accent-soft">
                  {t.home.featured.availableForAdoption}
                </span>
              )}
              <h1 className="font-display text-[40px] font-bold leading-tight text-site-ink lg:text-5xl">
                {resident.name}
              </h1>
              {hook && (
                <p className="text-[19px] leading-snug text-site-ink-soft lg:text-xl">{hook}</p>
              )}
            </div>

            {facts.length > 0 && (
              <section aria-label={p.quickFacts}>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-4 rounded-2xl border border-site-line bg-site-paper p-[18px]">
                  {facts.map((fact) => (
                    <div key={fact.label} className="flex flex-col">
                      <dt className="text-[13px] text-site-ink-muted">{fact.label}</dt>
                      <dd className="text-[17px] font-bold leading-snug">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {getsAlong.length > 0 && (
              <section aria-labelledby="gets-along-heading" className="flex flex-col gap-2.5">
                <h2 id="gets-along-heading" className="font-site! text-lg font-bold text-site-ink">
                  {p.getsAlongWith}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {getsAlong.map((chip) => (
                    <li
                      key={chip}
                      className="rounded-full border border-site-line-strong/60 bg-site-paper px-3.5 py-2 text-[15px] font-semibold"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-site-ink-muted">{t.adopt.recommendation.note}</p>
              </section>
            )}
          </div>
        </div>

        <div className={`${column} flex flex-col gap-7 pb-10 pt-7 lg:pt-12`}>
          {story.length > 0 && (
            <section aria-labelledby="story-heading" className="flex flex-col gap-3">
              <h2 id="story-heading" className={storyHeading}>
                {p.story(resident.name)}
              </h2>
              {story.map((paragraph, index) => (
                <p key={index} className={prose}>
                  {paragraph}
                </p>
              ))}
            </section>
          )}

          {idealHome && (
            <section aria-labelledby="ideal-home-heading" className="flex flex-col gap-3">
              <h2 id="ideal-home-heading" className={storyHeading}>
                {p.idealHome(resident.name, resident.sex)}
              </h2>
              <p className={prose}>{idealHome}</p>
            </section>
          )}

          <section
            id="how-to-meet"
            aria-labelledby="how-to-meet-heading"
            className="flex flex-col gap-2 rounded-2xl bg-site-sand p-[18px]"
          >
            <h2 id="how-to-meet-heading" className="font-site! text-base font-bold text-site-ink">
              {p.howToMeet(resident.name)}
            </h2>
            <p className="text-[15px] leading-normal text-site-ink-soft">{p.howToMeetBody}</p>
            {(hours.length > 0 || content?.contact_address) && (
              <dl className="grid gap-3 pt-1 text-[15px] sm:grid-cols-2">
                {hours.length > 0 && (
                  <div>
                    <dt className="font-semibold">{p.visitingHours}</dt>
                    {hours.map((h) => (
                      <dd key={h} className="text-site-ink-soft">{h}</dd>
                    ))}
                  </div>
                )}
                {content?.contact_address && (
                  <div>
                    <dt className="font-semibold">{p.findUs}</dt>
                    <dd className="text-site-ink-soft">
                      {content.contact_map_url ? (
                        <a
                          href={content.contact_map_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline underline-offset-2 hover:text-site-ink"
                        >
                          {content.contact_address}
                        </a>
                      ) : (
                        content.contact_address
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {/* action-hover: terracotta on the sand box is under AA as
                normal text (decisions.md, part 1). */}
            <Link href="/adopt#how-to-adopt" className={`${textLink} self-start text-[15px]`}>
              {p.howAdoptionWorks} &rarr;
            </Link>
          </section>

          {/* No sponsor flow yet: /donate, as the header's "Sponsor a
              resident" and the homepage card do (docs/decisions.md). */}
          <section aria-labelledby="sponsor-heading" className="flex flex-col gap-1">
            <h2 id="sponsor-heading" className="font-site! text-lg font-bold text-site-ink">
              {p.sponsorHeading(resident.name)}
            </h2>
            <Link href="/donate" className={`${textLink} self-start text-base`}>
              {p.sponsorLink} &rarr;
            </Link>
          </section>
        </div>

        {similar.length > 0 && (
          <section
            aria-labelledby="similar-heading"
            className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 pb-12 lg:px-8"
          >
            <h2 id="similar-heading" className={storyHeading}>
              {t.adopt.similar(resident.name)}
            </h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {similar.map((other) => (
                <ResidentCard key={other.id} resident={other} t={t} />
              ))}
            </div>
          </section>
        )}

        <nav
          aria-label={p.actions(resident.name)}
          className="sticky bottom-0 z-20 mt-auto border-t border-site-line bg-site-paper px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
        >
          <div className="mx-auto flex max-w-6xl gap-2.5 sm:justify-end lg:px-4">
            {line && (
              <a
                href={line.href}
                target="_blank"
                rel="noreferrer"
                className="flex h-[52px] flex-1 items-center justify-center rounded-full bg-site-accent px-6 text-base font-bold text-site-on-accent hover:opacity-90 sm:flex-none sm:basis-56"
              >
                {p.askOnLine}
              </a>
            )}
            <a
              href={bookHref}
              className="flex h-[52px] flex-1 items-center justify-center rounded-full bg-site-action px-6 text-base font-bold text-site-on-action hover:bg-site-action-hover sm:flex-none sm:basis-56"
            >
              {p.bookVisit}
            </a>
          </div>
        </nav>
      </div>

      <PublicFooter content={content} />
    </main>
  );
}
