import Link from "next/link";
import { AvailableBadge } from "@/components/AvailableBadge";
import { EmptyPhoto } from "@/components/EmptyPhoto";
import { PublicPhoto } from "@/components/PublicPhoto";
import type { Locale } from "@/lib/i18n/locales";
import { residentText } from "@/lib/residents/labels";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { sizeLabel, speciesLabel } from "@/lib/i18n/enum-labels";

/** The columns a card needs — a subset of public_resident_profiles. */
export type ResidentCardRow = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  /** Optional so a loader that predates 0205 still type-checks; absent = the English. */
  breed_th?: string | null;
  size: string | null;
  ready_for_adoption: boolean;
  profile_photo_drive_file_id: string | null;
};

/**
 * One resident as a card: the /adopt grid, the "Similar residents" strip
 * on a profile and the public enclosure page (/e/, linking to each
 * resident's /r/ card instead) share it, so they read alike.
 */
export function ResidentCard({
  resident,
  t,
  locale = "en",
  href = `/adopt/${resident.id}`,
}: {
  resident: ResidentCardRow;
  t: Dictionary;
  locale?: Locale;
  href?: string;
}) {
  return (
    <Link
      href={href}
      data-reveal
      className="spring-lift group flex flex-col overflow-hidden rounded-[20px] border border-border bg-surface hover:border-primary"
    >
      <div className="relative aspect-[4/3] w-full bg-background">
        {resident.profile_photo_drive_file_id ? (
          <PublicPhoto
            fileId={resident.profile_photo_drive_file_id}
            alt={resident.name}
            fallback={400}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <EmptyPhoto label={t.adopt.noPhoto} />
        )}
        {resident.ready_for_adoption && (
          <AvailableBadge label={t.adopt.availableForAdoption} className="absolute left-2 top-2" />
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h2 className="text-base font-semibold text-foreground group-hover:text-primary">
          {resident.name}
        </h2>
        <p className="text-sm text-muted">
          {[speciesLabel(t, resident.species), residentText(locale, resident.breed, resident.breed_th), sizeLabel(t, resident.size)]
            .filter(Boolean)
            .join(" · ") || t.adopt.detailsComingSoon}
        </p>
      </div>
    </Link>
  );
}
