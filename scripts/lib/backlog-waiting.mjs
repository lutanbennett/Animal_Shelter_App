// Shared by the waiting-state check, the reader and the page generator (#bkwai).
// The tag sits at the very end of an open item's line:
//   <!--waiting:<state> [by:<who>] since:YYYY-MM-DD [date:YYYY-MM-DD]-->
export const STATES = ["buildable", "stream", "lutan", "director", "decision", "purchasing", "person", "event", "parked"];
export const DECIDERS = ["lutan", "director"];
export const TAG_RE = /\s*<!--waiting:([^>]*?)-->\s*$/;

export function parseTag(line) {
  const m = line.match(TAG_RE);
  if (!m) return null;
  const body = m[1].trim();
  const parts = body.split(/\s+/);
  const tag = { raw: m[0].trim(), state: parts[0], by: null, since: null, date: null, bad: [] };
  for (const p of parts.slice(1)) {
    const kv = p.match(/^(by|since|date):(.+)$/);
    if (!kv) tag.bad.push(p);
    else tag[kv[1]] = kv[2];
  }
  return tag;
}

export function validDate(s) {
  if (!/^\d{4}-\d\d-\d\d$/.test(s || "")) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function stripTag(line) {
  return line.replace(TAG_RE, "");
}

// Open items: "- [ ] <!--#id--> ..." lines. Returns [{lineNo, id, line}].
export function openItems(text) {
  const out = [];
  text.split("\n").forEach((line, i) => {
    if (!/^- \[ \]/.test(line)) return;
    const id = (line.match(/<!--#(\w+)-->/) || [])[1] || null;
    out.push({ lineNo: i + 1, id, line });
  });
  return out;
}

// docs/backlog-names.json, validated. A file that is PRESENT but corrupt is a finding, not a
// crash: the names are what every open item is checked against, so a check that cannot read them
// has verified nothing, and the pre-commit hook lets a crash through on purpose. Throws an Error
// whose message names what is wrong with the file.
export function parseNames(raw) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch (err) {
    throw new Error(`it is not valid JSON — ${err.message}`);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`it is ${Array.isArray(value) ? "an array" : value === null ? "null" : typeof value}, not a flat object of item id to name`);
  for (const [id, name] of Object.entries(value)) {
    if (typeof name !== "string") throw new Error(`"${id}" is ${Array.isArray(name) ? "an array" : name === null ? "null" : typeof name}, not a name`);
  }
  return value;
}
