// The per-person colour theme (src/lib/theme/themes.ts), against DEV and a
// running dev server:
//
//   node scripts/worktree.mjs dev                  (in another terminal)
//   node scripts/check-user-theme.mjs [http://localhost:<port>]
//
// Makes a throwaway Management login, signs it in the way the app's own SSR
// client does, and fetches real pages as it. Checks what the server renders,
// which is the whole of the no-flash promise: the theme is in the <html> tag
// of the first response, read from the person's own user_metadata, so a
// second device — or this one with its storage cleared — gets it with no
// browser cache involved. Also checks that the dev marker no theme can touch
// (the header's strip and fixed-colour badge) is there under every theme,
// that an unknown stored value falls back to the default, that saving a
// theme leaves the person's name alone, and the globals.css rule order the
// whole scheme depends on.
//
// The login is deleted at the end, whatever happened. Exits 0 when every
// expectation held.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const base = process.argv[2] ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

// The rule order in globals.css: themes after dev's teal (so a theme wins
// over it, which is why the strip exists), before the public-site mapping
// (so the public pages keep their own look whatever the visitor's theme).
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
const devAt = css.indexOf(':root[data-env="dev"] {');
const themeAts = [...css.matchAll(/:root\[data-theme="[a-z-]+"\] \{/g)].map((m) => m.index);
const publicAt = css.indexOf(":root:has([data-public-site]) {");
expect(themeAts.length >= 3, `globals.css defines ${themeAts.length} theme blocks`);
expect(themeAts.every((i) => i > devAt), "every theme block comes after the dev block");
expect(themeAts.every((i) => i < publicAt), "every theme block comes before the public-site mapping");

const tag = randomBytes(4).toString("hex");
const email = `harness-theme-${tag}@example.invalid`;
const password = randomBytes(18).toString("base64url");
const name = `Harness Theme ${tag}`;

/** A signed-in client and the cookie header the browser would send, for one "device". */
async function signIn() {
  const jar = new Map();
  const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([n, value]) => ({ name: n, value })),
      setAll: (list) => list.forEach(({ name: n, value }) => (value ? jar.set(n, value) : jar.delete(n))),
    },
  });
  const { error } = await ssr.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { ssr, cookie: () => [...jar].map(([n, v]) => `${n}=${v}`).join("; ") };
}

async function page(path, cookie = "") {
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, html: await res.text() };
}

/** The data-theme on the <html> tag, or null when it has none. */
const themeOf = (html) => {
  const tagHtml = html.match(/<html\b[^>]*>/)?.[0] ?? "";
  return tagHtml.match(/\bdata-theme="([^"]*)"/)?.[1] ?? null;
};
const hasStrip = (html) => html.includes('data-env-strip="dev"');
const hasFixedBadge = (html) => html.includes("bg-[#2dd4bf]");

let userId = null;
try {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw error;
  userId = data.user.id;
  const { error: roleErr } = await service.from("user_roles").insert({ user_id: userId, role: "management" });
  if (roleErr) throw roleErr;

  const phone = await signIn();

  let r = await page("/residents", phone.cookie());
  expect(r.status === 200, `/residents renders for the login (${r.status})`);
  expect(themeOf(r.html) === null, `no theme saved: no data-theme (got ${themeOf(r.html)})`);
  expect(/<html\b[^>]*data-env="dev"/.test(r.html), "dev: <html data-env=\"dev\"> still set");
  expect(hasStrip(r.html), "dev: the header carries the striped env strip");
  expect(hasFixedBadge(r.html), "dev: the badge uses its fixed teal, not bg-primary");

  for (const theme of ["light", "contrast", "magenta"]) {
    // What setOwnTheme does: the person's own session writes their own metadata.
    const { error: upErr } = await phone.ssr.auth.updateUser({ data: { theme } });
    if (upErr) throw upErr;
    r = await page("/residents", phone.cookie());
    expect(themeOf(r.html) === theme, `${theme}: first response is <html data-theme="${theme}"> (got ${themeOf(r.html)})`);
    expect(hasStrip(r.html) && hasFixedBadge(r.html), `${theme}: dev strip and fixed badge still there`);
  }

  // A second device: a fresh sign-in with an empty cookie jar and no storage.
  const laptop = await signIn();
  r = await page("/residents", laptop.cookie());
  expect(themeOf(r.html) === "magenta", `second device gets the saved theme on its first page (got ${themeOf(r.html)})`);

  const { data: after } = await service.auth.admin.getUserById(userId);
  expect(after.user.user_metadata.full_name === name, "saving a theme left the person's name alone");

  // The public home page, signed in with a theme: the attribute is there, and
  // so is the public header that makes globals.css map back to the site look.
  r = await page("/", laptop.cookie());
  expect(r.status === 200 && r.html.includes("data-public-site"), "/ still renders the public site (data-public-site present)");

  // Unknown and cleared values fall back to the default.
  await laptop.ssr.auth.updateUser({ data: { theme: "neon" } });
  r = await page("/residents", laptop.cookie());
  expect(themeOf(r.html) === null, `unknown stored value: default, no attribute (got ${themeOf(r.html)})`);
  await laptop.ssr.auth.updateUser({ data: { theme: null } });
  r = await page("/residents", laptop.cookie());
  expect(themeOf(r.html) === null, "cleared: default, no attribute");

  r = await page("/login");
  expect(themeOf(r.html) === null, "signed out (/login): always the default");
} finally {
  if (userId) {
    const { error } = await service.auth.admin.deleteUser(userId);
    console.log(error ? `  could not delete ${userId}: ${error.message}` : "  deleted the throwaway login");
  }
}

console.log(failures.length ? `\n${failures.length} expectation(s) failed.` : "\nEvery expectation held.");
process.exit(failures.length ? 1 : 0);
