#!/usr/bin/env node
/**
 * English prose in STRING AND TEMPLATE LITERALS in .tsx files (not JSX text,
 * which check-thai-dictionary rule 2 already reads). Walks the TypeScript AST,
 * so apostrophes in JSX text cannot derail it. Report only, exits 0.
 *   node scripts/measure-english-in-tsx.mjs [--list]
 * Skipped: import/export specifiers, `className`-like attributes, type
 * positions, and anything NOT_PROSE in english-in-ts-classes.mjs.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ts = (await import("typescript")).default;
const { classify } = await import("./lib/english-in-ts-classes.mjs");
const NON_TEXT_ATTRS = /^(className|class|style|sizes|href|src|srcSet|id|name|type|key|rel|target|method|action|htmlFor|role|autoComplete|inputMode|pattern|d|viewBox|fill|stroke|xmlns|loading|decoding|fetchPriority|crossOrigin|variant|size|data-.*)$/;
const words = (t) => t.match(/[A-Za-z][A-Za-z'’]*/g) ?? [];
const SHAPE = /^[A-Z(“"']?[A-Za-z][A-Za-z'’]*(?:[\s,:;.!?()\-–—/&%$'"“”0-9]+[A-Za-z0-9][A-Za-z0-9'’]*){2,}[\s.!?]*$/;
const prose = (t) => /\s/.test(t) && SHAPE.test(t) && !/https?:|=>|[{};=<>]/.test(t) && words(t).length >= 3 && words(t).some((w) => w.length >= 4);
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const f = path.join(dir, e);
    if (statSync(f).isDirectory()) walk(f, out);
    else if (e.endsWith(".tsx")) out.push(f);
  }
  return out;
}
const rows = [];
for (const file of walk(path.join(root, "src"))) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  if (rel.startsWith("src/lib/i18n/dictionaries/") || rel.startsWith("src/lib/manual/")) continue;
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (n) => {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n) || ts.isTypeNode(n) || ts.isLiteralTypeNode(n)) return;
    if (ts.isJsxAttribute(n) && NON_TEXT_ATTRS.test(n.name.getText())) return;
    let t = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) t = n.text;
    else if (ts.isTemplateExpression(n)) t = n.head.text + n.templateSpans.map((s) => " " + s.literal.text).join("");
    if (t !== null) {
      t = t.replace(/\s+/g, " ").trim();
      if (prose(t) && classify(rel, t)?.id !== "not-prose") rows.push({ rel, line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, t });
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
const files = new Set(rows.map((r) => r.rel));
console.log(`prose in .tsx string/template literals: ${rows.length} in ${files.size} files`);
if (process.argv.includes("--list")) for (const r of rows) console.log(`${r.rel}:${r.line} ${JSON.stringify(r.t.slice(0, 100))}`);
