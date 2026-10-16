import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { isUuid } from "@/lib/tags/links";
import { loadPublicStoriesFor } from "@/lib/adoption-updates/public";
import { PublicPhoto } from "@/components/PublicPhoto";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import { BackLink } from "../../BackLink";
import { PublicHeader } from "../../PublicHeader";
import { PublicFooter } from "../../PublicFooter";

/**
 * /adopt/stories/<resident id>: the news and photos an adopter agreed to share
 * about one animal, reached by tapping its picture under Happy endings. Reads
 * only public_adoption_updates (and the animal's name from public_resident_cards),
 * so the staff note and anything unticked cannot appear. No published story is a 404.
 */
async function load(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const stories = await loadPublicStoriesFor(supabase, id);
  return stories.length > 0 ? stories : null;
}

export async function generateMetadata(props: PageProps<"/adopt/stories/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [{ t }, stories] = await Promise.all([getT(), load(id)]);
  if (!stories) return { title: t.header.appName };
  return {
    title: `${t.adopt.successStories.cardHeading(stories[0].name)} · ${t.header.appName}`,
    robots: { index: false },
  };
}

export default async function SuccessStoriesPage(props: PageProps<"/adopt/stories/[id]">) {
  const { id } = await props.params;
  const [{ t }, stories] = await Promise.all([getT(), load(id)]);
  if (!stories) notFound();
  const s = t.adopt.successStories;
  const animal = stories[0];

  return (
    <main className="flex flex-1 flex-col font-site text-site-ink">
      <PublicHeader current="adopt" trail={[{ label: t.adopt.adoptNav, href: "/adopt" }, { label: animal.name }]} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-6 lg:py-10">
        <BackLink
          href="/adopt"
          className="flex min-h-11 w-fit items-center gap-1.5 rounded-full px-1 text-base font-semibold text-site-ink hover:text-site-action-hover"
        >
          {t.adopt.profile.allAnimals}
        </BackLink>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[32px] font-bold leading-tight sm:text-4xl">{s.cardHeading(animal.name)}</h1>
          {animal.species && <p className="text-base text-muted">{speciesLabel(t, animal.species)}</p>}
          <p className="text-sm text-muted">{s.subtitle}</p>
        </div>
        {stories.map((story) => (
          <figure key={story.id} className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {story.photoIds.map((fileId) => (
                <div key={fileId} className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-background">
                  <PublicPhoto
                    fileId={fileId}
                    alt={s.photoAlt(story.name)}
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
            {story.firstName && <figcaption className="text-sm text-muted">{s.from(story.firstName)}</figcaption>}
          </figure>
        ))}
      </div>
      <PublicFooter />
    </main>
  );
}
