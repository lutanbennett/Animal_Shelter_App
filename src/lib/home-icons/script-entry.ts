// Bundled by scripts/sync-home-icons.mjs (esbuild), which cannot read the "@/" paths itself.
import en from "@/lib/i18n/dictionaries/en";
import { iconCatalogue, iconFileStem } from "./catalogue";
import { CARDS } from "@/lib/permissions/cards";
import { buildIconSvg } from "./svg";
import { HOME_ICONS_FOLDER } from "./folder";

export { buildIconSvg, iconFileStem, HOME_ICONS_FOLDER };
export const catalogueEn = () => iconCatalogue(en);

/** What the card set is, straight from cards.ts, so the script can say how its pages relate to the cards. */
export const cardOpens = () => Object.values(CARDS).map((c) => c.opens as string);
