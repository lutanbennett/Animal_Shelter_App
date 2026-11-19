/**
 * The one shelter that, with no row of its own, keeps using the environment's Google settings.
 *
 * Its own file, with NO imports, on purpose: operator scripts load it under plain Node, which cannot resolve an
 * extensionless import, so a script may only reach a TS module whose own imports carry extensions. A leaf is always safe.
 */
export const FALLBACK_SHELTER_KEY = "lanna";
