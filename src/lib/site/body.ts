/**
 * The site_pages body format (0059): paragraphs separated by a blank
 * line, a line starting "## " is a sub-heading, consecutive lines starting
 * "- " are a bullet list. Deliberately not markdown — three rules an admin
 * can learn from the hint under the textarea, and nothing that needs
 * escaping.
 */
export type BodyBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export function parseBody(body: string | null | undefined): BodyBlock[] {
  const blocks: BodyBlock[] = [];
  for (const chunk of (body ?? "").split(/\n\s*\n/)) {
    const lines = chunk
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    // A chunk can mix a heading with the list or paragraph under it.
    let paragraph: string[] = [];
    let items: string[] = [];
    const flush = () => {
      if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      if (items.length) blocks.push({ type: "list", items });
      paragraph = [];
      items = [];
    };
    for (const line of lines) {
      if (line.startsWith("## ")) {
        flush();
        blocks.push({ type: "heading", text: line.slice(3).trim() });
      } else if (line.startsWith("- ")) {
        if (paragraph.length) flush();
        items.push(line.slice(2).trim());
      } else {
        if (items.length) flush();
        paragraph.push(line);
      }
    }
    flush();
  }
  return blocks;
}

/**
 * Whether a translatable field is written in this format, so its translation
 * gets the style toolbar and a formatted preview. Only a page's text is: every
 * other translated field (bios, stories, labels, page headings) is shown as
 * plain text.
 */
export function isPageBodyField(row: { table_name: string; column_name: string }): boolean {
  return row.table_name === "site_pages" && row.column_name === "body";
}

/** The first paragraph, for cards and Open Graph descriptions. */
export function bodyLead(body: string | null | undefined, maxLength = 200): string {
  const first = parseBody(body).find((b) => b.type === "paragraph");
  const text = first && first.type === "paragraph" ? stripMarks(first.text) : "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

/**
 * Inline marks inside a paragraph or bullet (2026-10-30): {b}bold{/b}, {i}, {u},
 * {c:accent}colour{/c} and {s:large}size{/s}. Same spirit as the three block
 * rules: curly braces need no escaping in ordinary prose, the toolbar inserts
 * them so nobody has to type one, and anything that is not an exact, closed
 * mark from the lists below (a typo, an unknown colour, a pasted <script> or
 * javascript: link) stays as the plain text it was typed as. Colours and
 * sizes are fixed names mapped to the site's own classes, never CSS from the
 * text.
 */
export const MARK_COLORS = ["ink", "action", "accent"] as const;
export const MARK_SIZES = ["small", "large", "xlarge"] as const;
export type MarkColor = (typeof MARK_COLORS)[number];
export type MarkSize = (typeof MARK_SIZES)[number];

export type InlineNode =
  | { type: "text"; text: string }
  | { type: "mark"; tag: "b" | "i" | "u"; children: InlineNode[] }
  | { type: "mark"; tag: "c"; arg: MarkColor; children: InlineNode[] }
  | { type: "mark"; tag: "s"; arg: MarkSize; children: InlineNode[] };

type Frame = { tag: string; arg: string | undefined; raw: string; children: InlineNode[] };

function validOpen(tag: string, arg: string | undefined): boolean {
  if (tag === "b" || tag === "i" || tag === "u") return arg === undefined;
  if (tag === "c") return (MARK_COLORS as readonly string[]).includes(arg ?? "");
  if (tag === "s") return (MARK_SIZES as readonly string[]).includes(arg ?? "");
  return false;
}

function pushText(into: InlineNode[], text: string) {
  if (!text) return;
  const last = into[into.length - 1];
  if (last && last.type === "text") last.text += text;
  else into.push({ type: "text", text });
}

export function parseInline(text: string): InlineNode[] {
  const root: Frame = { tag: "", arg: undefined, raw: "", children: [] };
  const stack: Frame[] = [root];
  const re = /\{(\/?)([biucs])(?::([a-z]+))?\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const top = stack[stack.length - 1];
    pushText(top.children, text.slice(last, m.index));
    last = m.index + m[0].length;
    const [raw, close, tag, arg] = m;
    if (!close) {
      if (validOpen(tag, arg)) stack.push({ tag, arg, raw, children: [] });
      else pushText(top.children, raw);
    } else if (top.tag === tag && arg === undefined && stack.length > 1) {
      stack.pop();
      const parent = stack[stack.length - 1];
      parent.children.push({ type: "mark", tag, arg: top.arg, children: top.children } as InlineNode);
    } else {
      pushText(top.children, raw);
    }
  }
  pushText(stack[stack.length - 1].children, text.slice(last));
  // An opener that never closed is plain text, with what followed it.
  while (stack.length > 1) {
    const open = stack.pop()!;
    const parent = stack[stack.length - 1];
    pushText(parent.children, open.raw);
    for (const child of open.children) {
      if (child.type === "text") pushText(parent.children, child.text);
      else parent.children.push(child);
    }
  }
  return root.children;
}

function plain(nodes: InlineNode[]): string {
  return nodes.map((n) => (n.type === "text" ? n.text : plain(n.children))).join("");
}

/** The text with its valid marks removed: for headings, descriptions and cards. */
export function stripMarks(text: string): string {
  return plain(parseInline(text));
}
