import en from "./dictionaries/en";
import th from "./dictionaries/th";
import type { Locale } from "./locales";

const dictionaries = { en, th };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
