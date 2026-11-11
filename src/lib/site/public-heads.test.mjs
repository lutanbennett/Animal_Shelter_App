// #t48xh slice D: every public page's <head> carries a canonical, en/th/x-default and
// og:locale:alternate, and an og:url in the render language. Driven off PUBLIC_PAGE_PREFIXES, so a page
// added under a public prefix is covered, or this fails naming it. The live rendered head, per page
// and shape, is proved by `node scripts/check-public-heads.mjs` (needs a dev server).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PUBLIC_PAGE_PREFIXES } from "../public-paths.ts";

// /r/CODE and /e/ID are per-item card pages, not indexed pages: no alternates by design.
const SKIP = new Set(["/r", "/e"]);
const root = path.resolve("src/app");

function pagesUnder(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...pagesUnder(p));
    else if (e.name === "page.tsx") out.push(p);
  }
  return out;
}

const files = new Set();
for (const prefix of PUBLIC_PAGE_PREFIXES.filter((p) => !SKIP.has(p))) pagesUnder(path.join(root, prefix)).forEach((f) => files.add(f));
files.add(path.join(root, "page.tsx"));

test("the list finds the public pages", () => assert.ok(files.size >= 14, `only ${files.size} pages found`));

for (const f of files) {
  const rel = path.relative(root, f).replaceAll("\\", "/");
  test(`${rel}: head has alternates, og alternate locale and a localized og:url`, () => {
    const src = fs.readFileSync(f, "utf8");
    if (/robots: { index: false }/.test(src)) return; // noindex pages need no alternates
    const viaShared = /sitePageMetadata\(/.test(src);
    const own = /publicAlternates\(/.test(src) && /alternateLocale:\s*ogAlternateLocale\(/.test(src) && /\burl:\s*localizedHref\(/.test(src);
    assert.ok(viaShared || own, `${rel} does not build its head through publicAlternates/ogAlternateLocale/localizedHref (or sitePageMetadata)`);
    assert.ok(!/^\s+url:\s*["`]\//m.test(src), `${rel} has a bare-path og:url`);
  });
}

test("the shared view builds the head for foster, volunteer, donate, about", () => {
  const view = fs.readFileSync(path.join(root, "adopt/SitePageView.tsx"), "utf8");
  assert.match(view, /publicAlternates\(/);
  assert.match(view, /alternateLocale:\s*ogAlternateLocale\(/);
  assert.match(view, /url:\s*localizedHref\(/);
  for (const s of ["foster", "volunteer", "donate", "about"]) {
    assert.match(fs.readFileSync(path.join(root, s, "page.tsx"), "utf8"), /generateMetadata\s*=\s*\(\)\s*=>\s*sitePageMetadata\(/, s);
  }
});
