import type { SVGProps } from "react";

/**
 * The X (formerly Twitter) mark, drawn like InstagramIcon (24-unit box,
 * currentColor) since lucide-react 1.x has no brand icons. Named XIcon, not
 * X, so it can't be mistaken for lucide's close icon of that name. Used by
 * the shelter's X profile link on the public site.
 */
export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4h4.5L20 20h-4.5Z" />
      <path d="m20 4-6.6 7.3M4 20l6.6-7.3" />
    </svg>
  );
}
