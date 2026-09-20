"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import { ResidentPicker, type ResidentOption } from "@/components/ResidentPicker";
import { setFeaturedResident } from "./actions";

export type FeaturedResidentOption = ResidentOption & {
  species: string | null;
  breed: string | null;
  profile_photo_drive_file_id: string | null;
};

/**
 * "Pet of the week" chooser. `residents` is the public-visible list only
 * (see page.tsx), so the picker can't offer an animal the home page would
 * then refuse to show. A previously featured resident that has since
 * dropped off the public list won't be in `residents` and simply shows as
 * unset here — matching what the public page does.
 */
export function FeaturedResident({
  featuredResidentId,
  residents,
}: {
  featuredResidentId: string | null;
  residents: FeaturedResidentOption[];
}) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);

  const featured = residents.find((r) => r.id === featuredResidentId) ?? null;

  function save(residentId: string | null) {
    setMessage(null);
    startTransition(async () => {
      const result = await setFeaturedResident(residentId);
      if (result && "error" in result) {
        setMessage({ type: "error", text: result.error });
      } else if (result && "success" in result) {
        setMessage({ type: "success", text: result.success });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {t.admin.website.featured.heading}
        </h2>
        <p className="text-sm text-muted">{t.admin.website.featured.subtitle}</p>
      </div>

      {featured ? (
        <div className="flex items-center gap-4 rounded border border-border bg-background p-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-surface">
            {featured.profile_photo_drive_file_id ? (
              <Image
                src={driveImageUrl(featured.profile_photo_drive_file_id)}
                alt={featured.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-xs text-muted">
                {t.adopt.noPhoto}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-medium uppercase tracking-wide text-primary">
              {t.admin.website.featured.currentlyFeatured}
            </span>
            <Link
              href={`/adopt/${featured.id}`}
              className="truncate text-base font-semibold text-foreground hover:text-primary"
            >
              {featured.thai_name
                ? `${featured.name} (${featured.thai_name})`
                : featured.name}
            </Link>
            <span className="text-sm text-muted">
              {[speciesLabel(t, featured.species), featured.breed]
                .filter(Boolean)
                .join(" · ") || t.adopt.detailsComingSoon}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">{t.admin.website.featured.none}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <ResidentPicker
          single
          residents={residents}
          selectedIds={featured ? [featured.id] : []}
          onChange={(ids) => save(ids[0] ?? null)}
          triggerLabel={t.admin.website.featured.selectResident}
        />
        {isPending && (
          <span className="text-sm text-muted">{t.common.saving}</span>
        )}
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.type === "error" ? "text-danger" : "text-success"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
