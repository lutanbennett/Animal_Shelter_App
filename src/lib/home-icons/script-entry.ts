// Bundled by scripts/sync-home-icons.mjs (esbuild), which cannot read the "@/" paths itself.
import en from "@/lib/i18n/dictionaries/en";
import { iconCatalogue, iconFileStem } from "./catalogue";
import { buildIconSvg } from "./svg";
import { HOME_ICONS_FOLDER } from "./folder";

export { buildIconSvg, iconFileStem, HOME_ICONS_FOLDER };
export const catalogueEn = () => iconCatalogue(en);
