// The acceptance checklist as a printable A4 PDF — the sign-off edition the
// testers write on. Called by `node scripts/acceptance-matrix.mjs --pdf <file>`
// with the same `doc` object the Markdown is written from, so the two editions
// cannot disagree about what is tested.
//
// It names no role and no activity. Columns, sheets and sign-off rows are
// whatever `doc` lists, so a role added or renamed in the generator is a
// re-run here, not an edit. Widths are shared out by how many roles there are.
//
// Thai: the font and the ำ fix are the app's own, imported, not copied —
// src/lib/archive/fonts/ (Noto Sans Thai, embedded) and thaiPdfChildren(), the
// path PR #486 fixed for the manual and archive PDFs. Every string goes through
// the Text wrapper below, which applies it; see
// docs/decisions/2026-10-09-thai-sara-am-in-pdfs.md for why a ำ otherwise drops
// letters from the end of its text. Plain React.createElement, not JSX, because
// this runs under plain node (type stripping only), not Next's compiler.

import { createRequire, register } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createElement as h } from "react";
import { Document, Font, Page, StyleSheet, Text as PdfText, View, renderToBuffer } from "@react-pdf/renderer";

/** Imports a src/ TypeScript module whose own imports are extensionless, as Next allows. */
async function importSrc(repo, file) {
  if (!importSrc.hooked) {
    register(
      "data:text/javascript," +
        encodeURIComponent(`
          export async function resolve(spec, ctx, next) {
            if (spec.startsWith(".") && !/\\.[a-z]+$/.test(spec) && ctx.parentURL?.endsWith(".ts")) return next(spec + ".ts", ctx);
            return next(spec, ctx);
          }`),
    );
    importSrc.hooked = true;
  }
  return import(pathToFileURL(path.join(repo, file)).href);
}

const COLORS = { text: "#1f2933", muted: "#6b7280", rule: "#c9d1da", faint: "#eef1f4", accent: "#a35f00", refuse: "#9b2c2c" };
// Line height is set on each Text, never inherited (as in the manual PDF).
const LH = 1.35;
const LANDSCAPE_W = 842 - 72;
const NO_HYPHENATION = 10000;

const s = StyleSheet.create({
  page: { fontFamily: "NotoSansThai", fontSize: 8.5, color: COLORS.text, paddingTop: 40, paddingBottom: 40, paddingHorizontal: 36 },
  kicker: { fontSize: 8, lineHeight: LH, letterSpacing: 1.1, color: COLORS.accent, fontWeight: 700 },
  title: { fontSize: 24, lineHeight: 1.25, fontWeight: 700, marginTop: 2 },
  h2: { fontSize: 14, lineHeight: 1.3, fontWeight: 700, borderBottomWidth: 1, borderBottomColor: COLORS.rule, paddingBottom: 3, marginBottom: 6 },
  h3: { fontSize: 11, lineHeight: 1.3, fontWeight: 700, marginTop: 12, marginBottom: 4 },
  body: { fontSize: 9, lineHeight: LH },
  muted: { fontSize: 8, lineHeight: LH, color: COLORS.muted },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: COLORS.rule },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: COLORS.text, backgroundColor: COLORS.faint },
  td: { paddingVertical: 3, paddingHorizontal: 3, fontSize: 8, lineHeight: LH },
  thText: { paddingVertical: 3, paddingHorizontal: 3, fontSize: 7.5, lineHeight: 1.25, fontWeight: 700 },
  box: { width: 11, height: 11, borderWidth: 0.8, borderColor: COLORS.text },
  fill: { flexDirection: "row", marginTop: 10 },
  fillLabel: { fontSize: 9, lineHeight: LH, marginRight: 4 },
  fillLine: { flex: 1, borderBottomWidth: 0.6, borderBottomColor: COLORS.text, marginRight: 14, marginBottom: 3 },
  runHead: { position: "absolute", top: 18, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: COLORS.muted },
  footer: { position: "absolute", bottom: 18, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: COLORS.muted },
});

/** Every string in it through thaiPdfChildren, so a ำ drops no letters; no hyphenation. */
let thai = (c) => c;
const Text = ({ style, children, ...rest }) => h(PdfText, { hyphenationPenalty: NO_HYPHENATION, style, ...rest }, thai(substitute(children)));

/**
 * Characters the generator's words use that Noto Sans Thai has no glyph for, and
 * what prints instead. Without this the PDF draws a wrong glyph over the next
 * letter (the manual's "the ☰ button" came out as an overprinted 0). Any other
 * missing character stops the render and names itself: add it here.
 */
const SUBSTITUTES = { "→": "to", "☰": "three-line" };
const SUBSTITUTE_RE = new RegExp(`[${Object.keys(SUBSTITUTES).join("")}]`, "gu");
function substitute(children) {
  if (typeof children === "string") return children.replace(SUBSTITUTE_RE, (c) => SUBSTITUTES[c]);
  if (Array.isArray(children)) return children.map(substitute);
  return children;
}

/** Every string in `doc`, for the glyph check. */
function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (v && typeof v === "object") for (const x of Object.values(v)) strings(x, out);
  return out;
}

/** Throws, naming each one, if `doc` holds a character neither weight of the font can draw and SUBSTITUTES does not cover. */
function checkGlyphs(doc, fontUris) {
  const fontkit = createRequire(import.meta.url)("fontkit");
  const faces = fontUris.map((uri) => fontkit.create(Buffer.from(uri.slice(uri.indexOf(",") + 1), "base64")));
  const missing = new Map();
  for (const str of strings(doc)) {
    for (const ch of str) {
      if (/\s/u.test(ch) || SUBSTITUTES[ch] || faces.every((f) => f.hasGlyphForCodePoint(ch.codePointAt(0)))) continue;
      if (!missing.has(ch)) missing.set(ch, str);
    }
  }
  if (missing.size) {
    const name = (c) => `"${c}" (U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")})`;
    throw new Error(
      [
        `acceptance-matrix --pdf: the Thai font has no glyph for ${[...missing.keys()].map(name).join(", ")}, so it would print as a wrong character.`,
        ...[...missing].map(([c, str]) => `  "${c}" in: ${str.slice(0, 100)}`),
        `Add each to SUBSTITUTES in scripts/lib/acceptance-matrix-pdf.mjs with the words to print instead.`,
      ].join("\n"),
    );
  }
}

/** The generator's prose: **bold** becomes bold, `code` loses its backticks. */
function rich(str, style) {
  const parts = String(str).replace(/`/g, "").split(/\*\*(.+?)\*\*/g);
  return h(Text, { style }, ...parts.map((p, i) => (i % 2 ? h(Text, { key: i, style: { fontWeight: 700 } }, p) : p)));
}

/** A table: `cols` are { label, width?: number, flex?: number, center?: boolean }. */
function Table({ cols, rows, minRowHeight, repeatHeader }) {
  const cell = (c, content, i, head) => {
    const box = { width: c.width, flex: c.width ? undefined : (c.flex ?? 1), justifyContent: "center", alignItems: c.center ? "center" : "stretch" };
    const inner = typeof content === "string" || content == null ? h(Text, { style: [head ? s.thText : s.td, c.center ? { textAlign: "center" } : {}] }, content ?? "") : content;
    return h(View, { key: i, style: box }, inner);
  };
  return h(
    View,
    null,
    h(View, { style: s.th, wrap: false, fixed: !!repeatHeader }, ...cols.map((c, i) => cell(c, c.label, i, true))),
    ...rows.map((r, ri) =>
      r.band
        ? h(View, { key: ri, style: [s.tr, { backgroundColor: COLORS.faint }], wrap: false, minPresenceAhead: 30 }, h(Text, { style: [s.td, { fontWeight: 700 }] }, r.band))
        : h(View, { key: ri, style: [s.tr, minRowHeight ? { minHeight: minRowHeight } : {}], wrap: false }, ...cols.map((c, i) => cell(c, r.cells[i], i, false))),
    ),
  );
}

const Box = () => h(View, { style: s.box });
const Dash = () => h(Text, { style: [s.td, { color: COLORS.muted, textAlign: "center" }] }, "–");
const caseCell = (on) => (on ? h(Box) : h(Dash));

/** "Label: ______" pairs on one line, to be written on. */
const FillIn = ({ labels }) => h(View, { style: s.fill, wrap: false }, ...labels.flatMap((l, i) => [h(Text, { key: `l${i}`, style: s.fillLabel }, `${l}:`), h(View, { key: `v${i}`, style: s.fillLine })]));

function Chrome({ doc, where }) {
  return [
    h(View, { key: "head", style: s.runHead, fixed: true }, h(Text, null, doc.title), h(Text, null, where)),
    h(
      View,
      { key: "foot", style: s.footer, fixed: true },
      h(Text, null, `Generated from ${doc.version} · acceptance-____-__-__`),
      h(Text, { render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}` }),
    ),
  ];
}

function CoverPage({ doc }) {
  return h(
    Page,
    { size: "A4", style: s.page },
    ...Chrome({ doc, where: "Cover" }),
    h(Text, { style: s.kicker }, "LANNA CARE FOR ANIMALS · SIGN-OFF EDITION"),
    h(Text, { style: s.title }, doc.title),
    h(View, { style: { marginTop: 8 } }, rich(doc.generated, s.muted)),
    h(View, { style: { marginTop: 18 } }, h(Text, { style: s.h2 }, "Cover")),
    ...doc.cover.map(([k, v], i) =>
      h(
        View,
        { key: `c${i}`, style: [s.tr, { minHeight: 26, alignItems: "flex-end" }], wrap: false },
        h(Text, { style: [s.td, { width: 190, fontWeight: 700 }] }, k),
        // A blank is a line to write on, not underscores.
        h(Text, { style: [s.td, { flex: 1 }] }, v.split(doc.blank).join("                                        ")),
      ),
    ),
    h(View, { style: { marginTop: 18 } }, h(Text, { style: s.h2 }, "How to read this")),
    rich(doc.howToRead.intro, s.body),
    ...doc.howToRead.points.map((p, i) => h(View, { key: `p${i}`, style: { flexDirection: "row", marginTop: 4 } }, h(Text, { style: [s.body, { width: 10 }] }, "•"), h(View, { style: { flex: 1 } }, rich(p, s.body)))),
    h(View, { style: { marginTop: 18 } }, h(Text, { style: s.h2 }, "In this edition")),
    h(Text, { style: s.body }, `The matrix (every activity × every role), then one tester's sheet per role: ${doc.sheets.map((x) => x.label).join(", ")}.${doc.closing ? " Last, the failures list and the Director's sign-off." : ""}`),
  );
}

function MatrixPage({ doc }) {
  const n = doc.roles.length;
  const roleW = Math.min(64, Math.floor((LANDSCAPE_W - 30 - 86 - 240) / Math.max(n, 1)));
  const cellStyle = { does: { fontWeight: 700 }, "must not": { color: COLORS.refuse }, "n/a": { color: COLORS.muted } };
  const cols = [
    { label: "#", width: 30 },
    { label: "Activity", flex: 1 },
    { label: "Device", width: 86 },
    ...doc.roles.map((r) => ({ label: r.label, width: roleW, center: true })),
  ];
  const rows = doc.sections.flatMap((sec) => [
    { band: sec.title },
    ...sec.rows.map((r) => ({
      cells: [r.n, r.activity, r.device, ...r.cells.map((c) => h(Text, { style: [s.td, { textAlign: "center" }, cellStyle[c]] }, doc.cellText[c]))],
    })),
  ]);
  return h(
    Page,
    { size: "A4", orientation: "landscape", style: s.page },
    ...Chrome({ doc, where: "The matrix" }),
    h(Text, { style: s.h2 }, "The matrix"),
    h(Table, { cols, rows, repeatHeader: true }),
    h(Text, { style: [s.muted, { marginTop: 6 }] }, `Rows each role does: ${doc.roles.map((r) => `${r.label} ${r.does}`).join(" · ")}.`),
  );
}

/**
 * A role's sheet: one run of pages per table, so each table's column headings
 * can repeat at the top of every page it spills onto — a tester on the third
 * page still needs to know which box is "ไทย phone". The running head names the
 * role and the table, so a loose page can be put back.
 */
function sheetPages(doc, sheet) {
  const t = doc.sheet;
  const title = `${sheet.label} — tester's sheet`;
  const runs = [];
  if (sheet.does.length) {
    runs.push({
      heading: t.doesHeading,
      intro: t.doesIntro,
      table: {
        cols: [
          { label: "#", width: 30 },
          { label: "Activity", width: 105 },
          { label: "What to do", flex: 1 },
          { label: "You should see", flex: 1 },
          ...t.caseColumns.map((c) => ({ label: c, width: 40, center: true })),
          { label: "Notes", width: 130 },
        ],
        rows: sheet.does.map((r) => ({
          cells: [r.n, r.activity, r.do, r.forRole ? rich(`${r.expect} **For this role:** ${r.forRole}`, s.td) : r.expect, ...r.cases.map(caseCell), ""],
        })),
      },
    });
  }
  if (sheet.mustNot.length) {
    runs.push({
      heading: t.mustNotHeading,
      intro: t.mustNotIntro,
      table: {
        cols: [{ label: "#", width: 30 }, { label: "Activity", flex: 1 }, ...t.mustNotColumns.map((c) => ({ label: c, width: 70, center: true })), { label: "Notes", width: 220 }],
        rows: sheet.mustNot.map((r) => ({ cells: [r.n, r.activity, h(Box), h(Box), ""] })),
      },
    });
  }
  if (sheet.boundaries.length) {
    runs.push({
      heading: t.boundariesHeading,
      intro: null,
      table: {
        cols: [{ label: "#", width: 30 }, { label: "Try this", flex: 1 }, { label: "Result", width: 50, center: true }, { label: "Notes", width: 220 }],
        rows: sheet.boundaries.map((b) => ({ cells: [b.n, b.text, h(Box), ""] })),
      },
    });
  }
  const signature = h(
    View,
    { key: "sig", wrap: false, style: { marginTop: 16 } },
    h(FillIn, { labels: ["Tester's signature", "Date"] }),
    h(Text, { style: [s.muted, { marginTop: 4 }] }, t.oath),
  );
  // A role with nothing to test still gets a page to sign, so the sheet count matches the roles.
  if (runs.length === 0) runs.push({ heading: null, intro: null, table: null });
  return runs.map((run, i) =>
    h(
      Page,
      { key: `${sheet.key}-${i}`, size: "A4", orientation: "landscape", style: s.page },
      ...Chrome({ doc, where: run.heading ? `${title} · ${run.heading}` : title }),
      i === 0 ? h(Text, { style: s.h2 }, title) : null,
      i === 0 ? h(FillIn, { labels: t.testerLine }) : null,
      i === 0 && sheet.note ? h(Text, { style: [s.body, { marginTop: 8 }] }, sheet.note) : null,
      run.heading ? h(Text, { style: s.h3 }, run.heading) : null,
      run.intro ? h(View, { style: { marginBottom: 6 } }, rich(run.intro, s.body)) : null,
      run.table ? h(Table, { ...run.table, repeatHeader: true }) : null,
      i === runs.length - 1 ? signature : null,
    ),
  );
}

function FailuresPage({ doc }) {
  const c = doc.closing;
  const widths = [30, 90, 80, 90, null, 120, 110];
  return h(
    Page,
    { size: "A4", orientation: "landscape", style: s.page },
    ...Chrome({ doc, where: "Failures" }),
    h(Text, { style: s.h2 }, c.failuresHeading),
    h(View, { style: { marginBottom: 6 } }, rich(c.failuresNote, s.body)),
    h(Table, {
      cols: c.failureColumns.map((label, i) => ({ label, width: widths[i] ?? undefined, flex: widths[i] ? undefined : 1 })),
      rows: Array.from({ length: 14 }, () => ({ cells: c.failureColumns.map(() => "") })),
      minRowHeight: 30,
    }),
    h(Text, { style: [s.muted, { marginTop: 6 }] }, "More failures than this page holds: continue on a copy of it, numbered on."),
  );
}

function SignOffPage({ doc }) {
  const c = doc.closing;
  return h(
    Page,
    { size: "A4", style: s.page },
    ...Chrome({ doc, where: "Sign-off" }),
    h(Text, { style: s.h2 }, "Sign-off"),
    h(Table, {
      cols: c.signOffColumns.map((label, i) => ({ label, width: i === 0 ? 130 : i === 2 ? 90 : undefined })),
      rows: doc.roles.map((r) => ({ cells: [r.label, "", "", ""] })),
      minRowHeight: 32,
    }),
    h(View, { style: { marginTop: 28 }, wrap: false }, rich(c.director, [s.body, { fontSize: 10 }]), h(View, { style: { marginTop: 18 } }, h(FillIn, { labels: c.directorLine }))),
  );
}

/** The whole PDF, as bytes. `repo` is the repository root, for the font and the ำ fix. */
export async function renderAcceptancePdf(doc, repo) {
  const [{ NOTO_SANS_THAI_REGULAR }, { NOTO_SANS_THAI_BOLD }, { thaiPdfChildren }] = await Promise.all([
    importSrc(repo, "src/lib/archive/fonts/noto-sans-thai-regular.ts"),
    importSrc(repo, "src/lib/archive/fonts/noto-sans-thai-bold.ts"),
    importSrc(repo, "src/lib/archive/fonts/thai-pdf-children.ts"),
  ]);
  checkGlyphs(doc, [NOTO_SANS_THAI_REGULAR, NOTO_SANS_THAI_BOLD]);
  thai = thaiPdfChildren;
  Font.register({
    family: "NotoSansThai",
    fonts: [
      { src: NOTO_SANS_THAI_REGULAR, fontWeight: 400 },
      { src: NOTO_SANS_THAI_BOLD, fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);

  const one = doc.sheets.length === 1 ? doc.sheets[0].label : null;
  const pages = [
    // Like the Markdown, a one-role copy (--role) keeps the cover and the matrix.
    h(CoverPage, { key: "cover", doc }),
    h(MatrixPage, { key: "matrix", doc }),
    ...doc.sheets.flatMap((sheet) => sheetPages(doc, sheet)),
    ...(doc.closing ? [h(FailuresPage, { key: "fail", doc }), h(SignOffPage, { key: "sign", doc })] : []),
  ];
  const title = one ? `${doc.title} — ${one}` : doc.title;
  return new Uint8Array(await renderToBuffer(h(Document, { title, author: "Lanna Care for Animals", subject: `Generated from ${doc.version}` }, ...pages)));
}
