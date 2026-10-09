#!/usr/bin/env node
// Checks the printable acceptance checklist (`acceptance-matrix.mjs --pdf`)
// by rendering it and reading the text back out of the PDF with pdftotext
// (it ships with Git for Windows). Not run in CI, which has no pdftotext.
//
//   node scripts/check-acceptance-pdf.mjs
//
//   A  the real checklist: every role's column, sheet and sign-off row, every
//      matrix row, the failures list and the Director's line are in the PDF
//   B  ำ drops no letters. Rendered with Thai text in a role name and in a
//      step, each ending in ")" after one or more ำ: the ")" must survive.
//      @react-pdf drops one character from the end of a text for every ำ in it
//      unless the text goes through thaiPdfChildren()
//      (docs/decisions/2026-10-09-thai-sara-am-in-pdfs.md), and the page still
//      looks right, so nothing but a check like this finds it.
//   C  roles are data, not layout: a role the generator has never heard of, and
//      an existing role renamed to something longer (the vet → doctor rename),
//      each get a column, a sheet and a sign-off row with no renderer change.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(path.join(tmpdir(), "acceptance-pdf-"));
const node = (...a) => execFileSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", ...a], { cwd: repo, stdio: ["ignore", "pipe", "inherit"] });

let failed = 0;
const ok = (label, cond, detail = "") => {
  console.log(`${cond ? "ok  " : "FAIL"} ${label}${cond || !detail ? "" : `\n     ${detail}`}`);
  if (!cond) failed++;
};

/** PDF bytes → its text, with ำ put back together (thaiPdfText writes it as two code points). */
function pdfText(file) {
  try {
    return execFileSync("pdftotext", ["-raw", "-enc", "UTF-8", file, "-"], { encoding: "utf8" }).replace(/ํา/g, "ำ");
  } catch (e) {
    console.error(`check-acceptance-pdf: pdftotext could not be run (${e.code ?? e.message}). It comes with Git for Windows (mingw64/bin).`);
    process.exit(2);
  }
}

const { renderAcceptancePdf } = await import(pathToFileURL(path.join(repo, "scripts/lib/acceptance-matrix-pdf.mjs")).href);
async function render(doc, name) {
  const file = path.join(dir, name);
  writeFileSync(file, await renderAcceptancePdf(doc, repo));
  return pdfText(file);
}

try {
  node("scripts/acceptance-matrix.mjs", "--json", path.join(dir, "doc.json"));
  const fresh = () => JSON.parse(readFileSync(path.join(dir, "doc.json"), "utf8"));

  // ── A ──
  const doc = fresh();
  const text = await render(doc, "real.pdf");
  const flat = text.replace(/\s+/g, " ");
  for (const r of doc.roles) ok(`A ${r.label}: a tester's sheet`, flat.includes(`${r.label} — tester's sheet`));
  const ns = doc.sections.flatMap((s) => s.rows.map((r) => r.n));
  const lost = ns.filter((n) => !text.includes(n));
  ok(`A all ${ns.length} matrix rows are in the PDF`, lost.length === 0, `missing: ${lost.join(", ")}`);
  ok("A the failures list is there", flat.includes(doc.closing.failuresHeading));
  ok("A the Director's sign-off line is there", flat.includes("I have read the failures list"));

  // ── B and C ──
  const probe = fresh();
  const NEW = "หมอสัตว์ จำกัด (probe)";
  const STEP = "กดปุ่ม จำ แล้ว จำ อีกครั้ง (ok)";
  const SEE = "น้ำ ทำ ซ้ำ)";
  const LONG = "Doctor (partner clinic)";
  const renamed = probe.roles.findIndex((r) => r.key !== "admin");
  const oldLabel = probe.roles[renamed].label;
  probe.roles[renamed].label = LONG;
  probe.sheets.find((s) => s.label === oldLabel).label = LONG;
  probe.roles.push({ key: "probe", label: NEW, does: 1 });
  for (const s of probe.sections) for (const r of s.rows) r.cells.push("n/a");
  probe.sections[0].rows[0].cells[probe.roles.length - 1] = "does";
  probe.sheets.push({
    key: "probe",
    label: NEW,
    note: null,
    does: [{ n: "R999", activity: "จำ", do: STEP, expect: SEE, forRole: null, cases: [true, false, true, false] }],
    mustNot: [],
    boundaries: [{ n: "B1", text: `ลองลบ ${NEW}` }],
  });
  const ptext = (await render(probe, "probe.pdf")).replace(/[ \t]+/g, " ");
  ok(`B a role name with ำ keeps its last letter: "${NEW}"`, ptext.includes(`${NEW} — tester's sheet`));
  ok(`B a step with two ำ keeps its last letter: "${STEP}"`, ptext.includes(STEP));
  ok(`B an expected result with three ำ keeps its last letter: "${SEE}"`, ptext.includes(SEE));
  ok(`B a boundary line ending in a role with ำ: "ลองลบ ${NEW}"`, ptext.includes(`ลองลบ ${NEW}`));
  ok(`C a new role has a sign-off row`, ptext.split("\n").some((l) => l.trim() === NEW));
  ok(`C ${oldLabel} renamed "${LONG}": its sheet and sign-off row`, ptext.includes(`${LONG} — tester's sheet`) && ptext.split("\n").some((l) => l.trim() === LONG));
  ok(`C the old name "${oldLabel}" is gone from headings`, !ptext.includes(`${oldLabel} — tester's sheet`));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(failed ? `\ncheck-acceptance-pdf: ${failed} failed` : "\ncheck-acceptance-pdf: all passed");
process.exit(failed ? 1 : 0);
