import { PawPrint } from "lucide-react";
import { PublicPhoto } from "@/components/PublicPhoto";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { Locale } from "@/lib/i18n/locales";

export type RecentAdoption = {
  id: string;
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
}: {
  recent: RecentAdoption[];
  t: Dictionary;
  locale: Locale;
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
          {recent.map((a) => (
            <li key={a.id} className="flex flex-col items-center gap-2 text-center">
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
            </li>
          ))}
        </ul>
      </section>
  );
}
