// A short summary PDF of a draft, one page-or-so per role, for the Director to mark up as the
// next draft: what each role can do (with a box to mark "change"), what it cannot, and the notes
// and unclear marks. Built from the same draft file the loader and the review page read.
//
//   node scripts/role-draft-pdf.mjs [--draft 1] [--out "<path>.pdf"]
import { createWriteStream, readFileSync } from "node:fs";
import PDFDocument from "pdfkit";
import { ACTIVITIES } from "../src/lib/permissions/catalogue.ts";
import { cellsFor } from "../src/lib/roles-draft/resolve.ts";

const args = process.argv.slice(2);
const opt = (n) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
const no = Number(opt("draft") ?? 1);
const out = opt("out") ?? `role-draft-${no}-summary.pdf`;
const draft = JSON.parse(readFileSync(new URL(`../src/lib/roles-draft/draft-${no}.json`, import.meta.url), "utf8"));
const kinds = Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.kind]));

const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Lanna Care: who does what, draft ${no}, by role` } });
doc.pipe(createWriteStream(out));
const W = doc.page.width - 96;

let first = true;
for (const [key, role] of Object.entries(draft.roles)) {
  if (!first) doc.addPage();
  first = false;
  const cells = new Map(cellsFor(draft, key, kinds).map((c) => [c.activity, c.level]));
  const holds = (row) =>
    row.keys.length > 0 && row.keys.every((k) => (cells.get(k.activity) ?? 0) >= (k.level === "read" ? 1 : 2));
  const yes = draft.rows.filter(holds);
  const no_ = draft.rows.filter((r) => r.keys.length > 0 && !holds(r));

  doc.font("Helvetica-Bold").fontSize(18).text(role.label);
  doc.font("Helvetica").fontSize(9).fillColor("#555").text(`Draft ${no}, from your sheet. Tick "Change?" next to anything that should be different, and write the new answer in the margin.`).fillColor("#000").moveDown(0.6);

  for (const n of role.notes ?? []) doc.font("Helvetica").fontSize(9.5).text(`• ${n}`, { width: W }).moveDown(0.25);
  const marks = draft.unclear.filter((u) => u.role === key);
  for (const m of marks) {
    const row = draft.rows.find((r) => r.row === m.row);
    doc.font("Helvetica-Oblique").fontSize(9.5).text(`Row ${m.row}, ${row.label}: ${m.mark}. Loaded as no. Should it be yes?   [ ] yes   [ ] no`, { width: W }).moveDown(0.25);
  }

  const list = (title, rows) => {
    doc.moveDown(0.4).font("Helvetica-Bold").fontSize(11).text(`${title} (${rows.length})`).moveDown(0.2);
    doc.font("Helvetica").fontSize(9);
    for (const r of rows) {
      if (doc.y > doc.page.height - 70) doc.addPage();
      const y = doc.y;
      doc.text(String(r.row), 48, y, { width: 22 });
      doc.text(r.label, 74, y, { width: W - 90 });
      const h = doc.y;
      doc.rect(48 + W - 44, y, 8, 8).stroke();
      doc.text("Change?", 48 + W - 32, y, { width: 40 });
      doc.y = Math.max(h, y + 12);
    }
  };
  list("Can do", yes);
  list("Cannot do", no_);
}
doc.end();
console.log(`Wrote ${out}`);
