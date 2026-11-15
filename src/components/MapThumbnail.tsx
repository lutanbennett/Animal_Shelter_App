"use client";

import { useEffect, useRef, useState } from "react";
import type { AddressMap } from "@/lib/contacts/contacts";

/**
 * A keyless Google Maps embed that opens `map.href` when tapped. The
 * embed's own controls are covered on purpose: a tap inside it went
 * wherever Google's embed chose, which is how a tap on the contact hub's
 * and Shelter Friends' map could land on a Google 404 while the picture
 * looked fine. Covered, the picture and the tap come from the same
 * `AddressMap`, so they can't disagree — and on a phone the tap opens the
 * Maps app at the place, which beats panning a 200px frame anyway.
 *
 * The embed (about 600 KB from Google) is fetched only once the visitor
 * has scrolled, touched or pressed a key AND the box is near the screen.
 * The browser's own `loading="lazy"` already skips maps far down the
 * page but still loaded the one in view at the top before anyone had done
 * anything, ahead of the page's own content. The 200px box is
 * reserved from the start so nothing shifts, and the link over it is
 * always there, so a visitor who never scrolls (a keyboard or screen
 * reader user, or no script) still has the map one press away.
 */
export function MapThumbnail({
  map,
  title,
  openLabel,
  className = "",
}: {
  map: AddressMap;
  /** The iframe's accessible name, e.g. "Map showing where X is". */
  title: string;
  /** The link's accessible name, e.g. "Open in Google Maps". */
  openLabel: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  // Without IntersectionObserver there is no way to tell, so count as near.
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");
  const [acted, setActed] = useState(false);

  useEffect(() => {
    if (acted) return;
    const go = () => setActed(true);
    const events = ["scroll", "pointerdown", "touchstart", "keydown", "wheel"];
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, go));
  }, [acted]);

  useEffect(() => {
    const el = box.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "150px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  const frame =
    "h-full w-full rounded-lg border border-border bg-surface-hover";
  return (
    <div ref={box} className={`relative h-[200px] w-full ${className}`}>
      {near && acted ? (
        <iframe
          src={map.src}
          title={title}
          referrerPolicy="no-referrer-when-downgrade"
          tabIndex={-1}
          className={`pointer-events-none ${frame}`}
        />
      ) : (
        <div aria-hidden="true" className={frame} />
      )}
      <a
        href={map.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={openLabel}
        className="absolute inset-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />
    </div>
  );
}
