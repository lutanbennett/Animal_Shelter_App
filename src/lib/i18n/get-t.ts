import "server-only";
import { getLocale } from "./get-locale";
import { getDictionary } from "./get-dictionary";

/** Convenience for server components and server actions: current locale + its dictionary. */
export async function getT() {
  const locale = await getLocale();
  return { t: getDictionary(locale), locale };
}
