// scratch: not committed. Signs in a throwaway admin, screenshots + measures tap targets.
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright-core";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error("not dev");
const base = "http://localhost:3003";
const out = process.argv[2];
const tag = process.argv[3] ?? "after";
mkdirSync(out, { recursive: true });
const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const email = `verify-${randomBytes(4).toString("hex")}@example.invalid`;
const password = randomBytes(18).toString("base64url");
const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "Verify" } });
if (error) throw error;
const uid = data.user.id;
try {
  await service.from("user_roles").insert({ user_id: uid, role: "admin" });
  const jar = new Map();
  const ssr = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (l) => l.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))) },
  });
  const { error: se } = await ssr.auth.signInWithPassword({ email, password });
  if (se) throw se;
  const cookies = [...jar].map(([name, value]) => ({ name, value, url: base }));
  let browser;
  for (const channel of ["msedge", "chrome"]) { try { browser = await chromium.launch({ channel, headless: true }); break; } catch {} }

  const measure = () => {
    const main = document.querySelector("main") ?? document.body;
    const bad = [];
    for (const el of main.querySelectorAll("a[href],button,[role=button]")) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el);
      if (cs.display === "inline") continue; // inline text link in a sentence
      if (r.height < 43.5 || r.width < 43.5) bad.push(`${Math.round(r.width)}x${Math.round(r.height)} ${(el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)}`);
    }
    const root = document.scrollingElement;
    return { overflow: root.scrollWidth - root.clientWidth, small: bad };
  };

  async function pagesFor(page, listPath, hrefRe) {
    await page.goto(base + listPath, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    return page.evaluate((re) => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).find((h) => new RegExp(re).test(h)), hrefRe.source);
  }

  for (const [label, signedIn] of [["in", true], ["out", false]]) {
    for (const locale of ["en", "th"]) {
      for (const [vw, vh, vname] of [[375, 800, "phone"], [1280, 800, "desk"]]) {
        const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: vw < 500, hasTouch: vw < 500 });
        await ctx.addCookies([...(signedIn ? cookies : []), { name: "locale", value: locale, url: base }]);
        const page = await ctx.newPage();
        const targets = signedIn
          ? ["/maintenance", await pagesFor(page, "/maintenance", /^\/maintenance\/[0-9a-f-]{36}$/), "/projects", await pagesFor(page, "/projects", /^\/projects\/[0-9a-f-]{36}$/), "/deliveries", "/contacts", await pagesFor(page, "/contacts", /^\/contacts\/[0-9a-f-]{36}$/), "/vets", await pagesFor(page, "/vets", /^\/vets\/[0-9a-f-]{36}$/), "/enclosures", await pagesFor(page, "/enclosures", /^\/enclosures\/[0-9a-f-]{36}$/), "/stocktake", "/maintenance/new"]
          : ["/login", "/login/forgot", "/login/request", "/adopt", "/our-work"];
        for (const t of targets.filter(Boolean)) {
          await page.goto(base + t, { waitUntil: "domcontentloaded", timeout: 90000 }).catch(() => {});
          await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
          await page.waitForTimeout(400);
          const m = await page.evaluate(measure).catch((e) => ({ err: String(e) }));
          console.log(`${label} ${locale} ${vname} ${t.replace(/[0-9a-f-]{36}/, ":id")} overflow=${m.overflow} small=${JSON.stringify(m.small)}`);
          if (vname === "phone" || locale === "en") await page.screenshot({ path: join(out, `${tag}-${label}-${locale}-${vname}-${t.replace(/[^a-z]+/gi, "_").slice(0, 40)}.png`), fullPage: true }).catch(() => {});
        }
        await ctx.close();
      }
    }
  }
  await browser.close();
} finally {
  await service.auth.admin.deleteUser(uid);
}
