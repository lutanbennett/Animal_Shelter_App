import { PublicPhoto } from "@/components/PublicPhoto";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { PublicStory } from "@/lib/adoption-updates/public";

/** Photos and words adopters agreed to share, from public_adoption_updates. Nothing at all when none are ticked. */
export function SuccessStories({ stories, t }: { stories: PublicStory[]; t: Dictionary }) {
  if (stories.length === 0) return null;
  const s = t.adopt.successStories;
  return (
    <section data-reveal aria-labelledby="success-stories-heading" className="flex flex-col gap-4 pt-6">
      <div className="flex flex-col gap-1">
        <h2 id="success-stories-heading" className="text-lg font-semibold text-foreground">
          {s.heading}
        </h2>
        <p className="text-sm text-muted">{s.subtitle}</p>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <li key={story.id}>
            <figure className="flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-surface">
              <div className="relative aspect-[4/3] w-full bg-background">
                <PublicPhoto
                  fileId={story.photoIds[0]}
                  alt={s.photoAlt(story.name)}
                  fallback={800}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="flex flex-1 flex-col gap-2 p-4">
                <span className="text-sm font-semibold text-foreground">
                  {story.name}
                  {story.species && (
                    <span className="font-normal text-muted"> · {speciesLabel(t, story.species)}</span>
                  )}
                </span>
                {story.story && (
                  <blockquote className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {story.story}
                  </blockquote>
                )}
                {story.firstName && <span className="text-xs text-muted">{s.from(story.firstName)}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
