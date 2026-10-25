// Builds the card report: one section per card, in the order Lutan asked for (2026-10-25): the card's name, what it
// is for, what it gives access to (pages, tables and forms), the major restrictions, then a recommendation.
//
//   node scripts/build-card-report.mjs                  write the PDF to the gitignored .local/ of the main checkout
//   node scripts/build-card-report.mjs --out <file.pdf>  ...or to a path of your choosing
//   node scripts/build-card-report.mjs --html <file>     also keep the HTML it printed (to look at without a PDF reader)
//   node scripts/build-card-report.mjs --check           validate docs/card-reports/*.md; print nothing else, make no PDF
//
// The words come from docs/card-reports/<card key>.md, one file per card, written by the pass that walked that card.
// Two things are NOT typed and so cannot go stale: the card's name (the label Settings -> Who does what shows, from
// the English dictionary) and the small-print line of what the card grants (from src/lib/permissions/cards.ts).
// Both are read, never copied. The PDF ends with a table of every card in the catalogue and whether it has a report yet,
// so a card nobody has written up shows as such instead of being absent.
//
// WHERE THE PDF GOES: it names real roles and the state of a live system, so it is not committed. The repo is public.
// The default is .local/ in the main checkout; put a copy on Lutan's Desktop (OneDrive\Desktop) for him to open.
//
// HOW IT PRINTS: the HTML is built here with every style inline, then printed by playwright-core driving the installed
// Chrome or Edge (the same route check-residents-export.mjs drives). No CDN tags: they time out headless. Thai renders
// because the system fonts carry it. There is no markdown library in node_modules, so the small subset the reports use
// (headings, bullets, **bold**, `code`) is handled below.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { loadCards } from "./lib/load-cards.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPORTS = join(root, "docs", "card-reports");

/** The four headings every report has, in his order. The card's name is the title and needs no heading. */
export const SECTIONS = ["Purpose", "Gives access to", "Major restrictions", "Recommendation"];
/** Under "Gives access to": at least one of these, because he asked for pages, tables and forms by name. */
export const ACCESS_PARTS = ["Pages", "Tables", "Forms"];

/** "key: value" lines between two --- fences. Anything else in the fence is a mistake worth stopping on. */
function parseFile(file, text) {
  const m = text.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: must start with a --- fenced header holding card: and walked:`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z]+):\s*(.+)$/);
    if (!kv) throw new Error(`${file}: header line "${line}" is not "key: value"`);
    meta[kv[1]] = kv[2].trim();
  }
  const sections = new Map();
  let current = null;
  for (const line of m[2].split("\n")) {
    const h2 = line.match(/^## (.+?)\s*$/);
    if (h2) {
      current = h2[1];
      if (sections.has(current)) throw new Error(`${file}: section "${current}" appears twice`);
      sections.set(current, []);
    } else if (current) sections.get(current).push(line);
  }
  return { meta, sections };
}

export function loadReports(cardKeys) {
  const reports = new Map();
  const problems = [];
  if (!existsSync(REPORTS)) return { reports, problems };
  for (const name of readdirSync(REPORTS).filter((n) => n.endsWith(".md")).sort()) {
    const file = `docs/card-reports/${name}`;
    try {
      const { meta, sections } = parseFile(file, readFileSync(join(REPORTS, name), "utf8"));
      const key = name.replace(/\.md$/, "");
      if (meta.card !== key) problems.push(`${file}: header says card: ${meta.card}, but the file is named for ${key}`);
      if (!cardKeys.includes(key)) problems.push(`${file}: ${key} is not a card in src/lib/permissions/cards.ts`);
      if (!meta.walked) problems.push(`${file}: header needs walked: (a date, then how it was checked)`);
      for (const s of SECTIONS) {
        const body = (sections.get(s) ?? []).join("\n").trim();
        if (!body) problems.push(`${file}: the "${s}" section is missing or empty`);
      }
      const access = (sections.get("Gives access to") ?? []).join("\n");
      if (!ACCESS_PARTS.some((p) => new RegExp(`^### ${p}\\s*$`, "m").test(access))) {
        problems.push(`${file}: "Gives access to" needs a ### Pages, ### Tables or ### Forms part (write "- None." under any that does not apply)`);
      }
      for (const s of sections.keys()) if (!SECTIONS.includes(s)) problems.push(`${file}: unknown section "${s}" (the five parts are fixed)`);
      reports.set(key, { meta, sections });
    } catch (e) {
      problems.push(e.message);
    }
  }
  return { reports, problems };
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

/** The subset: ### headings, "- " bullets, blank-line paragraphs. */
function body(lines) {
  const out = [];
  let list = false;
  let para = [];
  const flush = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const closeList = () => {
    if (list) out.push("</ul>");
    list = false;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    const h3 = line.match(/^### (.+)$/);
    const li = line.match(/^- (.+)$/);
    if (h3) {
      flush();
      closeList();
      out.push(`<h4>${inline(h3[1])}</h4>`);
    } else if (li) {
      flush();
      if (!list) out.push("<ul>");
      list = true;
      out.push(`<li>${inline(li[1])}</li>`);
    } else if (list && /^\s+\S/.test(line)) {
      out[out.length - 1] = out[out.length - 1].replace(/<\/li>$/, ` ${inline(line.trim())}</li>`);
    } else {
      closeList();
      para.push(line.trim());
    }
  }
  flush();
  closeList();
  return out.join("\n");
}

const CSS = `
  @page { size: A4; margin: 16mm 15mm 18mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.45 "Segoe UI", "Noto Sans", "Noto Sans Thai", Arial, sans-serif; color: #1a1f1d; margin: 0; }
  h1 { font-size: 22pt; margin: 0 0 4pt; }
  h2 { font-size: 15pt; margin: 0 0 2pt; }
  h3 { font-size: 11pt; margin: 14pt 0 4pt; padding: 3pt 7pt; background: #e8f2ef; border-left: 4pt solid #1d7a68; }
  h4 { font-size: 10pt; margin: 8pt 0 2pt; text-transform: uppercase; letter-spacing: .04em; color: #44534f; }
  p { margin: 3pt 0; } ul { margin: 2pt 0 4pt; padding-left: 15pt; } li { margin: 2pt 0; }
  code { font: 9pt Consolas, monospace; background: #f1f3f2; padding: 0 2pt; }
  .card { page-break-before: always; }
  .meta { color: #55625e; font-size: 9pt; margin: 0 0 6pt; }
  .small { margin-top: 10pt; padding-top: 5pt; border-top: 1px solid #ccd5d2; color: #55625e; font-size: 8.5pt; }
  .small code { font-size: 8pt; }
  .recommend { background: #fbf6e9; border-left: 4pt solid #c58a1a; padding: 2pt 8pt 4pt; }
  table { border-collapse: collapse; width: 100%; font-size: 9pt; } td, th { border: 1px solid #ccd5d2; padding: 2pt 5pt; text-align: left; }
  .no { color: #8a5a00; } .yes { color: #1d7a68; }
  .lede { font-size: 11pt; max-width: 150mm; }
`;

function html({ title, date, stamp, order, CARDS, en, reports }) {
  const name = (k) => CARDS[k].label(en);
  const grants = (k) => {
    const own = CARDS[k].bundle.map((b) => `<code>${esc(b.activity)}</code>${b.level ? ` (${b.level})` : ""}`);
    const inc = (CARDS[k].includes ?? []).map((i) => `${esc(name(i))} (<code>${i}</code>)`);
    return `${inc.length ? `Also gives everything ${inc.join(", ")} gives. ` : ""}Its own: ${own.join(", ") || "nothing"}.`;
  };
  const cover = `
    <h1>${esc(title)}</h1>
    <p class="meta">${esc(date)} · ${esc(stamp)}</p>
    <p class="lede">One page or so per card: its name, what it is for, what it gives access to (pages, tables and forms), the
    things it cannot do that you should know about, and a recommendation to widen or narrow it.</p>
    <p class="lede"><strong>A recommendation changes nothing.</strong> No card was altered to write this report.</p>
    <h3>Which cards have a report</h3>
    <table><tr><th>Card</th><th>Report</th><th>Checked</th></tr>
    ${order
      .map((k) => {
        const r = reports.get(k);
        return `<tr><td>${esc(name(k))} (<code>${k}</code>)</td><td class="${r ? "yes" : "no"}">${r ? "written" : "not yet"}</td><td>${r ? esc(r.meta.walked) : ""}</td></tr>`;
      })
      .join("")}
    </table>`;
  const sections = order
    .filter((k) => reports.has(k))
    .map((k) => {
      const { meta, sections: s } = reports.get(k);
      const part = (n, cls = "") => `<h3>${n}</h3><div class="${cls}">${body(s.get(n) ?? [])}</div>`;
      return `<section class="card">
        <h2>${esc(name(k))}</h2>
        <p class="meta"><code>${k}</code> · checked ${esc(meta.walked)}</p>
        ${part("Purpose")}${part("Gives access to")}${part("Major restrictions")}${part("Recommendation", "recommend")}
        <p class="small"><strong>Small print.</strong> ${grants(k)}</p>
      </section>`;
    })
    .join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${cover}${sections}</body></html>`;
}

/** Finds the main checkout, where .local/ lives, from any worktree. */
function mainCheckout() {
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: root, encoding: "utf8" }).trim();
    return dirname(common);
  } catch {
    return root;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (n) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : undefined);
  const { CARDS, CARD_KEYS, en } = await loadCards(root);
  const { reports, problems } = loadReports(CARD_KEYS);
  if (problems.length) {
    console.error(`card report: ${problems.length} problem(s)\n` + problems.map((p) => `  - ${p}`).join("\n"));
    process.exit(1);
  }
  if (args.includes("--check")) {
    console.log(`card report: ${reports.size} of ${CARD_KEYS.length} cards written up, all well formed`);
    return;
  }
  if (!reports.size) {
    console.error("card report: docs/card-reports/ has no report files yet");
    process.exit(1);
  }
  const date = new Date().toISOString().slice(0, 10);
  let stamp = "Lanna Care card report";
  try {
    stamp = `code at ${execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).trim()}`;
  } catch {}
  const doc = html({ title: "Card report", date, stamp, order: CARD_KEYS, CARDS, en, reports });
  if (opt("html")) writeFileSync(resolve(opt("html")), doc);

  const out = resolve(opt("out") ?? join(mainCheckout(), ".local", `card-report-${date}.pdf`));
  mkdirSync(dirname(out), { recursive: true });
  let browser;
  for (const channel of ["chrome", "msedge"]) {
    try {
      browser = await chromium.launch({ channel, headless: true });
      break;
    } catch {
      /* try the next */
    }
  }
  if (!browser) {
    console.error("card report: no Chrome or Edge to print with (the PDF is printed by the installed browser)");
    process.exit(1);
  }
  try {
    const page = await browser.newPage();
    await page.setContent(doc, { waitUntil: "load" });
    await page.pdf({ path: out, format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }
  console.log(`card report: ${reports.size} of ${CARD_KEYS.length} cards, written to ${out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
