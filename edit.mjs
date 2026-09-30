import fs from "node:fs";
export function edit(f, pairs) {
  let s = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
  for (const [a, b] of pairs) {
    if (!s.includes(a)) { console.error("MISSING in", f, ":", a.slice(0, 60)); continue; }
    s = s.replace(a, b);
  }
  fs.writeFileSync(f, s);
}
