import type { AddressMap } from "@/lib/contacts/contacts";

/**
 * A keyless Google Maps embed that opens `map.href` when tapped. The
 * embed's own controls are covered on purpose: a tap inside it went
 * wherever Google's embed chose, which is how a tap on the contact hub's
 * and Shelter Friends' map could land on a Google 404 while the picture
 * looked fine. Covered, the picture and the tap come from the same
 * `AddressMap`, so they can't disagree — and on a phone the tap opens the
 * Maps app at the place, which beats panning a 200px frame anyway.
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
  return (
    <div className={`relative h-[200px] w-full ${className}`}>
      <iframe
        src={map.src}
        title={title}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        tabIndex={-1}
        className="pointer-events-none h-full w-full rounded-lg border border-border bg-surface-hover"
      />
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
