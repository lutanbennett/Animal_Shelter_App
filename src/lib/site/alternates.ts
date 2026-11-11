import { localizedHref } from "@/lib/public-paths";

/**
 * Slice C of #t48xh: the one place a public page learns its language alternates.
 * `path` is the BARE (English) path; `locale` is the language this render is in.
 * The canonical is the page's own address in that language (so the Thai page is not
 * declared a duplicate of the English one); `en` and `x-default` are the bare path,
 * `th` is the `/th/` twin. A new public page's metadata is
 * `alternates: publicAlternates("/its-path", locale)` and, beside `locale:` in its
 * openGraph, `alternateLocale: ogAlternateLocale(locale)`.
 */
export function publicAlternates(path: string, locale: string) {
  return {
    canonical: localizedHref(path, locale),
    languages: {
      en: path,
      th: localizedHref(path, "th"),
      "x-default": path,
    },
  };
}

/** `og:locale:alternate`: the other language's Open Graph locale. */
export function ogAlternateLocale(locale: string): string {
  return locale === "th" ? "en_GB" : "th_TH";
}
