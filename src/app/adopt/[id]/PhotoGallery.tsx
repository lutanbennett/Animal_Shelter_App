"use client";

import Image from "next/image";
import { useState } from "react";
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
        <div className="flex flex-wrap gap-2">
          {photoIds.map((fileId, index) => (
            <button
              key={fileId}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={t.adopt.showPhoto(index + 1, photoIds.length)}
              aria-current={index === selected}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border transition ${
                index === selected
                  ? "border-primary ring-2 ring-primary/50"
                  : "border-border opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={driveImageUrl(fileId)}
                alt=""
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
