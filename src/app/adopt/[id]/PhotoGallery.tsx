"use client";

import Image from "next/image";
import { useState } from "react";
import { ThumbnailStrip } from "@/components/ThumbnailStrip";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";

/**
 * The resident page's photo, as in docs/design/resident-profile-mobile.png:
 * edge to edge on a phone (390 × 340 in the mockup), a rounded square
 * beside the details from lg up, with the thumbnail strip under it.
 */
export function PhotoGallery({
  residentName,
  photoIds,
}: {
  residentName: string;
  photoIds: string[];
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(0);
  const frame =
    "relative aspect-[39/34] w-full overflow-hidden bg-site-sand lg:aspect-square lg:rounded-[20px]";

  if (photoIds.length === 0) {
    return (
      <div className={frame}>
        <div className="flex h-full items-center justify-center text-base text-site-ink-muted">
          {t.adopt.noPhoto}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className={frame}>
        <Image
          key={photoIds[selected]}
          src={driveImageUrl(photoIds[selected])}
          alt={residentName}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-[center_30%]"
        />
      </div>

      {photoIds.length > 1 && (
        <div className="px-4 lg:px-0">
          <ThumbnailStrip
            thumbnails={photoIds.map((fileId) => ({ key: fileId, src: driveImageUrl(fileId) }))}
            selected={selected}
            onSelect={setSelected}
            thumbLabel={t.adopt.showPhoto}
          />
        </div>
      )}
    </div>
  );
}
