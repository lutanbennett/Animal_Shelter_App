import Link from "next/link";
import { PawPrint } from "lucide-react";
import { PublicPhoto } from "@/components/PublicPhoto";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";

export type RecentAdoption = {
  id: string;
  /** Added by 0215. Leads to /adopt/stories/<resident_id> when that animal has a published story. */
  resident_id: string;
  name: string;
  species: string | null;
  profile_photo_drive_file_id: string | null;
  adopted_on: string;
};

/** The recent adoptions from `public_recent_adoptions` — the /adopt list's foot and the not-found page. */
export function HappyEndings({
  recent,
  t,
  locale,
  withStories,
}: {
  recent: RecentAdoption[];
  t: Dictionary;
  locale: Locale;
  /** Animals with a published success story: their picture becomes a link to it. */
  withStories?: ReadonlySet<string>;
}) {
  if (recent.length === 0) return null;
  const monthFormat = new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    month: "long",
    year: "numeric",
  });
  return (
    <section data-reveal aria-labelledby="happy-endings-heading" className="flex flex-col gap-4 pt-6">
      <div className="flex flex-col gap-1">
        <h2 id="happy-endings-heading" className="text-lg font-semibold text-foreground">
          {t.adopt.happyEndings.heading}
        </h2>
        <p className="text-sm text-muted">{t.adopt.happyEndings.subtitle}</p>
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {recent.map((a) => {
          const inner = (
            <>
              <div className="relative aspect-square w-full overflow-hidden rounded-full border border-border bg-surface">
                {a.profile_photo_drive_file_id ? (
                  <PublicPhoto
                    fileId={a.profile_photo_drive_file_id}
                    alt={a.name}
                    fallback={400}
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    role="img"
                    aria-label={speciesLabel(t, a.species) || t.adopt.noPhoto}
                    className="flex h-full items-center justify-center text-muted"
                  >
                    <PawPrint aria-hidden="true" className="h-1/3 w-1/3" />
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-foreground">{a.name}</span>
              <span className="text-xs text-muted">
                {t.adopt.happyEndings.adopted(monthFormat.format(new Date(a.adopted_on)))}
              </span>
            </>
          );
          const layout = "flex w-full flex-col items-center gap-2 text-center";
          return (
            <li key={a.id}>
              {withStories?.has(a.resident_id) ? (
                <Link
                  href={`/adopt/stories/${a.resident_id}`}
                  className={`${layout} rounded-2xl transition hover:opacity-80`}
                  aria-label={t.adopt.happyEndings.readStory(a.name)}
                >
                  {inner}
                  <span className="text-xs font-medium text-primary underline">
                    {t.adopt.happyEndings.seeStory}
                  </span>
                </Link>
              ) : (
                <div className={layout}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
