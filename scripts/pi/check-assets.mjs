#!/usr/bin/env node
// Post-deploy check: the stylesheets a served page references must come back
// from the public URL byte-for-byte as they are on disk in the build.
//
//   node scripts/pi/check-assets.mjs --url https://lannacare.org/ [--dir .next]
//
// Why: /_next/static/** is `immutable` for a year, so if Cloudflare ever stores a
// 404 or a half-written file for a stylesheet (a request landing mid-deploy), that
// failure sticks and the app renders with no styling for whoever reaches that edge
// (docs/decisions/2026-10-18-pi-deploy-safety.md). Exits 1 saying what it fetched,
// what it expected and what it got; exits 0 only when every stylesheet matches.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const url = opt("--url");
const dir = opt("--dir", ".next");
if (!url) {
  console.error("check-assets: --url is required");
  process.exit(2);
}

function fail(lines) {
  console.error("check-assets: FAILED — the served stylesheet is not the one just built.");
  for (const l of lines) console.error("  " + l);
  console.error("  This is what a poisoned Cloudflare cache looks like: the app renders with no styling.");
  console.error("  Fix: Cloudflare dashboard → Caching → Configuration → Purge Everything, then run this again");
  console.error("  (docs/release-procedure.md, 'Purge the Cloudflare cache').");
  process.exit(1);
}

const page = await fetch(url, { redirect: "follow", headers: { "user-agent": "deploy-check-assets" } });
const html = await page.text();
const base = page.url;
const hrefs = [...html.matchAll(/<link[^>]+href="([^"]*\/_next\/static\/[^"]+\.css)[^"]*"/g)].map((m) => m[1]);
const unique = [...new Set(hrefs)];
if (unique.length === 0) {
  fail([`fetched ${base} (HTTP ${page.status}, ${html.length} bytes) and found no /_next/static/*.css link in it`, "expected at least one stylesheet; the page may be an error or a login redirect"]);
}

const problems = [];
for (const href of unique) {
  const assetUrl = new URL(href, base);
  const onDisk = join(dir, assetUrl.pathname.replace(/^.*\/_next\//, ""));
  if (!existsSync(onDisk)) {
    problems.push(`${assetUrl.pathname}: the page references it but ${onDisk} is not in this build`);
    continue;
  }
  const expected = readFileSync(onDisk);
  const res = await fetch(assetUrl);
  const got = Buffer.from(await res.arrayBuffer());
  const cache = res.headers.get("cf-cache-status") ?? "none";
  if (res.status !== 200 || !got.equals(expected)) {
    problems.push(`${assetUrl.pathname}: expected 200 and ${expected.length} bytes, got HTTP ${res.status} and ${got.length} bytes (CF-Cache-Status: ${cache})`);
  } else {
    console.log(`check-assets: ok ${assetUrl.pathname} — ${got.length} bytes, identical to the build (CF-Cache-Status: ${cache})`);
  }
}
if (problems.length) fail(problems);
