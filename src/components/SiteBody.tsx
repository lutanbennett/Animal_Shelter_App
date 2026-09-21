import { parseBody } from "@/lib/site/body";

/**
 * A site_pages body rendered for the public pages: paragraphs, "## "
 * sub-headings and "- " bullet lists (see lib/site/body.ts). `size`
 * picks the prose scale — the home page story reads larger than a
 * sidebar block.
 */
export function SiteBody({
  body,
  size = "base",
  className = "",
}: {
  body: string | null | undefined;
  size?: "sm" | "base" | "lg";
  className?: string;
}) {
  const blocks = parseBody(body);
  if (blocks.length === 0) return null;

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
              <h3
                key={index}
                className="mt-2 text-lg font-semibold text-foreground"
              >
                {block.text}
              </h3>
            );
          case "list":
            return (
              <ul key={index} className="flex list-disc flex-col gap-2 pl-6">
                {block.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            );
          default:
            return <p key={index}>{block.text}</p>;
        }
      })}
    </div>
  );
}
