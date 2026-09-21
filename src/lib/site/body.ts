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

/** The first paragraph, for cards and Open Graph descriptions. */
export function bodyLead(body: string | null | undefined, maxLength = 200): string {
  const first = parseBody(body).find((b) => b.type === "paragraph");
  const text = first && first.type === "paragraph" ? first.text : "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}
