// The home screens (src/lib/home/) against the route registry and the seeded roles. Part of
// `npm run lint`. No database, no env: each default role's cells are read from the migrations
// that seed them, as check-permission-catalogue.mjs does.
//
//   node scripts/check-home-screens.mjs
//
//   A  the device rule: which screens are phones and which are desks, tablets included
//   B  a tile is always one the registry can draw: a registered path, or My tasks / Residents;
//      never a path with a record id in it, never twice, never a page the person is refused
//   C  each default role's home: what leads, what is left out, what is only that role's
//   D  Settings pages stay on Admin's Settings home, but a role holding only those still has a home
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { register } from "node:module";

const root = process.cwd();
const src = pathToFileURL(join(root, "src") + "/").href;
register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(spec, ctx, next) {
        if (spec.startsWith("@/")) return next(${JSON.stringify(src)} + spec.slice(2) + ".ts", ctx);
        if (spec.startsWith(".") && !/\\.[a-z]+$/.test(spec)) return next(spec + ".ts", ctx);
        return next(spec, ctx);
      }`),
);
const imp = (p) => import(pathToFileURL(join(root, p)).href);
const { deviceFrom } = await imp("src/lib/home/device.ts");
const { homeTilesFor } = await imp("src/lib/home/tiles.ts");
const { ROUTES, canOpen } = await imp("src/lib/permissions/routes.ts");
const { ACTIVITIES } = await imp("src/lib/permissions/catalogue.ts");
const { parsePermissions } = await imp("src/lib/permissions/can.ts");
const { loadSeed } = await import(pathToFileURL(join(root, "scripts/lib/permission-seed.mjs")).href);
const t = (await imp("src/lib/i18n/dictionaries/en.ts")).default;
const seed = loadSeed(root);

let fails = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
};

// ---- A ----
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const ANDROID_PHONE = "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
eq("A iPhone is a phone", deviceFrom(IPHONE), "phone");
eq("A Android phone is a phone", deviceFrom(ANDROID_PHONE), "phone");
eq("A Android phone with the hint is a phone", deviceFrom(ANDROID_PHONE, "?1"), "phone");
eq("A iPad (announces itself as a Mac) is a desk", deviceFrom(IPAD), "desk");
eq("A Android tablet (no 'Mobile') is a desk", deviceFrom(ANDROID_TABLET), "desk");
eq("A Windows PC is a desk", deviceFrom(WINDOWS, "?0"), "desk");
eq("A phone asked for the desktop site is a desk", deviceFrom(WINDOWS, "?0"), "desk");
eq("A phone's hint beats a desktop user-agent", deviceFrom(WINDOWS, "?1"), "phone");
eq("A desk hint beats a phone user-agent", deviceFrom(IPHONE, "?0"), "desk");
eq("No headers at all is a desk", deviceFrom(null, null), "desk");

// ---- B, C ----
const forRole = (role, scopes = {}) => {
  const cells = {};
  for (const a of ACTIVITIES) {
    if (seed.rolesHolding(a.key, "edit").includes(role)) cells[a.key] = 2;
    else if (a.kind === "level" && seed.rolesHolding(a.key, "read").includes(role)) cells[a.key] = 1;
  }
  return parsePermissions({
    role: { key: role, name: role, opens_app: true },
    is_admin: false, // a home is built from cells; Admin's are the other roles' homes, never its own
    scopes,
    permissions: cells,
  });
};
const roles = {
  management: forRole("management"),
  staff: forRole("staff"),
  volunteer: forRole("volunteer"),
  vet: forRole("vet", { clinical: "own_clinic", residents: "own_clinic" }),
};
const registered = new Set(ROUTES.map((r) => r.path));
for (const [role, perms] of Object.entries(roles)) {
  const tiles = homeTilesFor(perms, t);
  const hrefs = tiles.map((x) => x.href);
  eq(`B ${role}: no tile twice, none without a word`, [new Set(hrefs).size === hrefs.length, tiles.every((x) => x.label)], [true, true]);
  eq(`B ${role}: every tile is a registered page, My tasks or Residents`, hrefs.filter((h) => !registered.has(h) && h !== "/my" && h !== "/residents" && h !== "/residents/new"), []);
  eq(`B ${role}: no tile has a record id in it`, hrefs.filter((h) => h.includes("[")), []);
  eq(`B ${role}: every registered tile opens for the role`, hrefs.filter((h) => registered.has(h) && !canOpen(perms, ROUTES.find((r) => r.path === h))), []);
  eq(`B ${role}: the labels are one word each (no two tiles read alike)`, new Set(tiles.map((x) => x.label)).size, tiles.length);
  eq(`C ${role}: Residents is on the home`, hrefs.includes("/residents"), true);
  eq(`C ${role}: no Settings page (a role's home is its tasks)`, hrefs.filter((h) => h.startsWith("/admin/")), []);
}
eq("C Management's phone home is the whiteboard's: recurring jobs, intake, residents, then my tasks", homeTilesFor(roles.management, t).map((x) => x.href).filter((h) => h !== "/my"), ["/management/recurring-jobs", "/residents/new", "/residents"]);
// R5 (management-role): Management is the template role, not a configured one, and her screen is keyed on
// that key. The property the screen was built for is that a role edited in Settings loses a tile rather than
// getting one that refuses, so each cell is taken away in turn.
const mgmtWithout = (...gone) => {
  const cells = {};
  for (const a of ACTIVITIES) {
    if (gone.includes(a.key)) continue;
    if (seed.rolesHolding(a.key, "edit").includes("management")) cells[a.key] = 2;
    else if (a.kind === "level" && seed.rolesHolding(a.key, "read").includes("management")) cells[a.key] = 1;
  }
  return parsePermissions({ role: { key: "management", name: "Management", opens_app: true }, is_admin: false, scopes: {}, permissions: cells });
};
const hrefsOf = (p) => homeTilesFor(p, t).map((x) => x.href);
eq("C Management without recurring.manage loses Recurring jobs only", hrefsOf(mgmtWithout("recurring.manage")), ["/residents/new", "/residents", "/my"]);
eq("C Management without resident.register loses Intake only", hrefsOf(mgmtWithout("resident.register")), ["/management/recurring-jobs", "/residents", "/my"]);
eq("C Management without recurring.do_own loses My tasks only", hrefsOf(mgmtWithout("recurring.do_own")), ["/management/recurring-jobs", "/residents/new", "/residents"]);
eq("C Management with all three taken away still has Residents", hrefsOf(mgmtWithout("recurring.manage", "resident.register", "recurring.do_own")), ["/residents"]);
eq("C staff leads with My tasks, Residents, then the whiteboard order of what staff hold", homeTilesFor(roles.staff, t).slice(0, 5).map((x) => x.href), ["/my", "/residents", "/stocktake", "/maintenance", "/deliveries"]);
eq("C a vet's home is its appointments, and staff are not offered them", [
  homeTilesFor(roles.vet, t).some((x) => x.href === "/appointments"),
  homeTilesFor(roles.staff, t).some((x) => x.href === "/appointments"),
  homeTilesFor(roles.management, t).some((x) => x.href === "/appointments"),
], [true, false, false]);
eq("C a vet has no tasks tile", homeTilesFor(roles.vet, t).some((x) => x.href === "/my"), false);
// No seeded role reads Contacts without editing it since 0134 took the address book from the volunteer, so the
// read-only case is a role built for the purpose: one cell, contacts.directory at Read.
const contactsReader = parsePermissions({
  role: { key: "reader", name: "reader", opens_app: true },
  is_admin: false,
  scopes: {},
  permissions: { "contacts.directory": 1 },
});
const contactsEditor = parsePermissions({
  role: { key: "editor", name: "editor", opens_app: true },
  is_admin: false,
  scopes: {},
  permissions: { "contacts.directory": 2 },
});
eq("C Contacts is one tile, and opens the manager for the role that may use it", [
  homeTilesFor(contactsEditor, t).filter((x) => x.label === t.nav.contacts).map((x) => x.href),
  homeTilesFor(contactsReader, t).filter((x) => x.label === t.nav.contacts).map((x) => x.href),
], [["/management/contacts"], ["/contacts"]]);
// R1 (volunteer-read-only): a tile that survives its page is the clearest sign the app is out of step with
// the cells. The volunteer holds three cells and its home is exactly the two pages they open.
eq("C a volunteer's home is Residents and Enclosures, and nothing else", homeTilesFor(roles.volunteer, t).map((x) => x.href), ["/residents", "/enclosures"]);

eq("C Enclosures is the menu's page", [
  homeTilesFor(roles.volunteer, t).filter((x) => x.label === t.nav.enclosures).map((x) => x.href),
  homeTilesFor(roles.staff, t).filter((x) => x.label === t.nav.enclosures).map((x) => x.href),
], [["/enclosures"], ["/enclosures"]]);

// ---- D ----
const settingsOnly = parsePermissions({
  role: { key: "x", name: "X", opens_app: true },
  is_admin: false,
  scopes: {},
  permissions: { "reference.types": 2 },
});
eq("D a role holding only a Settings activity still has a home", homeTilesFor(settingsOnly, t).some((x) => x.href.startsWith("/admin/")), true);
eq("D a role holding nothing has only Residents", homeTilesFor(parsePermissions({ role: { key: "x", name: "X", opens_app: true }, scopes: {}, permissions: {} }), t).map((x) => x.href), ["/residents"]);
eq("D a role that does not open the app has no tiles", homeTilesFor(parsePermissions({ role: { key: "x", name: "X", opens_app: false }, scopes: {}, permissions: {} }), t).length, 0);

console.log(fails ? `\n${fails} FAILED` : "\nall ok");
process.exitCode = fails ? 1 : 0;
