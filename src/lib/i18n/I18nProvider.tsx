"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getDictionary } from "./get-dictionary";
import type { Dictionary } from "./dictionaries/en";
import type { Locale } from "./locales";

type I18nContextValue = { locale: Locale; t: Dictionary };

const I18nContext = createContext<I18nContextValue | null>(null);

// `t` is resolved here (client side) rather than passed in as a prop from the
// server layout — dictionaries contain formatter functions (pluralization,
// interpolation), and functions can't cross the Server->Client Component
// prop boundary. Only the plain `locale` string crosses that boundary; both
// dictionaries are small enough to ship in the client bundle either way.
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ locale, t: getDictionary(locale) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
