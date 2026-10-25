// Guards against an app/database mismatch on an rpc call (0.40.2: the app sent two inputs to set_role_cards, which still
// required three, and PostgREST answered PGRST202 on every save). Offline: reads the migrations in order (the last
// definition of a function wins) and every `supabase.rpc("name", { ... })` call in src/ with an inline object, then
// requires that each input the function demands without a default is sent, and that nothing unknown is sent.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const strip = (s) => s.replace(/--[^\n]*/g, "");

/** name -> [{ name, required }] from the newest `create [or replace] function`. */
export function functionInputs(sqlFiles) {
  const fns = new Map();
  for (const sql of sqlFiles) {
    const re = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?(\w+)"?\s*\(/gi;
    let m;
    while ((m = re.exec(sql))) {
      let depth = 1, i = re.lastIndex;
      for (; i < sql.length && depth; i++) depth += sql[i] === "(" ? 1 : sql[i] === ")" ? -1 : 0;
      const args = [];
      let level = 0, cur = "";
      for (const ch of sql.slice(re.lastIndex, i - 1) + ",") {
        if (ch === "(") level++;
        if (ch === ")") level--;
        if (ch === "," && !level) { if (cur.trim()) args.push(cur.trim()); cur = ""; } else cur += ch;
      }
      const inputs = args
        .map((a) => a.replace(/^(in|inout|variadic)\s+/i, ""))
        .map((a) => ({ name: a.split(/\s+/)[0].replace(/"/g, ""), required: !/\bdefault\b|:=|=/i.test(a) }));
      fns.set(m[1].toLowerCase(), inputs);
    }
  }
  return fns;
}

/** [{ file, fn, keys }] for rpc calls whose second argument is an inline `{ a, b: x }` object. */
export function rpcCalls(file, src) {
  const out = [];
  const re = /\.rpc\(\s*["'](\w+)["']\s*(?:,\s*\{)?/g;
  let m;
  while ((m = re.exec(src))) {
    if (!m[0].endsWith("{")) { out.push({ file, fn: m[1], keys: [] }); continue; }
    let depth = 1, i = re.lastIndex, cur = "", top = "";
    for (; i < src.length && depth; i++) {
      const ch = src[i];
      if ("{([".includes(ch)) depth++;
      if ("})]".includes(ch)) depth--;
      if (depth >= 1) top += depth === 1 ? ch : " ";
    }
    const keys = [...top.matchAll(/(?:^|,)\s*(\w+)\s*(?=[:,]|$)/g)].map((k) => k[1]);
    out.push({ file, fn: m[1], keys });
  }
  return out;
}

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });

test("rpc calls send exactly the inputs the live function takes", () => {
  const migrations = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
  const fns = functionInputs(migrations.map((f) => strip(readFileSync(join("supabase/migrations", f), "utf8"))));
  const problems = [];
  let checked = 0;
  for (const file of walk("src")) {
    const text = readFileSync(file, "utf8").replace(/(^|\s)\/\/[^\n]*/g, "$1"); // line comments may hold commas and brackets
    for (const call of rpcCalls(file, text)) {
      const inputs = fns.get(call.fn.toLowerCase());
      if (!inputs) continue; // not defined in a migration (e.g. an extension's); nothing to compare
      checked++;
      const names = inputs.map((i) => i.name);
      for (const i of inputs) if (i.required && !call.keys.includes(i.name)) problems.push(`${file}: ${call.fn} is missing required input ${i.name}`);
      for (const k of call.keys) if (!names.includes(k)) problems.push(`${file}: ${call.fn} sends unknown input ${k}`);
    }
  }
  assert.ok(checked > 10, `only ${checked} rpc calls were compared; the parser has stopped finding them`);
  assert.deepEqual(problems, []);
});

test("the parser sees the set_role_cards break", () => {
  const fns = functionInputs(["create or replace function set_role_cards(p_role uuid, p_cards text[], p_bundle jsonb) returns void as $$ $$;"]);
  const [call] = rpcCalls("x.ts", 'supabase.rpc("set_role_cards", { p_role: roleId, p_cards: cards });');
  assert.deepEqual(call.keys, ["p_role", "p_cards"]);
  assert.deepEqual(fns.get("set_role_cards").filter((i) => i.required && !call.keys.includes(i.name)).map((i) => i.name), ["p_bundle"]);
});
