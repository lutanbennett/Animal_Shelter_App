// Reduce Postgres SQL to the part that is CODE, so a check that reads migrations with a regex is not fooled by what a file merely says.
//
// Blanked to spaces (every newline kept, so line numbers stay honest and offsets barely move):
//   - `-- …` to end of line and `/* … */` (which nests in Postgres)
//   - the CONTENTS of '…' strings (with '' doubling, and E'…' backslash escapes); the quotes stay
//   - dollar-quoted `$tag$ … $tag$` bodies, when dollarBodies is "blank" (default)
// strings: "keep" leaves the contents of '…' strings in place (comments are still blanked), for a reader that must see a literal such as
// 'admin'::app_role but not be fooled by a `--` or `;` inside one. Same length either way, so the two outputs line up offset for offset.
// Left alone: "quoted identifiers" (a `--` inside one is not a comment).
//
// dollarBodies: "keep" scans INSIDE the body as code instead of blanking it, so a comment or string in a function body is still
// blanked but the statements in it are visible. check-hard-coded-security needs that (it must read a security definer body for its
// gate); check-migration-grants wants the body gone.
//
// Why this exists: a `;` or `--` inside a string was read as code. In check-migration-grants that split a statement; in
// check-hard-coded-security (the blocking one) it let a real policy or `grant … to anon` vanish, and a commented-out
// `has_permission(` satisfy the gate test. See docs/decisions/2026-10-31-sql-readers-know-string-literals.md.
export function sqlCodeOnly(sql, { dollarBodies = "blank", strings = "blank" } = {}) {
  const blank = (s) => s.replace(/[^\r\n]/g, " ");
  let out = "";
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i], d = sql[i + 1];
    if (c === "-" && d === "-") {
      let j = i;
      while (j < n && sql[j] !== "\n" && sql[j] !== "\r") j++;
      out += blank(sql.slice(i, j));
      i = j;
    } else if (c === "/" && d === "*") {
      let depth = 1, j = i + 2;
      while (j < n && depth > 0) {
        if (sql[j] === "/" && sql[j + 1] === "*") { depth++; j += 2; }
        else if (sql[j] === "*" && sql[j + 1] === "/") { depth--; j += 2; }
        else j++;
      }
      out += blank(sql.slice(i, j));
      i = j;
    } else if (c === "'") {
      const escapes = /[eE]$/.test(sql.slice(Math.max(0, i - 1), i)) && !/\w/.test(sql[i - 2] ?? " ");
      let j = i + 1;
      while (j < n) {
        if (escapes && sql[j] === "\\") { j += 2; continue; }
        if (sql[j] === "'") { if (sql[j + 1] === "'") { j += 2; continue; } break; }
        j++;
      }
      out += "'" + (strings === "keep" ? sql.slice(i + 1, j) : blank(sql.slice(i + 1, j))) + (j < n ? "'" : "");
      i = j + 1;
    } else if (c === '"') {
      let j = i + 1;
      while (j < n && !(sql[j] === '"' && sql[j + 1] !== '"')) j += sql[j] === '"' ? 2 : 1;
      out += sql.slice(i, j + 1);
      i = j + 1;
    } else if (c === "$" && !/\w/.test(sql[i - 1] ?? " ")) {
      const tag = sql.slice(i).match(/^\$([A-Za-z_]\w*)?\$/);
      const close = tag ? sql.indexOf(tag[0], i + tag[0].length) : -1;
      if (!tag || close < 0) { out += c; i++; continue; }
      const body = sql.slice(i + tag[0].length, close);
      out += tag[0] + (dollarBodies === "keep" ? sqlCodeOnly(body, { dollarBodies, strings }) : blank(body)) + tag[0];
      i = close + tag[0].length;
    } else { out += c; i++; }
  }
  return out;
}
