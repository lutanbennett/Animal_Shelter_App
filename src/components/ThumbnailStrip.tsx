"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type Thumbnail = {
  key: string;
  src: string;
};

/**
 * A single-row strip of thumbnails that scrolls sideways instead of
 * wrapping, so a resident with thirty photos takes up one row rather than
 * five. Phones swipe; desktops get arrow buttons (only when the strip
 * actually overflows) and ←/→ keys move the selection when a thumbnail has
 * focus. Whatever is selected is kept scrolled into view. Thumbnails are
 * lazy-loaded, so an off-screen tail doesn't hit the photo proxy up front.
 *
 * Shared by the public adoption and story galleries; the staff Photos tab
 * needs every tile reachable at once for set-as-profile / delete, so it
 * caps its grid with a "Show all" toggle instead (see PhotoGallery).
 */
export function ThumbnailStrip({
  thumbnails,
  selected,
  onSelect,
  thumbLabel,
}: {
  thumbnails: Thumbnail[];
  selected: number;
  onSelect: (index: number) => void;
  /** Accessible name for each thumbnail button, 1-based. */
  thumbLabel: (index: number, total: number) => string;
}) {
  const { t } = useI18n();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  // The arrows only appear when there is somewhere to go, so a strip that
  // fits in one screen looks exactly like the old wrapped row did.
  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollBack(el.scrollLeft > 1);
    setCanScrollForward(el.scrollLeft < maxScroll - 1);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(el);
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", updateArrows);
    };
  }, [updateArrows, thumbnails.length]);

  // Keep the selected thumbnail visible. Scrolling the strip itself (rather
  // than scrollIntoView) means selecting a photo never yanks the page.
  useEffect(() => {
    const el = scrollerRef.current;
    const thumb = thumbRefs.current[selected];
    if (!el || !thumb) return;
    const start = thumb.offsetLeft;
    const end = start + thumb.offsetWidth;
    if (start < el.scrollLeft) {
      el.scrollTo({ left: start, behavior: "smooth" });
    } else if (end > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: end - el.clientWidth, behavior: "smooth" });
    }
  }, [selected]);

  function scrollBy(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = Math.max(0, selected - 1);
    else if (e.key === "ArrowRight") next = Math.min(thumbnails.length - 1, selected + 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = thumbnails.length - 1;
    if (next === null || next === selected) return;
    e.preventDefault();
    onSelect(next);
    thumbRefs.current[next]?.focus({ preventScroll: true });
  }

  const arrowClass =
    "absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/90 text-foreground shadow transition hover:bg-surface-hover sm:flex";

  return (
    <div className="relative">
      {canScrollBack && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label={t.common.scrollBack}
          className={`${arrowClass} left-1`}
        >
          <span aria-hidden="true">‹</span>
        </button>
      )}
      <div
        ref={scrollerRef}
        role="group"
        onKeyDown={onKeyDown}
        className="relative flex snap-x gap-2 overflow-x-auto scroll-smooth py-0.5 [scrollbar-width:thin]"
      >
        {thumbnails.map((thumb, index) => (
          <button
            key={thumb.key}
            ref={(node) => {
              thumbRefs.current[index] = node;
            }}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={thumbLabel(index + 1, thumbnails.length)}
            aria-current={index === selected}
            tabIndex={index === selected ? 0 : -1}
            className={`relative h-16 w-16 shrink-0 snap-start overflow-hidden rounded border transition ${
              index === selected
                ? "border-primary ring-2 ring-primary/50"
                : "border-border opacity-80 hover:opacity-100"
            }`}
          >
            <img
              src={thumb.src}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
      {canScrollForward && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label={t.common.scrollForward}
          className={`${arrowClass} right-1`}
        >
          <span aria-hidden="true">›</span>
        </button>
      )}
    </div>
  );
}
