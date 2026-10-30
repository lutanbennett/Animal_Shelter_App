import type { Metadata } from "next";
import { PUBLIC_FRAME } from "@/lib/site/frame";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { isUuid } from "@/lib/tags/links";
import { loadPublicStoriesFor } from "@/lib/adoption-updates/public";
import { localizedField } from "@/lib/translations/localize";
import type { PublicTranslations } from "@/lib/translations/types";
import { PublicPhoto } from "@/components/PublicPhoto";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import { BackLink } from "../../BackLink";
import { PublicHeader } from "../../PublicHeader";
import { PublicFooter } from "../../PublicFooter";
import { requirePageVisible } from "@/lib/public-page-access";

/**
 * /adopt/journey/<resident id>: one animal's road to a home, reached by tapping
 * its picture under Happy endings. Reads only public_recent_adoptions (the
 * publication gate: public, adopted, not deceased), public_resident_cards (bio,
 * temperament, arrival date) and public_adoption_updates. An animal that is not
 * in the recent-adoptions view is a 404, however it was reached.
 */
type Adoption = {
  name: string;
  species: string | null;
  profile_photo_drive_file_id: string | null;
  adopted_on: string;
};
type Card = {
  bio: string | null;
  temperament_notes: string | null;
  intake_date: string | null;
  translations: PublicTranslations | undefined;
};

async function load(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data: adoption } = await supabase
    .from("public_recent_adoptions")
    .select("name, species, profile_photo_drive_file_id, adopted_on")
    .eq("resident_id", id)
    .limit(1)
    .maybeSingle<Adoption>();
  if (!adoption) return null;
  const [{ data: card }, stories] = await Promise.all([
    supabase
      .from("public_resident_cards")
      .select("bio, temperament_notes, intake_date, translations")
      .eq("id", id)
      .maybeSingle<Card>(),
    loadPublicStoriesFor(supabase, id),
  ]);
  return { adoption, card, stories };
}

export async function generateMetadata(props: PageProps<"/adopt/journey/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [{ t }, data] = await Promise.all([getT(), load(id)]);
  if (!data) return { title: t.header.appName };
  return {
    title: `${t.adopt.journey.heading(data.adoption.name)} · ${t.header.appName}`,
    robots: { index: false },
  };
}

export default async function JourneyPage(props: PageProps<"/adopt/journey/[id]">) {
  await requirePageVisible("adopt");
  const { id } = await props.params;
  const [{ t, locale }, data] = await Promise.all([getT(), load(id)]);
  if (!data) notFound();
  const j = t.adopt.journey;
  const { adoption, card, stories } = data;
  const dayFormat = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const bio = localizedField(locale, card?.bio, card?.translations, "bio");
  const temperament = localizedField(locale, card?.temperament_notes, card?.translations, "temperament_notes");

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader
        current="adopt"
        trail={[{ label: t.adopt.adoptNav, href: "/adopt" }, { label: adoption.name }]}
      />
      <div className={`${PUBLIC_FRAME} flex flex-col gap-6 py-6 lg:py-10 [&>*]:max-w-3xl`}>
        <BackLink
          href="/adopt"
          className="flex min-h-11 w-fit items-center gap-1.5 rounded-full px-1 text-base font-semibold text-site-ink hover:text-site-action-hover"
        >
          {t.adopt.profile.allAnimals}
        </BackLink>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[32px] font-bold leading-tight sm:text-4xl">{j.heading(adoption.name)}</h1>
          {adoption.species && <p className="text-base text-muted">{speciesLabel(t, adoption.species)}</p>}
        </div>
        {adoption.profile_photo_drive_file_id && (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[20px] border border-border bg-surface">
            <PublicPhoto
              fileId={adoption.profile_photo_drive_file_id}
              alt={adoption.name}
              sizes="(min-width: 768px) 720px, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <ol className="flex flex-col gap-5 border-l-2 border-border pl-5">
          {card?.intake_date && (
            <li className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold text-muted">{j.arrived(dayFormat.format(new Date(card.intake_date)))}</h2>
              {bio && <p className="whitespace-pre-line text-base leading-relaxed text-foreground">{bio}</p>}
              {temperament && (
                <p className="whitespace-pre-line text-base leading-relaxed text-foreground">{temperament}</p>
              )}
            </li>
          )}
          {stories.map((story) => (
            <li key={story.id} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted">{j.update}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {story.photoIds.map((fileId) => (
                  <div key={fileId} className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface">
                    <PublicPhoto
                      fileId={fileId}
                      alt={t.adopt.successStories.photoAlt(story.name)}
                      sizes="(min-width: 640px) 360px, 100vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              {story.story && (
                <blockquote className="whitespace-pre-line text-base leading-relaxed text-foreground">
                  {story.story}
                </blockquote>
              )}
              {story.firstName && (
                <p className="text-sm text-muted">{t.adopt.successStories.from(story.firstName)}</p>
              )}
            </li>
          ))}
          <li className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-foreground">
              {j.adopted(dayFormat.format(new Date(adoption.adopted_on)))}
            </h2>
            {!card?.intake_date && !bio && !temperament && stories.length === 0 && (
              <p className="text-base text-muted">{j.quiet(adoption.name)}</p>
            )}
          </li>
        </ol>
      </div>
      <PublicFooter />
    </main>
  );
}
