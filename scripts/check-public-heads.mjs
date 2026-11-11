// #t48xh slice D: read the RENDERED <head> of every page /sitemap.xml lists, in both shapes
// (bare and /th/), and assert: one canonical equal to that shape's own address, hreflang en/th/x-default,
// og:url equal to the canonical, og:locale:alternate the other language. Also re-proves the hard
// constraint: a bare address with Accept-Language th and no cookie renders Thai (og:locale th_TH), and an
// explicit ?-less English request with no header renders en_GB. The page list IS the sitemap, so the two
// cannot disagree. Needs a dev server: node scripts/check-public-heads.mjs [port] [extra bare paths...].
import fs from "node:fs";
const port = process.argv[2] ?? (fs.existsSync(".port") ? fs.readFileSync(".port", "utf8").trim() : "3000");
const base = `http://localhost:${port}`;
const get = async (p, headers = {}) => (await fetch(base + p, { headers, redirect: "manual" })).text();
const tag = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
const sm = await get("/sitemap.xml");
const locs = tag(sm, /<loc>([^<]+)<\/loc>/g).map((u) => new URL(u).pathname);
const bare = [...locs.filter((p) => p !== "/th" && !p.startsWith("/th/")), ...process.argv.slice(3)]; // extra bare paths, e.g. a real /adopt/<id>, when the sitemap has none
let bad = 0;
const fail = (m) => { bad++; console.log("FAIL", m); };
if (!bare.length) fail("sitemap lists no pages (is the public site open on this host?)");
for (const p of bare) {
  const th = p === "/" ? "/th" : `/th${p}`;
  if (!locs.includes(th)) fail(`sitemap lists ${p} but not ${th}`);
  for (const [shape, path, lang, other] of [["bare", p, "en_GB", "th_TH"], ["th", th, "th_TH", "en_GB"]]) {
    const html = await get(path);
    const canon = tag(html, /<link rel="canonical" href="([^"]+)"/g).map((u) => new URL(u).pathname);
    const alts = Object.fromEntries([...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], new URL(m[2]).pathname]));
    const ogu = tag(html, /<meta property="og:url" content="([^"]+)"/g).map((u) => new URL(u).pathname);
    const ogl = tag(html, /<meta property="og:locale" content="([^"]+)"/g);
    const oga = tag(html, /<meta property="og:locale:alternate" content="([^"]+)"/g);
    const w = `${shape} ${path}`;
    if (canon.length !== 1 || canon[0] !== path) fail(`${w}: canonical ${JSON.stringify(canon)}`);
    if (alts.en !== p || alts.th !== th || alts["x-default"] !== p || Object.keys(alts).length !== 3) fail(`${w}: hreflang ${JSON.stringify(alts)}`);
    if (ogu.length !== 1 || ogu[0] !== path) fail(`${w}: og:url ${JSON.stringify(ogu)}`);
    if (ogl[0] !== lang || oga.length !== 1 || oga[0] !== other) fail(`${w}: og:locale ${ogl} alternate ${oga}`);
  }
  // Hard constraint: bare + Thai Accept-Language + no cookie renders Thai; plain bare stays English.
  const thHtml = await get(p, { "accept-language": "th-TH,th;q=0.9,en;q=0.8" });
  if (!/property="og:locale" content="th_TH"/.test(thHtml)) fail(`bare ${p} with Accept-Language th did not render Thai`);
  // The toggle overrides it: the cookie wins over the header.
  const enHtml = await get(p, { "accept-language": "th-TH,th;q=0.9", cookie: "locale=en" });
  if (!/property="og:locale" content="en_GB"/.test(enHtml)) fail(`bare ${p}: locale=en cookie did not override Accept-Language th`);
}
console.log(`${bare.length} pages x 2 shapes checked, ${bad} failure(s)`);
process.exit(bad ? 1 : 0);
