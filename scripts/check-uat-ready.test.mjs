import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDotEnv, uatReadiness, UAT_PROJECT_REF } from "./lib/uat-ready.mjs";
import { PI_REQUIRED } from "./lib/runtime-config.mjs";
import { generateActionsKey } from "./lib/actions-key.mjs";

const good = () => {
  const u = Object.fromEntries(PI_REQUIRED.map((n) => [n, `uat-${n}`]));
  Object.assign(u, {
    NEXT_PUBLIC_SUPABASE_URL: `https://${UAT_PROJECT_REF}.supabase.co`,
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: generateActionsKey(),
    SUPABASE_ACCESS_TOKEN: "tok-secret-uat",
    ORIGIN_KEY: "origin-same",
    GOOGLE_DRIVE_ROOT_FOLDER_ID: "root-uat",
  });
  return u;
};
const run = (uat, extra = {}) =>
  uatReadiness({
    uat,
    production: { ORIGIN_KEY: "origin-same", GOOGLE_DRIVE_ROOT_FOLDER_ID: "root-prod" },
    local: { GOOGLE_DRIVE_ROOT_FOLDER_ID: "root-test" },
    shell: {},
    ...extra,
  });
const fails = (r) => r.filter((f) => f.level === "fail").map((f) => f.text);

test("a correct file has no failures", () => assert.deepEqual(fails(run(good())), []));

test("names every missing required key, including the three Google OAuth ones", () => {
  const u = good();
  const oauth = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"];
  for (const n of oauth) delete u[n];
  const f = fails(run(u)).join("\n");
  for (const n of oauth) assert.match(f, new RegExp(n));
});

test("fails when the Supabase URL is dev or production", () => {
  const u = good();
  u.NEXT_PUBLIC_SUPABASE_URL = "https://qxkmhwybjggxvsfxsxbd.supabase.co";
  assert.match(fails(run(u)).join("\n"), /does not name fsjagxmxjosauwmxwype/);
});

test("fails when the Drive root equals production's or Test's", () => {
  const u = good();
  u.GOOGLE_DRIVE_ROOT_FOLDER_ID = "root-prod";
  assert.match(fails(run(u)).join("\n"), /production's file/);
  u.GOOGLE_DRIVE_ROOT_FOLDER_ID = "root-test";
  assert.match(fails(run(u)).join("\n"), /\.env\.local/);
});

test("fails on either calendar key, even empty", () => {
  for (const n of ["GOOGLE_CALENDAR_ID", "GOOGLE_CALENDAR_REFRESH_TOKEN"]) {
    const u = good();
    u[n] = "";
    assert.match(fails(run(u)).join("\n"), new RegExp(n));
  }
});

test("ORIGIN_KEY: mismatch fails, missing fails", () => {
  const u = good();
  u.ORIGIN_KEY = "different";
  assert.match(fails(run(u)).join("\n"), /differs from production/);
  delete u.ORIGIN_KEY;
  assert.match(fails(run(u)).join("\n"), /ORIGIN_KEY is not set/);
});

test("the Supabase token: missing here fails, exported in the shell warns", () => {
  const u = good();
  const r = run(u, { shell: { SUPABASE_ACCESS_TOKEN: "x" } });
  assert.ok(r.some((f) => f.level === "warn" && /env -u SUPABASE_ACCESS_TOKEN/.test(f.text)));
  delete u.SUPABASE_ACCESS_TOKEN;
  assert.match(fails(run(u)).join("\n"), /SUPABASE_ACCESS_TOKEN is absent/);
});

test("no output ever contains a secret value", () => {
  const u = good();
  u.ORIGIN_KEY = "origin-different-SECRET";
  u.GOOGLE_DRIVE_ROOT_FOLDER_ID = "root-prod";
  u.GOOGLE_CALENDAR_ID = "cal-SECRET";
  const text = JSON.stringify(run(u, { shell: { SUPABASE_ACCESS_TOKEN: "shell-SECRET" } }));
  for (const v of ["SECRET", "tok-secret-uat", "origin-same", "root-prod", "root-uat", u.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY]) {
    assert.ok(!text.includes(v), `leaked ${v}`);
  }
});

test("parseDotEnv handles quotes, comments and blank text", () => {
  assert.deepEqual(parseDotEnv('# c\nA="x"\nB=y\n'), { A: "x", B: "y" });
  assert.deepEqual(parseDotEnv(undefined), {});
});
