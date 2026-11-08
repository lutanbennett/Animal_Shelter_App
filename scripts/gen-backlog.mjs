#!/usr/bin/env node
/**
 * Render docs/backlog.md as the "Lanna Care Backlog" artifact page.
 *
 * The page is a view of the file: open items by section, completed ones
 * folded away under the same headings, each item a <details> holding its
 * whole prompt. Run it, then republish the HTML to the artifact's URL.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const REPO = process.argv[2] ?? "C:/Development/Animal_Shelter_App";
const OUT = process.argv[3] ?? "backlog.html";

const md = readFileSync(`${REPO}/docs/backlog.md`, "utf8");
const sha = execSync("git rev-parse --short HEAD", { cwd: REPO }).toString().trim();
const stamp = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 16);

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Inline markdown → HTML. Code first, so nothing inside it is re-read. */
function inline(s) {
  const code = [];
  let t = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${code.push(`<code>${esc(c)}</code>`) - 1}\u0000`);
  t = esc(t);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  // Lazy, and tolerant of a nested *italic* — bold runs first so the
  // italic pass below picks up what is left inside it.
  t = t.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => code[Number(i)]);
}

/**
 * Intro lines → HTML. Blank lines (kept as "") separate paragraphs, wrapped
 * lines join into one; a run of `|…|` lines is a markdown table.
 */
function blocks(lines) {
  const out = [];
  let buf = [];
  const flushBuf = () => {
    if (!buf.length) return;
    if (buf[0].startsWith("|")) {
      const rows = buf
        .filter((l) => !/^\|[\s:|-]+\|$/.test(l))
        .map((l) => l.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      const [th, ...body] = rows;
      out.push(
        `<div class="tbl"><table><thead><tr>${th.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>` +
          `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      );
    } else out.push(`<p>${inline(buf.join(" "))}</p>`);
    buf = [];
  };
  for (const l of lines) {
    if (!l) { flushBuf(); continue; }
    if (buf.length && buf[0].startsWith("|") !== l.startsWith("|")) flushBuf();
    buf.push(l);
  }
  flushBuf();
  return out.join("");
}

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

// An id is the first 60 characters of a title, and two items CAN produce the
// same one. On 2026-11-03 two Next up items were both retitled to lead with
// "SCHEMA HALF SHIPPED 2026-11-03 (0304/0305, bills-sites-schema); ..." and
// collided exactly. That is not cosmetic: the priorities panel finds items with
// getElementById, which returns only the first, so the second item silently
// loses its star and cannot be picked at all. Ids must be unique per page.
// An item line is `- [ ] <!--#a7f3k--> **TITLE** body…`; the id is optional so
// an item filed before anyone ran `.local/backlog-ids.mjs` still renders.
// `[\s\S]` and not `.`: a lone CR inside a line made one item invisible to a
// dot-based pattern on 2026-11-03.
const ITEM_RE = /^- \[([ x])\] (?:<!--#([a-z0-9]{5})--> )?\*\*([\s\S]+?)\.?\*\*\s*([\s\S]*)$/;
let noId = 0;

const usedIds = new Set();
const uniqueId = (base) => {
  let id = base;
  for (let n = 2; usedIds.has(id); n++) id = base + "-" + n;
  usedIds.add(id);
  return id;
};

/**
 * An item is one `- [ ]` line plus any indented continuation lines, which
 * in this file are always a numbered sub-list (the guided-tour item).
 */
function itemHtml(item, idPrefix) {
  const m = item.head.match(ITEM_RE);
  if (!m) return "";
  const [, tick, itemId, title, rest] = m;
  const done = tick === "x";
  let body = rest.trim() ? `<p>${inline(rest.trim())}</p>` : "";
  // Numbered continuation lines are a list; anything else is a paragraph.
  let ol = [];
  const flushOl = () => { if (ol.length) body += `<ol>${ol.join("")}</ol>`; ol = []; };
  for (const l of item.sub) {
    if (/^\s*\d+\.\s/.test(l)) ol.push(`<li>${inline(l.replace(/^\s*\d+\.\s*/, ""))}</li>`);
    else { flushOl(); body += `<p>${inline(l.trim())}</p>`; }
  }
  flushOl();
  // The anchor is the item's OWN id where it has one, so it survives a retitle
  // and a move between sections. An item added before anyone ran the id script
  // falls back to the old title slug, which still works and still collides —
  // `noId` below counts them so that never passes unnoticed.
  if (!itemId) noId++;
  const anchor = itemId ? `i-${itemId}` : uniqueId(idPrefix + "-" + slug(title));
  return (
    `<li class="item${done ? " done" : ""}" id="${anchor}">\n` +
    `  <details>\n` +
    `    <summary><span class="box" aria-hidden="true"></span>` +
    // The permanent id, on the row rather than only in the anchor: it is how
    // every session and every chat names an item, so a reader who cannot see it
    // cannot follow a reference to it. An item with no id yet shows nothing
    // rather than a placeholder — `noId` above is what reports those.
    (itemId ? `<code class="iid">#${itemId}</code>` : "") +
    `<span class="ttl">${inline(title)}</span>` +
    `<span class="chev" aria-hidden="true"></span></summary>\n` +
    `    <div class="body">${body}</div>\n` +
    `  </details>\n</li>`
  );
}

// ---- parse -----------------------------------------------------------------
const lines = md.split("\n");
const open = [];       // [{ name, intro[], items[] }]
const done = [];       // [{ name, items[] }]
let inCompleted = false;
let completedIntro = [];
let bucket = null;
let current = null;    // item being accumulated

const flush = () => { if (current && bucket) bucket.items.push(current); current = null; };

for (const line of lines) {
  if (/^## /.test(line)) {
    flush();
    const name = line.slice(3).trim();
    if (name === "Completed") { inCompleted = true; bucket = null; continue; }
    bucket = { name, intro: [], items: [] };
    open.push(bucket);
    continue;
  }
  if (/^### /.test(line) && inCompleted) {
    flush();
    bucket = { name: line.slice(4).trim(), items: [] };
    done.push(bucket);
    continue;
  }
  if (/^# /.test(line)) continue;
  if (/^- \[[ x]\] /.test(line)) {
    flush();
    current = { head: line, sub: [] };
    continue;
  }
  const toIntro = (text) => {
    if (inCompleted && !bucket) completedIntro.push(text);
    else if (bucket && bucket.intro) bucket.intro.push(text);
  };
  // An indented line continues the open item; with no item open it is intro.
  if (/^\s+\S/.test(line)) {
    if (current) current.sub.push(line);
    else toIntro(line.trim());
    continue;
  }
  // A blank line does NOT end an item. An item's continuation paragraphs are
  // indented and separated by blanks, so flushing here handed them to the
  // section intro instead: the item then rendered with an empty body and the
  // intro ended mid-sentence. Only a heading, the next item, or an unindented
  // line ends an item.
  if (!line.trim()) {
    if (!current) toIntro("");   // keep paragraph breaks in intros
    continue;
  }
  // Unindented and not blank: the open item, if any, has ended here. Without
  // this the line was silently dropped.
  flush();
  toIntro(line.trim());
}
flush();

const openCount = open.reduce((n, s) => n + s.items.filter((i) => i.head.startsWith("- [ ]")).length, 0);
const doneCount =
  done.reduce((n, s) => n + s.items.length, 0) +
  open.reduce((n, s) => n + s.items.filter((i) => i.head.startsWith("- [x]")).length, 0);
const total = openCount + doneCount;
const pct = Math.round((doneCount / total) * 100);

// ---- render ----------------------------------------------------------------
const nav = open
  .map((s) => {
    const n = s.items.filter((i) => i.head.startsWith("- [ ]")).length;
    return `<a href="#${slug(s.name)}"${n ? "" : ' class="empty"'}>${esc(s.name)}<b>${n}</b></a>`;
  })
  .join("");

const sections = open
  .map((s) => {
    const n = s.items.filter((i) => i.head.startsWith("- [ ]")).length;
    const intro = s.intro.some(Boolean)
      ? `<details class="introbox"><summary>Notes for this section</summary><div class="intro">${blocks(s.intro)}</div></details>`
      : "  ";
    // Finished items are left out (Lutan, 2026-10-10): they stay in the file,
    // but every one of them made each refresh cost a full read of the page.
    const items = s.items.filter((i) => i.head.startsWith("- [ ]")).map((i) => itemHtml(i, slug(s.name))).join("");
    return (
      `<section id="${slug(s.name)}">\n  <h2>${esc(s.name)} ` +
      `<span class="count">${n} open</span></h2>\n  ${intro}\n` +
      `  <ol class="items">${items}</ol>\n</section>`
    );
  })
  .join("");

const completed = done
  .map((s) => {
    const items = s.items.map((i) => itemHtml(i, `done-${slug(s.name)}`)).join("");
    return `<h3>${esc(s.name)} <span class="count">${s.items.length}</span></h3>\n    <ol class="items">${items}</ol>`;
  })
  .join("");

// Finished items are not rendered, so the priorities panel cannot otherwise
// tell "this pick is done" from "this pick was renamed" — both simply fail to
// appear. Emit the slug of every finished title so the panel can drop the
// first and keep the second. Slug, not id: an item ticked in place keeps its
// section prefix while one moved under `## Completed` gains a `done-` one, and
// the title's slug is the part that survives both.
const finishedItems = [
  ...done.flatMap((s) => s.items),
  ...open.flatMap((s) => s.items.filter((i) => i.head.startsWith("- [x]"))),
];
const parsed = finishedItems.map((i) => i.head.match(ITEM_RE)).filter(Boolean);
// What a pick points at now: the item's own id, which a retitle cannot change.
const doneIds = [...new Set(parsed.map((m) => m[2]).filter(Boolean).map((x) => `i-${x}`))];
// TRANSITIONAL, and safe to delete once no pick is keyed the old way: picks
// made before the ids existed hold a title slug, so a finished item still has
// to be recognisable by the old key too, or such a pick would never be dropped.
const doneSlugs = [...new Set(parsed.map((m) => slug(m[3])))];
const sectionSlugs = open.map((s) => slug(s.name));
// Every value holds only [a-z0-9-], so no `</script>` can appear inside them.
const finishedJson =
  `<script id="prio-finished" type="application/json">` +
  JSON.stringify({ ids: doneIds, done: doneSlugs, sections: sectionSlugs }) +
  `</script>\n`;

const head = readFileSync(new URL("./lib/backlog-page/head.html", import.meta.url), "utf8");
// Customer priorities panel and its script. The ranking and suggestions
// live in the artifact's own db, so they survive every republish.
const priorities = readFileSync(new URL("./lib/backlog-page/priorities.html", import.meta.url), "utf8");

const html =
  head +
  `<div class="wrap">\n<header>\n` +
  `  <div class="hrow"><h1>Lanna Care Backlog</h1>` +
  `<span class="stamp">main @ ${sha} · ${stamp.replace("T", " ")}</span></div>\n` +
  `  <div class="stats"><div><b>${openCount}</b> <span>open</span></div>` +
  `<div><b>${doneCount}</b> <span>done</span></div>` +
  `<div><b>${pct}%</b> <span>of ${total}</span></div></div>\n` +
  `  <div class="bar"><i style="width:${pct}%"></i></div>\n` +
  `  <nav><a href="#priorities">Priorities</a>${nav}</nav>\n</header>\n` +
  finishedJson +
  priorities +
  sections +
  `\n<p class="foot">Rendered from <code>docs/backlog.md</code> at <code>${sha}</code>. ` +
  `This page shows open items only; the ${doneCount} finished ones stay in the file, ` +
  `<a href="https://github.com/lutanbennett/Animal_Shelter_App/blob/main/docs/backlog.md" target="_blank" rel="noreferrer">readable on GitHub</a>. ` +
  `Tap an item to read its full prompt.</p>\n</div>\n\n</body></html>`;

writeFileSync(OUT, html);
console.log(`${OUT}: ${openCount} open, ${doneCount} done, ${pct}% of ${total} — main @ ${sha}`);
if (noId)
  console.log(
    `NOTE: ${noId} item(s) have no id, so their anchors still come from the title and a` +
      ` retitle will detach any priority pointing at them. Run: node .local/backlog-ids.mjs <backlog.md>`
  );
