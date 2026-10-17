// A volunteer's refused-write row, against DEV (policy 0214, client: assistant-refused-row).
//
//   node scripts/check-assistant-refused-client.mjs [--keep]
//
// Makes a throwaway volunteer, signs in as them with the anon key, and checks
// the exact write the app makes: a bare insert (no .select()) of status
// 'refused' on their own row succeeds; they cannot read it back; any other
// status, or another user's row, is refused. The row is then read as the
// service role. Everything is deleted at the end unless --keep, which leaves
// the login and writes its credentials to this checkout's .env.local
// (DRYRUN_VOLUNTEER_*) for a browser pass. Dev only. Exits 0 when all held.
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { giveRole } from "./lib/user-role.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error("refusing: not the dev project");
const keep = process.argv.includes("--keep");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const opts = { auth: { autoRefreshToken: false, persistSession: false } };
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, opts);
const failures = [];
const expect = (ok, what) => { console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`); if (!ok) failures.push(what); };

const tag = randomBytes(4).toString("hex");
const email = `dryrun-volunteer-${tag}@example.invalid`;
const password = randomBytes(18).toString("base64url");
const text = `  Move Rex to the vet ${tag}  `;
let userId;
try {
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  userId = data.user.id;
  const { error: roleErr } = await giveRole(service, userId, "volunteer");
  if (roleErr) throw roleErr;

  const me = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts);
  const { error: inErr } = await me.auth.signInWithPassword({ email, password });
  if (inErr) throw inErr;

  const { error: e1 } = await me.from("assistant_actions").insert({ request_text: text, intent: null, draft: null, status: "refused", result: null });
  expect(!e1, `volunteer's bare 'refused' insert succeeds (${e1?.message ?? "no error"})`);
  const { data: back } = await me.from("assistant_actions").select("id").eq("request_text", text);
  expect((back ?? []).length === 0, "the volunteer cannot read the row back");
  const { error: e2 } = await me.from("assistant_actions").insert({ request_text: text, status: "confirmed" });
  expect(!!e2, "'confirmed' under assistant.ask is refused");
  const { error: e3 } = await me.from("assistant_actions").insert({ request_text: text, status: "unmatched" });
  expect(!!e3, "'unmatched' under assistant.ask is refused");
  const { data: lu } = await service.auth.admin.listUsers({ perPage: 5 });
  const otherId = lu?.users?.find((u) => u.id !== userId)?.id;
  if (otherId) {
    const { error: e4 } = await me.from("assistant_actions").insert({ user_id: otherId, request_text: text, status: "refused" });
    expect(!!e4, "a 'refused' row in someone else's name is refused");
  } else console.log("  skip other-user check (no other profile)");

  const { data: rows } = await service.from("assistant_actions").select("user_id,status,request_text,intent,draft,result").eq("request_text", text);
  console.log("  rows as service role:", JSON.stringify(rows));
  expect(rows?.length === 1 && rows[0].status === "refused" && rows[0].user_id === userId && rows[0].intent === null && rows[0].draft === null,
    "exactly one row: refused, the volunteer's own user_id, no intent or draft");
} catch (e) {
  failures.push(String(e?.message ?? e));
  console.log("ERROR", e?.message ?? e);
} finally {
  if (keep && userId && !failures.length) {
    appendFileSync(join(root, ".env.local"), `\nDRYRUN_VOLUNTEER_EMAIL=${email}\nDRYRUN_VOLUNTEER_PASSWORD=${password}\n`);
    console.log(`  kept ${email}; credentials in .env.local`);
  } else if (userId) {
    await service.from("assistant_actions").delete().eq("request_text", text);
    await service.from("user_roles").delete().eq("user_id", userId);
    await service.auth.admin.deleteUser(userId);
  }
}
process.exitCode = failures.length ? 1 : 0;
