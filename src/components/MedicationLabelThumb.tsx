import Image from "next/image";
import { driveImageUrl } from "@/lib/google/drive-client";

/**
 * The photo of a medication's box or bottle label, small, so a person holding
 * the box can match it at a glance (stocktake, delivery form, Management →
 * Medications). Served by the photo proxy at the 160 px rendition: the proxy
 * shows it only to a signed-in caller who can read the medication row. No
 * photo renders nothing, so rows without one are unchanged.
 */
export function MedicationLabelThumb({
  fileId,
  alt,
  size = 56,
}: {
  fileId: string | null | undefined;
  alt: string;
  /** Rendered edge in px; the 160 px rendition covers 2x up to 80. */
  size?: number;
}) {
  if (!fileId) return null;
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded border border-border bg-white"
      style={{ width: size, height: size }}
    >
      <Image
        src={driveImageUrl(fileId, 160)}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-contain"
      />
    </span>
  );
}
