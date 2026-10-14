import { preload } from "react-dom";
import { driveImageUrl, type PhotoWidth } from "@/lib/google/drive-client";

/**
 * A Drive photo on a public page, in whichever of the route's sizes suits the
 * screen. `images.unoptimized` is on (no `/_next/image` on Workers), so
 * `next/image` emits a single `src`; this is the plain `<img srcset>` the
 * 2026-10-01 photo-sizing decision left for later. The browser picks 400,
 * 800 or 1200 from `sizes`, so a phone no longer downloads the laptop's copy
 * (docs/seo-audit-2026-10-14.md, T10).
 *
 * Fills its box like `next/image fill` did: the parent is `relative` with an
 * aspect ratio or a height, and `className` says how the photo fits it.
 * `priority` is for the one photo at the top of the page (the LCP element):
 * eager, high fetch priority, and a preload hint in `<head>` so the fetch
 * starts before the HTML has finished arriving.
 */
const SRCSET_WIDTHS: PhotoWidth[] = [400, 800, 1200];

export function publicPhotoSrcSet(fileId: string): string {
  return SRCSET_WIDTHS.map((w) => `${driveImageUrl(fileId, w)} ${w}w`).join(", ");
}

export function PublicPhoto({
  fileId,
  alt,
  sizes,
  fallback = 800,
  priority = false,
  className = "",
}: {
  fileId: string;
  alt: string;
  /** The `sizes` attribute: how wide the photo renders at each breakpoint. */
  sizes: string;
  /** The `src` for a browser without srcset support. */
  fallback?: PhotoWidth;
  priority?: boolean;
  className?: string;
}) {
  const src = driveImageUrl(fileId, fallback);
  const srcSet = publicPhotoSrcSet(fileId);
  if (priority) {
    preload(src, { as: "image", imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: "high" });
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- srcset by hand; see above
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  );
}
