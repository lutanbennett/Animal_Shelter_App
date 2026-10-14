import { parseBody } from "@/lib/site/body";
import { getT } from "@/lib/i18n/get-t";
import { LinkedText } from "./LinkedText";

/**
 * A site_pages body rendered for the public pages: paragraphs, "## "
 * sub-headings and "- " bullet lists (see lib/site/body.ts). Links in the text are made clickable
 * (lib/site/links.ts). `size`
 * picks the prose scale — the home page story reads larger than a
 * sidebar block.
 */
export async function SiteBody({
  body,
  size = "base",
  headingLevel = "h3",
  className = "",
}: {
  body: string | null | undefined;
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
  const { t } = await getT();
  const link = (text: string) => (
    <LinkedText text={text} newTabLabel={t.common.opensInNewTab} />
  );

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
                {block.text}
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
