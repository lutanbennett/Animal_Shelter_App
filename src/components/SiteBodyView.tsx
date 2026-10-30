import { parseBody, parseInline, stripMarks, type InlineNode } from "@/lib/site/body";
import { LinkedText } from "./LinkedText";

const MARK_COLOR_CLASS = {
  ink: "text-site-ink",
  action: "text-site-action-hover",
  accent: "text-site-accent",
} as const;
const MARK_SIZE_CLASS = {
  small: "text-sm",
  large: "text-xl",
  xlarge: "text-2xl",
} as const;

/**
 * A site_pages body rendered for the public pages: paragraphs, "## "
 * sub-headings and "- " bullet lists (see lib/site/body.ts). Links in the text are made clickable
 * (lib/site/links.ts). `size`
 * picks the prose scale — the home page story reads larger than a
 * sidebar block.
 */
export function SiteBodyView({
  body,
  size = "base",
  headingLevel = "h3",
  className = "",
  newTabLabel,
}: {
  body: string | null | undefined;
  /** t.common.opensInNewTab, passed in so this also renders inside a client component. */
  newTabLabel: string;
  size?: "sm" | "base" | "lg";
  /**
   * What a "## " line becomes. A whole page's body sits under the page's h1,
   * so its sub-headings are h2; a body inside a section (the home page's
   * story, the adoption list's "How adoption works" box) sits under an h2,
   * so they are h3. Skipping a level fails the heading-order check
   * (docs/seo-audit-2026-10-14.md, T4).
   */
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const blocks = parseBody(body);
  if (blocks.length === 0) return null;
  const Heading = headingLevel;
  const render = (nodes: InlineNode[]): React.ReactNode =>
    nodes.map((n, i) => {
      if (n.type === "text") return <LinkedText key={i} text={n.text} newTabLabel={newTabLabel} />;
      const kids = render(n.children);
      if (n.tag === "b") return <strong key={i} className="font-semibold">{kids}</strong>;
      if (n.tag === "i") return <em key={i}>{kids}</em>;
      if (n.tag === "u") return <span key={i} className="underline underline-offset-4">{kids}</span>;
      if (n.tag === "c") return <span key={i} className={MARK_COLOR_CLASS[n.arg]}>{kids}</span>;
      if (n.tag === "s") return <span key={i} className={MARK_SIZE_CLASS[n.arg]}>{kids}</span>;
      return null;
    });
  const link = (text: string) => render(parseInline(text));

  const prose =
    size === "lg"
      ? "text-base sm:text-lg"
      : size === "sm"
        ? "text-sm"
        : "text-base";

  return (
    <div className={`flex flex-col gap-4 leading-relaxed text-muted ${prose} ${className}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <Heading
                key={index}
                className="mt-2 text-lg font-semibold text-foreground"
              >
                {stripMarks(block.text)}
              </Heading>
            );
          case "list":
            return (
              <ul key={index} className="flex list-disc flex-col gap-2 pl-6">
                {block.items.map((item, i) => (
                  <li key={i}>{link(item)}</li>
                ))}
              </ul>
            );
          default:
            return <p key={index}>{link(block.text)}</p>;
        }
      })}
    </div>
  );
}
