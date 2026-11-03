/**
 * Reads supabase/migrations/*.sql in order and returns the functions that are STILL LIVE
 * (last `create [or replace] function` per name+argument types, minus any later `drop function`),
 * each with the `raise exception` messages in its body. Report-only; nothing here decides access.
 *
 * What it can NOT see (said here so a zero is not read as proof): a function created by dynamic SQL
 * (`execute format(...)`), a message built from a variable (`raise exception using message = v`),
 * a rename via `alter function ... rename`, and the live database (it reads files, not pg_proc).
 * Raises inside `do $$ ... $$` blocks are counted separately as harness-or-one-off, never as live.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const strip = (s) => s.replace(/--[^\n]*/g, (m) => " ".repeat(m.length)); // line comments only; bodies keep their strings

export function readMigrations(dir) {
  return readdirSync(dir).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort()
    .map((f) => ({ file: f, sql: readFileSync(path.join(dir, f), "utf8") }));
}

const norm = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();

// Overloads are told apart by argument COUNT only. Types are not compared: a later migration's
// "drop function f(uuid)" lists types where the definition lists names, and comparing them split one function in two.
// Limit: two live overloads with the same name and the same count would be merged (none seen; the script prints the check).
function argTypes(args) {
  let d = 0, n = args.trim() ? 1 : 0;
  for (const ch of args) { if (ch === "(") d++; if (ch === ")") d--; if (ch === "," && d === 0) n++; }
  return String(n);
}

export function messagesOf(body) {
  const out = [];
  const re = /raise\s+exception\s+('(?:[^']|'')*')((?:\s*,\s*[^;]*?)?)\s*(?:using\s+([^;]*))?;/gi;
  let m;
  while ((m = re.exec(body))) {
    out.push({ text: m[1].slice(1, -1).replace(/''/g, "'"), raw: m[0], code: (/errcode\s*=\s*'([^']+)'/i.exec(m[0]) || [])[1] || null, line: body.slice(0, m.index).split("\n").length });
  }
  // raise exception forms the quoted-literal pattern missed (variable message, using message = ...)
  const all = (body.match(/raise\s+exception/gi) || []).length;
  return { messages: out, unparsed: all - out.length, all };
}

export function liveFunctions(migrations) {
  const defs = new Map(); // key -> def
  const doBlocks = [];
  let rawHits = 0;
  for (const { file, sql } of migrations) {
    rawHits += (sql.match(/raise exception/g) || []).length;
    const s = strip(sql);
    const events = [];
    const fre = /create\s+(?:or\s+replace\s+)?function\s+([\w."]+)\s*\(/gi;
    let m;
    while ((m = fre.exec(s))) {
      // find matching close paren of the argument list
      let i = fre.lastIndex, d = 1;
      while (i < s.length && d > 0) { if (s[i] === "(") d++; else if (s[i] === ")") d--; i++; }
      const args = s.slice(fre.lastIndex, i - 1);
      const rest = s.slice(i);
      const dm = /\$([\w]*)\$/.exec(rest);
      if (!dm) continue;
      const tag = dm[0];
      const start = i + dm.index + tag.length;
      const end = s.indexOf(tag, start);
      if (end < 0) continue;
      const header = rest.slice(0, dm.index);
      const footer = s.slice(end + tag.length, end + tag.length + 300).split(";")[0];
      const name = m[1].replace(/"/g, "").replace(/^public\./, "");
      events.push({ pos: m.index, type: "def", key: `${name}(${argTypes(args)})`, name, file, definer: /security\s+definer/i.test(header + footer), returns: (/returns\s+([\w. ]+?)(?:\s+(?:language|as|security|set|stable|volatile|immutable)|$)/i.exec(header) || [])[1] || "", body: s.slice(start, end), line: s.slice(0, m.index).split("\n").length });
      fre.lastIndex = end + tag.length;
    }
    const dre = /drop\s+function\s+(?:if\s+exists\s+)?([\w."]+)\s*(?:\(([^)]*)\))?/gi;
    while ((m = dre.exec(s))) events.push({ pos: m.index, type: "drop", name: m[1].replace(/"/g, "").replace(/^public\./, ""), args: m[2] });
    const ore = /\bdo\s+\$([\w]*)\$/gi;
    while ((m = ore.exec(s))) {
      const tag = m[0].slice(3); const end = s.indexOf(tag, ore.lastIndex);
      if (end > 0) { doBlocks.push({ file, n: messagesOf(s.slice(ore.lastIndex, end)).all }); ore.lastIndex = end + tag.length; }
    }
    events.sort((a, b) => a.pos - b.pos);
    for (const e of events) {
      if (e.type === "def") defs.set(e.key, e);
      else for (const k of [...defs.keys()]) {
        if (e.args === undefined ? k.startsWith(e.name + "(") : k === `${e.name}(${argTypes(e.args)})`) defs.delete(k);
      }
    }
  }
  return { live: [...defs.values()], rawHits, doBlocks };
}
