// A signed-in headless Chrome for a driven browser proof (docs/decisions/2026-11-21-driving-a-browser-proof.md).
//
//   import { signedInPage } from "./lib/driven-session.mjs";
//   const { browser, page } = await signedInPage({ args: ["management", "--port", "3002"], base: "http://localhost:3002" });
//   await page.goto("http://localhost:3002/my");   // ...click, fill, press Save, read it back...
//   await browser.close();
//
// `args` are handed to scripts/dev-signin.mjs unchanged (a role, or --cards a,b; --aal2; --shelter X; always --port N).
// The session cookies it prints are read straight from its output and loaded into the browser, so NOTHING IS RETYPED:
// pasting that snippet into the in-app pane means a model copies ~2.7 KB of base64 by hand, which drops characters and
// shows up as /login?error=expired. This does not touch dev-signin.mjs. Dev only; no dependency beyond playwright-core.
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { chromium } from "playwright-core";

export function sessionCookies(snippet, base) {
  const out = [...snippet.matchAll(/document\.cookie="([^=]+)=([^;"]*);/g)].map(([, name, value]) => ({ name, value, url: base }));
  if (!out.length) throw new Error("dev-signin printed no cookies; run it by hand and read its message");
  return out;
}

export async function signedInPage({ args, base, viewport = { width: 1024, height: 768 } }) {
  const snippet = execFileSync(process.execPath, [join(process.cwd(), "scripts/dev-signin.mjs"), ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  let browser;
  for (const channel of ["chrome", "msedge"]) {
    try {
      browser = await chromium.launch({ channel, headless: true });
      break;
    } catch {}
  }
  if (!browser) throw new Error("neither Chrome nor Edge could be started by playwright-core");
  const context = await browser.newContext({ viewport });
  await context.addCookies([...sessionCookies(snippet, base), { name: "locale", value: "en", url: base }]);
  return { browser, context, page: await context.newPage() };
}
