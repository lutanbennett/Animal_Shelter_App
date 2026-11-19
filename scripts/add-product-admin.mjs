// Put a person on the product-administrator list (#shmgt, #pdmin), or take them off it.
//
//   node scripts/add-product-admin.mjs --env production --email someone@example.com
//       dry run: resolves the account, says whether they are already on the list,
//       reports whether they have an authenticator, prints the exact row it would
//       write, and stops. Nothing is written.
//
//   node scripts/add-product-admin.mjs --env production --email someone@example.com --apply --confirm someone@example.com
//       writes the row.
//
//   node scripts/add-product-admin.mjs --env production --list
//       prints the list, with each person's email and whether they can reach the writes.
//
//   node scripts/add-product-admin.mjs --env production --email someone@example.com --remove --apply --confirm someone@example.com
//       takes them off. Refuses to remove the last one.
//
// Without --env it works on the test (dev) database, as the other scripts do.
//
// WHY THIS SCRIPT EXISTS. `0411_product_admins.sql` deliberately seeds nobody — the
// repository is public — and its insert policy is `with check (public.is_product_admin())`,
// so **the list cannot bootstrap itself through the app**: the first row has to come from
// outside RLS. `docs/decisions/2026-11-18-product-admin-list-schema.md` says it is placed
// with the service role, and until now nothing did that, so the Product admin screen shipped
// live and unreachable in 0.47.3 and again in 0.47.4 (both release records say so).
//
// WHAT IT IS NOT. It is not a way around the card system and it grants nothing inside a
// shelter. PADMIN is a LIST OF PEOPLE — no role, no card, no cell — and is the third named
// exception to the zero-exceptions rule after Admin and the adopter website account; it is
// explicitly not a precedent. Everything a PADMIN does inside a shelter's own data stays
// card-governed like anyone else's.
//
// IDENTITY IS `auth.users.id`, NEVER THE EMAIL. 0411 says why: an id survives an email
// change, while a list keyed on email would silently lose the person — or hand the seat to
// whoever next held that address. The email is only how a human names the account here; it is
// resolved to an id and the id is what is stored.
//
// THE AUTHENTICATOR WARNING IS THE POINT OF THE DRY RUN. Every write on the Product admin
// screen needs an `aal2` session, and #shmgt's own findings record that a PADMIN with no
// authenticator cannot set one up themselves — first setup is opened by a shelter Admin. So a
// PADMIN without a verified factor can read the screen and do nothing on it. The dry run says
// so plainly rather than letting it be discovered on the screen.
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { bail, runMain } from "./lib/exit.mjs";

async function main() {

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const valueOf = (flagName) => {
  const i = args.indexOf(flagName);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (flagName) => args.includes(flagName);

const KNOWN = new Set(["--email", "--user-id", "--note", "--confirm", "--apply", "--remove", "--list", "--env"]);
const unknown = args.filter((a) => a.startsWith("--") && !KNOWN.has(a));
if (unknown.length) {
  console.error(`Unknown flag(s): ${unknown.join(", ")}. Known: ${[...KNOWN].join(", ")}`);
  bail(2);
}

const email = valueOf("--email");
const userIdArg = valueOf("--user-id");
const note = valueOf("--note");
const apply = has("--apply");
const remove = has("--remove");
const list = has("--list");

if (!list && !email && !userIdArg) {
  console.error("Give --email <address> or --user-id <uuid>, or --list to see who is on the list.");
  bail(2);
}
if (email && userIdArg) {
  console.error("Give --email or --user-id, not both.");
  bail(2);
}

const env = loadEnv(envName);
const ref = projectRef(env);
if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error(`No SUPABASE_ACCESS_TOKEN for ${envName}. It is how this script reaches the database; see README, "Environments".`);
  bail(2);
}

const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

async function query(statement) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: statement }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      // not JSON
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

console.log(`add-product-admin: ${envName} — project ${ref}`);

// The table may not exist yet on an environment that is behind on migrations. Say that
// rather than failing with a bare 42P01, because "0411 is not applied here" is the answer.
const [{ present: tablePresent } = {}] = await query(
  `select to_regclass('public.product_admins') is not null as present`,
);
if (!tablePresent) {
  console.error(`product_admins does not exist on ${envName}: 0411 is not applied there yet. Apply the migrations first.`);
  bail(2);
}

/** Everyone on the list, with the email and authenticator state the dry run reports. */
async function readList() {
  return query(`
    select p.user_id,
           u.email,
           p.note,
           p.created_at,
           (select count(*) from auth.mfa_factors f where f.user_id = p.user_id and f.status = 'verified') as verified_factors
      from public.product_admins p
      left join auth.users u on u.id = p.user_id
     order by p.created_at
  `);
}

if (list) {
  const rows = await readList();
  if (!rows.length) {
    console.log("The product-administrator list is EMPTY, so nobody can open Settings -> Product admin.");
    bail(0);
  }
  console.log(`${rows.length} product administrator(s):`);
  for (const r of rows) {
    const canWrite = Number(r.verified_factors) > 0 ? "has an authenticator" : "NO authenticator — can read the screen but not use it";
    console.log(`  ${r.email ?? "(account deleted)"}  ${r.user_id}  ${canWrite}${r.note ? `  note: ${r.note}` : ""}`);
  }
  bail(0);
}

// Resolve the account. An email that matches no account, or more than one, stops here:
// guessing which person was meant is exactly what this script must not do.
let userId = userIdArg;
let resolvedEmail = email;
if (email) {
  const matches = await query(`select id, email from auth.users where lower(email) = lower(${q(email)})`);
  if (!matches.length) {
    console.error(`No account on ${envName} has the address ${email}. Check the spelling, or that they have signed in at least once.`);
    bail(2);
  }
  if (matches.length > 1) {
    console.error(`${matches.length} accounts on ${envName} have the address ${email}. Pass --user-id <uuid> to say which.`);
    bail(2);
  }
  userId = matches[0].id;
  resolvedEmail = matches[0].email;
} else {
  const matches = await query(`select id, email from auth.users where id = ${q(userId)}`);
  if (!matches.length) {
    console.error(`No account on ${envName} has the id ${userId}.`);
    bail(2);
  }
  resolvedEmail = matches[0].email;
}

const current = await readList();
const already = current.find((r) => r.user_id === userId);
const [{ verified_factors: factors } = {}] = await query(
  `select count(*) as verified_factors from auth.mfa_factors where user_id = ${q(userId)} and status = 'verified'`,
);
const hasAuthenticator = Number(factors) > 0;

console.log(`add-product-admin: ${resolvedEmail} -> ${userId}`);
console.log(`add-product-admin: the list currently holds ${current.length} person/people.`);

if (remove) {
  if (!already) {
    console.log(`${resolvedEmail} is NOT on the list; nothing to remove.`);
    bail(0);
  }
  if (current.length === 1) {
    console.error(
      `Refusing: ${resolvedEmail} is the ONLY product administrator. Removing them would leave the list empty, and an empty list cannot be added to through the app — the next person would need this script again. Add someone else first.`,
    );
    bail(2);
  }
} else if (already) {
  console.log(`${resolvedEmail} is ALREADY a product administrator (added ${already.created_at}). Nothing to do.`);
  bail(0);
}

// The authenticator warning, before the write rather than after it.
if (!remove && !hasAuthenticator) {
  console.log("");
  console.log("NOTE: this account has NO verified authenticator.");
  console.log("  Every write on Settings -> Product admin needs a second step (aal2), so they will be");
  console.log("  able to open the screen and read it, and not to add a shelter, map an address or");
  console.log("  change the list. #shmgt also records that a PADMIN who is not a shelter Admin reaches");
  console.log("  the screen only by typing its address, because the tile lives on the Settings landing");
  console.log("  page, and that first authenticator set-up is opened by a shelter Admin.");
  console.log("");
}

const statement = remove
  ? `delete from public.product_admins where user_id = ${q(userId)}`
  : `insert into public.product_admins (user_id, note) values (${q(userId)}, ${note ? q(note) : "null"}) on conflict (user_id) do nothing`;

if (!apply) {
  console.log(`add-product-admin: DRY RUN — nothing was written. It would run:`);
  console.log(`  ${statement}`);
  console.log(
    `\nTo do it: node scripts/add-product-admin.mjs --env ${envName} ${email ? `--email ${resolvedEmail}` : `--user-id ${userId}`}${note ? ` --note ${JSON.stringify(note)}` : ""}${remove ? " --remove" : ""} --apply --confirm ${resolvedEmail}`,
  );
  bail(0);
}

// Changing a live list needs the address typed back, the same guard correct-resident.mjs uses.
const confirm = valueOf("--confirm");
if (confirm !== resolvedEmail) {
  console.error(
    `Refusing: --apply also needs --confirm ${resolvedEmail}. Run it without --apply first; the dry run prints the exact line.`,
  );
  bail(2);
}

await query(statement);

const after = await readList();
const nowOn = after.some((r) => r.user_id === userId);
if (remove ? nowOn : !nowOn) {
  console.error(`The write did not take effect: ${resolvedEmail} is ${nowOn ? "still on" : "still off"} the list. Nothing else was changed.`);
  bail(1);
}
console.log(`add-product-admin: ${remove ? "removed" : "added"} ${resolvedEmail}. The list now holds ${after.length} person/people:`);
for (const r of after) {
  const canWrite = Number(r.verified_factors) > 0 ? "has an authenticator" : "NO authenticator";
  console.log(`  ${r.email ?? "(account deleted)"}  ${canWrite}`);
}
}

await runMain(main);
