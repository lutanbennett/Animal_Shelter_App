/**
 * The names Lanna goes by, used ONLY as the fallback when a shelter has no stored value (or there is no request: a
 * cron job, scripts/deploy.mjs). Imports nothing, so a Node script can load it by type stripping. This file and
 * shelter-settings.ts are the only places outside the manual and the recorded files that may name Lanna
 * (docs/shelter-settings-registry.json, scripts/check-no-lanna-literal.mjs).
 */
export type ShelterNames = { displayName: string; shortName: string };

export const DEFAULT_SHELTER_NAMES: ShelterNames = {
  displayName: "Lanna Care for Animals",
  shortName: "Lanna Care",
};
