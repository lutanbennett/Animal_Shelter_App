import { parseLinks } from "@/lib/site/links";

/**
 * Text with its links made clickable, built as React elements (never HTML)
 * from lib/site/links.ts. A link to another site opens in a new tab with
 * a screen-reader cue; vertical padding keeps the tap target at 44 px (an
 * inline box's padding is clickable without moving the lines), and
 * `overflow-wrap:anywhere` lets a long address wrap instead of widening the page.
 */
export function LinkedText({
  text,
  newTabLabel,
}: {
  text: string;
  newTabLabel: string;
}) {
  return (
    <>
      {parseLinks(text).map((part, index) => {
        if (part.type === "text") return part.text;
        return (
          <a
            key={index}
            href={part.href}
            {...(part.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="py-3 font-medium [overflow-wrap:anywhere] text-site-action-hover underline underline-offset-4 hover:text-site-action"
          >
            {part.label}
            {part.external && <span className="sr-only"> ({newTabLabel})</span>}
          </a>
        );
      })}
    </>
  );
}
