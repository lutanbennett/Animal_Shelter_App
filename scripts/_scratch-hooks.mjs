import { pathToFileURL } from "node:url";
const map = {
  pdfkit: pathToFileURL(process.cwd() + "/node_modules/pdfkit/js/pdfkit.browser.mjs").href,
  "@react-pdf/font": pathToFileURL(process.cwd() + "/node_modules/@react-pdf/font/lib/index.browser.js").href,
};
export async function resolve(specifier, context, next) {
  if (map[specifier]) return { url: map[specifier], shortCircuit: true };
  return next(specifier, context);
}
