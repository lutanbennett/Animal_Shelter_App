"use client";

import Image from "next/image";
import { useState } from "react";
import { ThumbnailStrip } from "@/components/ThumbnailStrip";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type StoryPhoto = {
  id: string;
  drive_file_id: string;
  /** Already picked for the visitor's language by the page. */
  caption: string;
};

/**
 * The story page's photo viewer — one large photo with its caption and a
 * thumbnail strip, the same shape as the adoption page's gallery so the two
 * public pages feel alike. Captions are resolved server-side (English
 * fallback) so this only ever shows one string.
 */
export function StoryGallery({
  title,
  photos,
}: {
  title: string;
  photos: StoryPhoto[];
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(0);

  if (photos.length === 0) return null;
  const current = photos[Math.min(selected, photos.length - 1)];

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface">
        <Image
          key={current.id}
          src={driveImageUrl(current.drive_file_id)}
          alt={current.caption || title}
          fill
          priority
          className="object-contain"
        />
      </div>
      {current.caption && (
        <figcaption className="text-sm leading-relaxed text-muted">
          {current.caption}
        </figcaption>
      )}

      {photos.length > 1 && (
        <ThumbnailStrip
          thumbnails={photos.map((photo) => ({
            key: photo.id,
            src: driveImageUrl(photo.drive_file_id),
          }))}
          selected={selected}
          onSelect={setSelected}
          thumbLabel={t.ourWork.showPhoto}
        />
      )}
    </figure>
  );
}
