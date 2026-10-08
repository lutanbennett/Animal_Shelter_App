import type { ReactNode } from "react";
import { zoneColour } from "@/lib/zones/palette";

/**
 * A zone's colour as a small filled dot (zones.colour, 0162). Decorative:
 * `aria-hidden`, and never shown without the zone's name beside it, so the
 * colour is never the only way to tell zones apart. Nothing is drawn for a
 * zone with no colour, so names still line up only where every zone has one.
 *
 * The ring is the page background, which keeps the dot visible on any filled
 * surface and sets it apart from the capacity bar and
 * badge, which are bars and pills, never dots.
 */
export function ZoneDot({
  colour,
  className = "",
}: {
  colour: string | null | undefined;
  className?: string;
}) {
  const hex = zoneColour(colour);
  if (!hex) return null;
  return (
    <span
      aria-hidden="true"
      data-zone-dot
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background ${className}`}
      style={{ backgroundColor: hex }}
    />
  );
}

/**
 * "Kennel 4 · ● Main Zone", the current place on the move, hospital, rehome
 * and death forms; null when neither is known, so a caller's `||` fallback still works.
 */
export function placeLine(place: {
  enclosureName: string | null;
  zoneName: string | null;
  zoneColour?: string | null;
}): ReactNode {
  const { enclosureName, zoneName, zoneColour } = place;
  if (!enclosureName && !zoneName) return null;
  return (
    <>
      {enclosureName}
      {enclosureName && zoneName && " · "}
      {zoneName && <ZoneName name={zoneName} colour={zoneColour} />}
    </>
  );
}

/**
 * A zone <select> with the chosen zone's dot drawn inside it, left of the
 * text. A native option cannot hold a dot, and the list stays native so a
 * phone opens its own picker; once a zone is chosen, its colour shows.
 */
export function ZoneSelectFrame({
  colour,
  children,
}: {
  colour: string | null | undefined;
  children: ReactNode;
}) {
  const shown = Boolean(zoneColour(colour));
  return (
    <div className={`relative flex flex-col ${shown ? "[&>select]:pl-8" : ""}`}>
      {children}
      <ZoneDot
        colour={colour}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
      />
    </div>
  );
}

/**
 * A zone name with its dot in front. `name` is already in the reader's
 * language (placeName()); the dot adds nothing for a screen reader.
 * Inline, and wraps with the name, so it never pushes a phone list sideways.
 */
export function ZoneName({
  name,
  colour,
  className = "",
}: {
  name: string;
  colour: string | null | undefined;
  className?: string;
}) {
  if (!zoneColour(colour)) return <span className={className}>{name}</span>;
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      <ZoneDot colour={colour} />
      <span className="min-w-0 break-words">{name}</span>
    </span>
  );
}
