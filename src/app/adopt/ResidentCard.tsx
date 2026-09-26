import Image from "next/image";
import Link from "next/link";
import { driveImageUrl } from "@/lib/google/drive-client";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { sizeLabel, speciesLabel } from "@/lib/i18n/enum-labels";

/** The columns a card needs — a subset of public_resident_profiles. */
export type ResidentCardRow = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
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
  href = `/adopt/${resident.id}`,
}: {
  resident: ResidentCardRow;
  t: Dictionary;
  href?: string;
}) {
  return (
    <Link
      href={href}
      data-reveal
      className="spring-lift group flex flex-col overflow-hidden rounded-lg border border-border bg-surface hover:border-primary"
    >
      <div className="relative aspect-[4/3] w-full bg-background">
        {resident.profile_photo_drive_file_id ? (
          <Image
            src={driveImageUrl(resident.profile_photo_drive_file_id)}
            alt={resident.name}
            fill
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            {t.adopt.noPhoto}
          </div>
        )}
        {resident.ready_for_adoption && (
          <span className="absolute left-2 top-2 rounded bg-success px-2 py-1 text-xs font-semibold text-success-foreground">
            {t.adopt.availableForAdoption}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h2 className="text-base font-semibold text-foreground group-hover:text-primary">
          {resident.name}
        </h2>
        <p className="text-sm text-muted">
          {[speciesLabel(t, resident.species), resident.breed, sizeLabel(t, resident.size)]
            .filter(Boolean)
            .join(" · ") || t.adopt.detailsComingSoon}
        </p>
      </div>
    </Link>
  );
}
