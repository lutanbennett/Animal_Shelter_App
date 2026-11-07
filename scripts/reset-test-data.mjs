#!/usr/bin/env node
// Reset the TEST system back to a bare shelter: keep the setup, clear the content.
//
// Lutan, 2026-11-07: "Can we clear the test system please, it is so full of test data it is
// hard to actually test", then "Please also delete files / photos as well", then "Core system
// file scan stay like admin etc but photos, videos, medical records can go".
//
//   node scripts/reset-test-data.mjs                  # dry run — prints every table it would clear
//   node scripts/reset-test-data.mjs --apply          # commits
//   node scripts/reset-test-data.mjs --no-drive       # database only
//   node scripts/reset-test-data.mjs --no-db          # Drive only
//
// WHAT STAYS (the core system):
//   * the card system — roles, role_cards, role_permissions, cards' features, grants and includes
//   * the real logins: anything NOT @example.test / @example.invalid, so Lutan's admin still works
//   * the physical setup — zones, enclosures, premises, facility maps and their 12 storage objects
//   * the reference lists — medication, diets, blood test / immunization / procedure types, bill
//     kinds, units, frequencies, clinics and doctors
//   * translations and the translatable-string catalogue, the website's pages and text
//   * the config singletons (calendar sync, receipt counters, impact baselines, alert checks)
//   * schema_migrations — clearing it would make the runner re-apply every migration
//
// WHAT GOES (the content):
//   * every resident and everything hanging off one — placements, diets, weights, clinic visits,
//     prescriptions, blood tests, immunizations, procedures: the medical records
//   * every photo and video: attachments, appeal/maintenance/project/community/event photos,
//     pending photos, video uploads, memes, reels, social shares
//   * the files behind them in Google Drive (trashed, see below)
//   * donations, receipts, bills, stock counts, deliveries, maintenance, recurring jobs, appeals,
//     adoption updates, contacts, shelter friends, supporters, assistant actions, write requests
//   * the logs: audit_log (11,126 rows) and status_alert_runs (3,528)
//   * the 80 disposable "Dev sign-in" roles and the ~210 throwaway logins that go with them
//   * the test-marked rows inside the reference lists that otherwise stay (ZZ Width …, Dryrun …,
//     walk-…, [mydash] …), listed one by one in CURATED_DELETES rather than matched by pattern,
//     so nothing real can be caught by a loose regex
//
// THREE GUARDS, because this deletes:
//   1. --env test only, and the project ref must be the dev project. UAT and production are
//      refused outright: there is no flag that points this at either.
//   2. The Drive root must be the Test bucket. Production's and UAT's bucket ids are hard-coded
//      here purely to be refused — until 2026-11-07 all three environments shared ONE Drive
//      folder and 220 files were named by both the production and the dev database, so a tester
//      deleting a photo deleted the shelter's (docs/decisions/2026-11-07-drive-buckets.md).
//      That is the fault this guard exists for; the buckets were split the same day.
//   3. Before touching anything it checks that no table it KEEPS has a foreign key pointing at a
//      table it CLEARS. If one did, `truncate … cascade` would quietly empty a keeper. It refuses
//      and names the key rather than guessing.
//
// Drive files are TRASHED, not erased — `files.update {trashed: true}`, exactly what the app
// itself does when someone deletes a photo (src/lib/google/drive.ts), and what every app lookup
// filters out with `trashed = false`. So the app sees them gone and Lutan can still restore them
// from Drive's bin for 30 days. Emptying the bin is his, in Drive.
//
// The whole database half runs in ONE transaction, so the dry run's "after" counts are the ones
// an --apply would really produce. Re-runnable: a second run finds nothing to do.
import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const APPLY = args.includes("--apply");
const DO_DB = !args.includes("--no-db");
const DO_DRIVE = !args.includes("--no-drive");

const DEV_REF = "qxkmhwybjggxvsfxsxbd";
const TEST_BUCKET = "1gEAHO9t1E4VqsXXLcHmpUdWBGF0pXADU";
const PROD_BUCKET = "170MwT_wbLbdt0p5Z2BLKGnYB0AigsZ21";
const UAT_BUCKET = "16DhllkzpM0dqCn0Yy0cErQ7XgvhJpW9J";

const fail = (m) => {
  console.error(`refusing: ${m}`);
  process.exit(2);
};

if (envName !== "test") fail(`--env ${envName} — this script is for the test system only.`);
const env = loadEnv(envName);
const ref = refOf(env);
if (ref !== DEV_REF) fail(`project ${ref} is not the dev project (${DEV_REF}).`);
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) fail("SUPABASE_ACCESS_TOKEN is not set.");

// Tables whose rows are the system itself, not the shelter's content.
const KEEP = new Set([
  "schema_migrations",
  // the card system. user_roles STAYS: it is what gives Lutan's login its Admin role, and
  // clearing it would leave every kept login with no role and no way back into Settings. Its
  // rows for throwaway logins and disposable roles are deleted by name instead (below).
  "roles", "role_groups", "role_cards", "role_permissions", "user_roles",
  "card_features", "card_grants", "card_includes", "features", "permission_activities",
  // physical setup
  "zones", "enclosures", "premises", "facility_maps", "map_rooms", "map_room_placements",
  // reference lists
  "medication", "diet_types", "diet_ingredients", "diets", "blood_test_types",
  "immunization_types", "procedure_types", "bill_kinds", "frequency", "units",
  "item_unit_conversions", "donation_channels", "group_origins", "rounds",
  "clinics", "doctors", "doctor_clinics",
  // translations
  "translatable_fields", "translatable_labels", "translations", "label_sources",
  // website structure. site_content, its photos and shop_links are content and GO: site_content
  // names a featured resident and shop_links a shelter friend, both of which are being cleared,
  // so keeping those rows would leave the public site pointing at records that no longer exist.
  "site_pages", "public_stat_switches",
  // config singletons. impact_baselines is NOT here: its three rows were set by a dry-run login
  // (dryrun-admin-baseline-20261007@example.test), so they are test figures themselves, and its
  // stamp trigger deliberately RESTORES set_by on any update that does not change a baseline
  // figure — so the reference to that login cannot be nulled, and keeping the table would mean
  // either keeping the throwaway login or switching off a second trigger. It goes with the content.
  "calendar_sync_state", "receipt_counters", "fixed_outgoings",
  "bill_accounts", "status_alert_checks",
]);

// Test-marked rows inside tables that otherwise stay. Named in full on purpose.
const CURATED_DELETES = [
  ["enclosures", ["Dryrun Pen 1018", "Front Zone 0 order test"], "ZZ Width %"],
  ["medication", ["Dryrun Med 1018"], null],
  ["diet_types", ["Pouch test food", "test lentils 1103"], null],
  ["clinics", ["[roster] Test Clinic", "Dryrun Mobile Vet 1018", "walk-contacts clinic"], "ZZ Width %"],
  ["doctors", [
    "Dr Booked New", "Dr Date Test", "Dr Dry Run 20261009", "Dr Dryrun",
    "Dr Dryrun Added 1009", "Dr Dryrun Typed 1009", "Dr Walk Two", "Scope test vet",
  ], "ZZ %"],
];

const q = (sql, readOnly) =>
  fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql, read_only: readOnly }),
  }).then(async (r) => {
    const t = await r.text();
    if (!r.ok) throw new Error(`${r.status}: ${t}`);
    return JSON.parse(t);
  });

const lit = (s) => `'${s.replace(/'/g, "''")}'`;

console.log(`Test system — Supabase project ${ref}`);
console.log(APPLY ? "Mode: APPLY — this commits.\n" : "Mode: dry run — everything rolls back.\n");

let clearList = [];

if (DO_DB) {
  const tables = (
    await q(
      `select table_name as t from information_schema.tables
       where table_schema='public' and table_type='BASE TABLE' order by table_name`,
      true,
    )
  ).map((r) => r.t);

  clearList = tables.filter((t) => !KEEP.has(t));
  const unknownKeeps = [...KEEP].filter((k) => !tables.includes(k));
  if (unknownKeeps.length) {
    console.log(`note: these KEEP names are not tables here (renamed or gone): ${unknownKeeps.join(", ")}\n`);
  }

  // GUARD 3 — a keeper must not point at anything being cleared, or cascade would empty it.
  // Read the real catalogue, not information_schema: its views only show constraints whose
  // tables the caller owns, which silently hid impact_baselines.set_by -> auth.users on the
  // first run and let the delete fail instead of being prevented.
  const FK_ROWS = `
    select src.relname as keeper, att.attname as col, tgt.relname as target,
           tgtns.nspname as target_schema, att.attnotnull as notnull
    from pg_constraint k
    join pg_class src on src.oid = k.conrelid
    join pg_namespace srcns on srcns.oid = src.relnamespace
    join pg_class tgt on tgt.oid = k.confrelid
    join pg_namespace tgtns on tgtns.oid = tgt.relnamespace
    join unnest(k.conkey) as c(attnum) on true
    join pg_attribute att on att.attrelid = src.oid and att.attnum = c.attnum
    where k.contype = 'f' and srcns.nspname = 'public'`;

  const risky = await q(
    `${FK_ROWS} and tgtns.nspname = 'public'
       and src.relname in (${[...KEEP].map(lit).join(",")})
       and tgt.relname not in (${[...KEEP].map(lit).join(",")})`,
    true,
  );
  if (risky.length) {
    for (const r of risky) console.error(`  ${r.keeper}.${r.col} -> ${r.target}`);
    fail("a table that STAYS references a table that is CLEARED; truncate cascade would empty it.");
  }

  // Throwaway logins: every @example.test / @example.invalid account. Everything else stays,
  // which is what keeps Lutan's admin and the shelter's real logins able to sign in.
  const DOOMED = `email like '%@example.test' or email like '%@example.invalid'`;
  const users = await q(
    `select count(*) filter (where ${DOOMED})::int as doomed,
            count(*) filter (where not (${DOOMED}))::int as kept from auth.users`,
    true,
  );
  const keptEmails = (
    await q(`select email from auth.users where not (${DOOMED}) order by email`, true)
  ).map((r) => r.email);

  // A kept row may record a doomed login in a created_by-style column; null those first so the
  // delete cannot be blocked by a foreign key (and so a kept row never names a deleted account).
  const userRefs = (
    await q(
      `${FK_ROWS} and tgtns.nspname = 'auth' and tgt.relname = 'users'
         and src.relname in (${[...KEEP].map(lit).join(",")})`,
      true,
    )
  )
    .map((r) => ({ t: r.keeper, c: r.col, notnull: r.notnull }))
    // user_roles.user_id is NOT NULL and cannot be nulled; those rows are deleted outright by
    // the statement below instead, which is why it is excluded here rather than refused.
    .filter((r) => `${r.t}.${r.c}` !== "user_roles.user_id");
  const blocked = userRefs.filter((r) => r.notnull);
  if (blocked.length) {
    for (const r of blocked) console.error(`  ${r.t}.${r.c} is NOT NULL and points at auth.users`);
    fail("a kept table records a login in a NOT NULL column; deleting throwaway logins would fail.");
  }
  if (userRefs.length) {
    console.log("Kept rows that record a throwaway login (the reference is cleared, the row stays):");
    for (const r of userRefs) console.log(`  ${r.t}.${r.c}`);
    console.log("");
  }

  // PRE-FLIGHT. Nulling a login reference can silently do nothing: impact_baselines' stamp
  // trigger restores set_by on any update that changes no baseline figure, so the null-out ran,
  // changed nothing, and the delete then failed with a bare foreign-key error naming a
  // constraint. Rehearse the null-outs in a rolled-back transaction and name any column that
  // still points at a throwaway login, rather than letting the real run fail that way.
  if (userRefs.length) {
    const probe = await q(
      [
        "begin;",
        ...userRefs.map(
          (r) => `update public.${r.t} set ${r.c} = null where ${r.c} in (select id from auth.users where ${DOOMED});`,
        ),
        "select " +
          userRefs
            .map(
              (r) =>
                `(select count(*) from public.${r.t} where ${r.c} in (select id from auth.users where ${DOOMED}))::int as "${r.t}.${r.c}"`,
            )
            .join(", ") +
          ";",
        "rollback;",
      ].join("\n"),
      false,
    );
    const row = Array.isArray(probe) ? probe[probe.length - 1] : probe;
    const stuck = Object.entries(row ?? {}).filter(([, n]) => n > 0);
    if (stuck.length) {
      for (const [col, n] of stuck) console.error(`  ${col} still names a throwaway login in ${n} row(s)`);
      fail("a kept row cannot stop naming a throwaway login (a trigger restores it). Clear that table too, or keep that login.");
    }
  }

  const before = await q(
    `select 'x' as k, ` +
      tables.map((t) => `(select count(*) from public.${t})::int as ${t}`).join(", "),
    true,
  );

  // audit_log is append-only BY TRIGGER and refuses TRUNCATE (0121). That guard exists to stop
  // the app and its users rewriting history, and it is the only truncate guard in the schema
  // (checked against the live catalogue, not just the migrations). An administrator resetting the
  // TEST environment is a different act from the app editing its own log, so the trigger is
  // switched off for exactly one statement and switched back on inside the SAME transaction — a
  // dry run therefore leaves it on too, and the script asserts it is on again at the end. It is
  // named here rather than hidden in the list so nobody has to discover it from an error.
  const auditTables = clearList.filter((t) => t === "audit_log");
  const plainTables = clearList.filter((t) => t !== "audit_log");

  const work = [
    "begin;",
    // the content, in one statement so dependency order does not matter
    // Deliberately NOT `cascade`. Every table that references one of these is itself in the
    // list, so a plain truncate succeeds — and if one were missing, Postgres names it and the
    // whole thing rolls back, where cascade would have quietly emptied it instead.
    `truncate table ${plainTables.map((t) => `public.${t}`).join(", ")};`,
    // test-marked rows inside the reference lists that stay
    ...CURATED_DELETES.map(([t, names, like]) => {
      const col = t === "maintenance" || t === "appeals" ? "title" : "name";
      const parts = [];
      if (names.length) parts.push(`${col} in (${names.map(lit).join(", ")})`);
      if (like) parts.push(`${col} like ${lit(like)}`);
      return `delete from public.${t} where ${parts.join(" or ")};`;
    }),
    // Role assignments belonging to a throwaway login or a disposable role. The kept logins'
    // assignments are untouched, so Lutan's Admin survives.
    `delete from public.user_roles where user_id in (select id from auth.users where ${DOOMED})
       or role_id in (select id from public.roles where key like 'dev_signin_cards_%' or key like 'dryrun_%');`,
    // the disposable roles the dev sign-in script invents, and the dry-run leftovers
    `delete from public.roles where key like 'dev_signin_cards_%' or key like 'dryrun_%';`,
    // then the throwaway logins
    ...userRefs.map((r) => `update public.${r.t} set ${r.c} = null where ${r.c} in (select id from auth.users where ${DOOMED});`),
    `delete from auth.users where ${DOOMED};`,
    // audit_log LAST: every delete above is itself audited, so emptying it any earlier just
    // refills it with a record of this reset (662 rows, on the first dry run).
    ...auditTables.flatMap((t) => [
      `alter table public.${t} disable trigger audit_log_no_truncate;`,
      `truncate table public.${t};`,
      `alter table public.${t} enable trigger audit_log_no_truncate;`,
    ]),
    `select 'x' as k, ` + tables.map((t) => `(select count(*) from public.${t})::int as ${t}`).join(", ") + ";",
    APPLY ? "commit;" : "rollback;",
  ].join("\n");

  if (args.includes("--print-sql")) console.log(`\n--- SQL ---\n${work}\n--- end ---\n`);
  const after = await q(work, false);
  const b = before[0];
  const a = Array.isArray(after) ? after[after.length - 1] ?? after[0] : after;

  console.log("CLEARED — every row goes:");
  let totalCleared = 0;
  for (const t of clearList) {
    if (!b[t]) continue;
    totalCleared += b[t];
    console.log(`  ${String(b[t]).padStart(6)} -> ${String(a[t]).padStart(5)}  ${t}`);
  }
  console.log("\nKEPT — rows that stay (only test-marked rows removed):");
  for (const t of tables) {
    if (!KEEP.has(t)) continue;
    const mark = b[t] !== a[t] ? "  <- test rows removed" : "";
    console.log(`  ${String(b[t]).padStart(6)} -> ${String(a[t]).padStart(5)}  ${t}${mark}`);
  }
  console.log(`\nLogins: ${users[0].doomed} throwaway deleted, ${users[0].kept} kept:`);
  for (const e of keptEmails) console.log(`  ${e}`);
  console.log(`\n${totalCleared} content rows cleared in total.`);

  // The append-only guard must be back on, whether this was a dry run or an apply.
  const guard = await q(
    `select t.tgenabled::text as state from pg_trigger t join pg_class c on c.oid = t.tgrelid
     where c.relname = 'audit_log' and t.tgname = 'audit_log_no_truncate'`,
    true,
  );
  const state = guard[0]?.state;
  if (state !== "O") fail(`audit_log's append-only trigger is '${state}', not enabled. Restore it before using this database.`);
  console.log("audit_log's append-only trigger: enabled (checked after the run).");
}

if (DO_DRIVE) {
  const rootId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) fail("GOOGLE_DRIVE_ROOT_FOLDER_ID is not set.");
  if (rootId === PROD_BUCKET) fail("the Drive root is PRODUCTION's bucket.");
  if (rootId === UAT_BUCKET) fail("the Drive root is UAT's bucket.");
  if (rootId !== TEST_BUCKET) fail(`the Drive root is not the Test bucket (${TEST_BUCKET}).`);

  const API = "https://www.googleapis.com/drive/v3";
  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  })
    .then((r) => r.json())
    .then((j) => j.access_token);
  if (!tok) fail("could not refresh the Google access token.");

  const drive = async (path, init) => {
    const r = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  };

  // Walk the bucket so the dry run can say how much is there, folders and files.
  let files = 0;
  let folders = 0;
  const top = [];
  const walk = async (parent, depth) => {
    let pageToken;
    do {
      const p = new URLSearchParams({
        q: `'${parent}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType)",
        pageSize: "1000",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      });
      if (pageToken) p.set("pageToken", pageToken);
      const page = await drive(`/files?${p}`);
      for (const f of page.files ?? []) {
        if (depth === 0) top.push(f);
        if (f.mimeType === "application/vnd.google-apps.folder") {
          folders++;
          await walk(f.id, depth + 1);
        } else files++;
      }
      pageToken = page.nextPageToken;
    } while (pageToken);
  };
  await walk(rootId, 0);

  console.log(`\nGoogle Drive — Test bucket ${rootId}`);
  console.log(`  ${files} files in ${folders} folders, under ${top.length} top-level entries`);

  if (!APPLY) {
    console.log("  would trash each top-level entry (restorable from Drive's bin for 30 days).");
  } else {
    let done = 0;
    for (const f of top) {
      await drive(`/files/${f.id}?supportsAllDrives=true`, {
        method: "PATCH",
        body: JSON.stringify({ trashed: true }),
      });
      done++;
      if (done % 10 === 0 || done === top.length) console.log(`  trashed ${done}/${top.length}`);
    }
    console.log(`  done — ${files} files are in Drive's bin. Empty the bin in Drive to erase them.`);
  }
}

console.log(
  APPLY
    ? "\nDone. The test system is a bare shelter: the setup is there, the content is gone."
    : "\nNothing was changed. Re-run with --apply to commit.",
);
