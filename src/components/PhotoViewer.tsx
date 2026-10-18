"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type ViewerPhoto = { drive_file_id: string; file_name: string | null };

const SWIPE_PX = 50;

/**
 * Full-screen, read-only photo viewer: the whole uncropped image on a dark
 * backdrop, with arrows / swipe through `photos`. Closed by the X, Escape,
 * a tap on the backdrop or the phone's back gesture (a history entry is
 * pushed while open). Focus returns to whatever opened it.
 *
 * Deliberately has no actions (move, delete, set-as-profile): those live in
 * PhotoGallery's own dialog. `footer` is the one slot for a link.
 */
export function PhotoViewer({
  photos,
  startIndex,
  onClose,
  footer,
}: {
  photos: ViewerPhoto[];
  startIndex: number;
  onClose: () => void;
  footer?: ReactNode;
}) {
  const { t } = useI18n();
  const [index, setIndex] = useState(startIndex);
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closedByPop = useRef(false);
  const count = photos.length;
  const photo = photos[index];

  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + count) % count),
    [count],
  );

  // Back gesture: one history entry while open; popping it closes the viewer.
  useEffect(() => {
    history.pushState({ photoViewer: true }, "");
    function onPop() {
      closedByPop.current = true;
      onClose();
    }
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!closedByPop.current && history.state?.photoViewer) history.back();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (count > 1 && e.key === "ArrowLeft") go(-1);
      else if (count > 1 && e.key === "ArrowRight") go(1);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [count, go, onClose]);

  if (!photo || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.file_name ?? t.photos.photoFallback}
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between gap-3 p-3 text-white">
        <span className="text-sm">{count > 1 ? t.photos.viewer.position(index + 1, count) : ""}</span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="inline-flex h-11 w-11 items-center justify-center rounded text-white hover:bg-white/10"
        >
          <X aria-hidden="true" className="h-6 w-6" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* 1200 px is the route's largest size; object-contain shows the whole image. */}
        <img
          key={photo.drive_file_id}
          src={driveImageUrl(photo.drive_file_id, 1200)}
          alt={photo.file_name ?? t.photos.residentPhotoAlt}
          className="max-h-full max-w-full object-contain"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t.photos.viewer.previous}
              className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronLeft aria-hidden="true" className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t.photos.viewer.next}
              className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ChevronRight aria-hidden="true" className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {footer && <div className="p-3 text-center text-sm text-white">{footer}</div>}
    </div>,
    document.body,
  );
}
