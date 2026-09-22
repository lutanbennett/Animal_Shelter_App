"use client";

import Image from "next/image";
import { useState } from "react";
import { ThumbnailStrip } from "@/components/ThumbnailStrip";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function PhotoGallery({
  residentName,
  photoIds,
}: {
  residentName: string;
  photoIds: string[];
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(0);

  if (photoIds.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex h-full items-center justify-center text-sm text-muted">
          {t.adopt.noPhoto}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-surface">
        <Image
          key={photoIds[selected]}
          src={driveImageUrl(photoIds[selected])}
          alt={residentName}
          fill
          priority
          className="object-cover"
        />
      </div>

      {photoIds.length > 1 && (
        <ThumbnailStrip
          thumbnails={photoIds.map((fileId) => ({ key: fileId, src: driveImageUrl(fileId) }))}
          selected={selected}
          onSelect={setSelected}
          thumbLabel={t.adopt.showPhoto}
        />
      )}
    </div>
  );
}
