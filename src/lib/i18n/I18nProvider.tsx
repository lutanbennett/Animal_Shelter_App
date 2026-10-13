"use client";

import { createContext, use, useContext, useMemo, type ReactNode } from "react";
import type { Dictionary } from "./dictionaries/en";
import type { Locale } from "./locales";

type I18nContextValue = { locale: Locale; t: Dictionary };

const I18nContext = createContext<I18nContextValue | null>(null);

// `t` is resolved here (client side) rather than passed in as a prop from the
// server layout — dictionaries contain formatter functions (pluralization,
// interpolation), and functions can't cross the Server->Client Component
// prop boundary. Only the plain `locale` string crosses that boundary.
//
// Only the active locale is loaded: each dictionary is its own chunk, fetched
// with a dynamic import() and read with `use()`, so the tree suspends until
// it arrives (server-rendered HTML is already complete; no keys ever paint).
const loaders: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  en: () => import("./dictionaries/en"),
  th: () => import("./dictionaries/th"),
};
const cache = new Map<Locale, Promise<Dictionary>>();

function loadDictionary(locale: Locale) {
  let p = cache.get(locale);
  if (!p) {
    p = loaders[locale]().then((m) => m.default);
    cache.set(locale, p);
  }
  return p;
}

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = use(loadDictionary(locale));
  const value = useMemo(() => ({ locale, t }), [locale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
