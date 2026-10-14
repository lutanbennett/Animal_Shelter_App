import "server-only";
import type { Metadata } from "next";
import { driveImageUrl } from "@/lib/google/drive-client";
import type { Locale } from "@/lib/i18n/locales";
import type { SiteContent } from "@/lib/site/content";
import { lineLink, pairedText, socialLinks, visitingHoursLines } from "@/lib/site/content";

/**
 * What the public site says about itself to the machines that read it:
 * the default share picture and the AnimalShelter schema
 * (docs/decisions/2026-10-14-public-site-findability.md).
 *
 * Every absolute address comes from getSiteOrigin() — the host the request
 * arrived on, or NEXT_PUBLIC_SITE_URL where set — so the public site's move
 * to its own domain is a setting, never a sweep of these files.
 */

/** The logo in public/, the one static file the proxy lets a visitor fetch. */
export const LOGO_PATH = "/lca-logo.jpg";

/**
 * The share picture for a page that has none of its own: the hero photo
 * from Settings → Website, else the logo. Both are reachable with no
 * session — the hero through the photo proxy, which serves any file a
 * public view shows (0084), the logo as a static file — because Facebook,
 * LINE and Google fetch a share picture anonymously.
 */
export function defaultShareImage(
  content: Pick<SiteContent, "hero_drive_file_id" | "hero_alt" | "hero_alt_th"> | null,
  locale: Locale,
  appName: string,
): { url: string; alt: string } {
  if (content?.hero_drive_file_id) {
    return {
      url: driveImageUrl(content.hero_drive_file_id, 1200),
      alt: pairedText(locale, content.hero_alt, content.hero_alt_th) || appName,
    };
  }
  return { url: LOGO_PATH, alt: appName };
}

/**
 * The openGraph.images and twitter fields for a share picture, so every
 * public page states them the same way. `summary_large_image` for a photo;
 * the near-square logo reads better as a plain summary card.
 */
export function shareImageMetadata(
  image: { url: string; alt: string },
  title: string,
  description: string,
): { images: NonNullable<Metadata["openGraph"]>["images"]; twitter: Metadata["twitter"] } {
  return {
    images: [{ url: image.url, alt: image.alt }],
    twitter: {
      card: image.url === LOGO_PATH ? "summary" : "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

/**
 * schema.org AnimalShelter (a LocalBusiness) for the home page, built from
 * the same site_content row the footer shows, so nothing is typed twice.
 * Fields that are blank in Settings → Website are left out rather than
 * sent empty. Visiting hours are the admin's free text, one line per
 * entry: schema.org's openingHours is Text, and a parser that wants the
 * "Mo-Fr 09:00-17:00" form gets the lines as written rather than a guess.
 */
export function animalShelterJsonLd(
  content: SiteContent | null,
  origin: URL | null,
  locale: Locale,
  appName: string,
  description: string,
): string {
  const abs = (path: string) => (origin ? new URL(path, origin).toString() : path);
  const social = socialLinks(content);
  // The LINE Official Account's add-friend page counts as a profile of the
  // shelter, like its Facebook page; schema.org has no LINE property.
  const sameAs = [social.facebook, social.instagram, social.x, lineLink(content?.contact_line)?.href].filter(
    (url): url is string => Boolean(url),
  );
  const hours = visitingHoursLines(locale, content);
  const image = [
    abs(LOGO_PATH),
    ...(content?.hero_drive_file_id ? [abs(driveImageUrl(content.hero_drive_file_id, 1200))] : []),
  ];
  const data = {
    "@context": "https://schema.org",
    "@type": "AnimalShelter",
    name: appName,
    description,
    ...(origin ? { url: origin.toString() } : {}),
    logo: abs(LOGO_PATH),
    image,
    ...(content?.contact_address?.trim() ? { address: content.contact_address.trim() } : {}),
    ...(content?.contact_phone?.trim() ? { telephone: content.contact_phone.trim() } : {}),
    ...(content?.contact_email?.trim() ? { email: content.contact_email.trim() } : {}),
    ...(content?.contact_map_url?.trim() ? { hasMap: content.contact_map_url.trim() } : {}),
    ...(hours.length > 0 ? { openingHours: hours } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
  return jsonLdString(data);
}

/**
 * JSON-LD for a <script type="application/ld+json">: "<" is escaped, as in
 * PublicHeader's BreadcrumbList, so "</script>" in an admin's text cannot
 * end the element. (Before 2026-10-14 this replaced "<" with "<", a no-op.)
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "<");
}

/**
 * schema.org WebSite for the home page, so a search result shows the site
 * by its name rather than by its domain (Google reads this for the "site
 * name" in results). Same name and origin as the AnimalShelter.
 */
export function webSiteJsonLd(origin: URL | null, locale: Locale, appName: string): string | null {
  if (!origin) return null;
  return jsonLdString({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: appName,
    url: origin.toString(),
    inLanguage: locale === "th" ? "th" : "en",
  });
}

/**
 * schema.org Article for a published story, the one shape Google shows a
 * rich result for: headline, date, cover, and the shelter as publisher with
 * its logo. `image` is the cover or the site's default picture, so a story
 * without a cover still carries one. No author beyond the shelter: stories
 * are written by staff on its behalf.
 */
export function articleJsonLd(args: {
  origin: URL | null;
  path: string;
  title: string;
  description: string;
  image: string;
  datePublished: string | null;
  locale: Locale;
  appName: string;
}): string | null {
  const { origin, path, title, description, image, datePublished, locale, appName } = args;
  if (!origin) return null;
  const abs = (p: string) => new URL(p, origin).toString();
  return jsonLdString({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: [abs(image)],
    ...(datePublished ? { datePublished } : {}),
    inLanguage: locale === "th" ? "th" : "en",
    mainEntityOfPage: abs(path),
    author: { "@type": "Organization", name: appName, url: origin.toString() },
    publisher: {
      "@type": "Organization",
      name: appName,
      url: origin.toString(),
      logo: { "@type": "ImageObject", url: abs(LOGO_PATH) },
    },
  });
}
