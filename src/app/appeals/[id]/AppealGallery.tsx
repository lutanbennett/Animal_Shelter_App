"use client";

import { useState } from "react";
import { PublicPhoto } from "@/components/PublicPhoto";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type GalleryItem = { id: string; fileId: string; isGraphic: boolean };

/**
 * The appeal's photos. A photo staff marked as distressing is blurred, with a
 * plain warning and a button: the visitor chooses to see it, and the choice is
 * per photo and per visit (nothing is remembered). Its thumbnail is blurred
 * too. Without JavaScript a flagged photo simply stays hidden, which is the
 * safe way round.
 */
export function AppealGallery({ items, alt }: { items: GalleryItem[]; alt: string }) {
  const { t } = useI18n();
  const g = t.appeals.photos;
  const [selected, setSelected] = useState(0);
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());
  const frame = "relative aspect-[39/34] w-full overflow-hidden bg-site-sand lg:aspect-square lg:rounded-[20px]";

  if (items.length === 0) {
    return (
      <div className={frame}>
        <div className="flex h-full items-center justify-center text-base text-site-ink-muted">{g.none}</div>
      </div>
    );
  }

  const current = items[Math.min(selected, items.length - 1)];
  const hidden = current.isGraphic && !shown.has(current.id);

  return (
    <div className="flex flex-col gap-2.5">
      <div className={frame}>
        <PublicPhoto
          key={current.id}
          fileId={current.fileId}
          alt={hidden ? "" : alt}
          priority
          fallback={1200}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={`object-cover object-[center_30%] ${hidden ? "scale-110 blur-3xl" : ""}`}
        />
        {hidden && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-site-ink/55 p-6 text-center text-white">
            <p className="max-w-xs text-lg font-bold leading-snug">{g.warning}</p>
            <button
              type="button"
              onClick={() => setShown((prev) => new Set(prev).add(current.id))}
              className="inline-flex h-11 items-center rounded-full bg-site-paper px-5 text-base font-bold text-site-ink hover:bg-site-sand"
            >
              {g.show}
            </button>
          </div>
        )}
      </div>

      {items.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto px-4 pb-1 lg:px-0">
          {items.map((item, index) => {
            const blurred = item.isGraphic && !shown.has(item.id);
            return (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-label={g.showPhoto(index + 1)}
                  aria-current={index === selected}
                  className={`relative block h-16 w-16 overflow-hidden rounded-lg border-2 bg-site-sand ${
                    index === selected ? "border-site-action" : "border-transparent"
                  }`}
                >
                  <img
                    src={driveImageUrl(item.fileId, 160)}
                    alt=""
                    loading="lazy"
                    className={`h-full w-full object-cover ${blurred ? "scale-125 blur-md" : ""}`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
