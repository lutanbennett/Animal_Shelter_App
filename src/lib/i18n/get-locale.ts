import "server-only";
import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, localePathHeader, type Locale } from "./locales";

export async function getLocale(): Promise<Locale> {
  // A path that NAMES a language (/th/…) wins; the proxy sets this header, and
  // strips any the client sent. A bare path carries none and falls through.
  const fromPath = (await headers()).get(localePathHeader);
  if (isLocale(fromPath)) return fromPath;
  const store = await cookies();
  const value = store.get(localeCookieName)?.value;
  return isLocale(value) ? value : defaultLocale;
}
