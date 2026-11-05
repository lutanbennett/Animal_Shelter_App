// Bundled and run by scripts/build-manual-pdf.mjs. Draws the full manual once per
// language and writes each to .manual-pdf/<locale>.pdf. Not part of the app.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import manual from "@/lib/manual/en";
import { renderManualPdf, screenshotSrcs, type ManualCard, type ManualImages } from "@/lib/manual/manual-pdf";
import { PREBUILT_DIR, prebuiltName } from "@/lib/manual/prebuilt";
import { CARDS, CARD_KEYS } from "@/lib/permissions/cards";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { locales } from "@/lib/i18n/locales";

const outDir = path.resolve(process.cwd(), PREBUILT_DIR);
await mkdir(outDir, { recursive: true });

const images: ManualImages = new Map();
for (const src of new Set(screenshotSrcs(manual, true, null))) {
  // Only paths inside public/manual/, as the route does.
  const file = path.resolve(process.cwd(), "public", "." + src);
  if (!src.startsWith("/manual/") || !file.startsWith(path.resolve(process.cwd(), "public", "manual") + path.sep)) continue;
  images.set(src, new Uint8Array(await readFile(file)));
}

for (const locale of locales) {
  const t = getDictionary(locale);
  const cards: ManualCard[] = CARD_KEYS.map((key) => ({
    key,
    label: CARDS[key].label(t),
    description: t.admin.whoDoesWhat.cardsView.description[key],
  }));
  const started = Date.now();
  const pdf = await renderManualPdf(manual, { cards, cardsHeading: t.manualPage.cardsAtAGlance, all: true, images, perms: null });
  // Write beside, then rename: a reader never sees half a file.
  const final = path.join(outDir, prebuiltName(locale));
  await writeFile(final + ".tmp", pdf);
  await rename(final + ".tmp", final);
  console.log(`manual-pdf: ${locale} ${(pdf.length / 1048576).toFixed(2)} MB in ${((Date.now() - started) / 1000).toFixed(1)} s`);
}
