import type { SVGProps } from "react";

/**
 * The Messenger speech bubble with its lightning zigzag, drawn like
 * InstagramIcon (24-unit box, currentColor) since lucide-react 1.x has no
 * brand icons. Used by the shelter's Messenger link on the public site.
 */
export function MessengerIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M12 2.5c-5.3 0-9.5 3.9-9.5 8.9 0 2.8 1.3 5.3 3.4 6.9v3.2l3.1-1.7c.9.3 1.9.4 3 .4 5.3 0 9.5-3.9 9.5-8.8S17.3 2.5 12 2.5Z" />
      <path d="m7 14 3.5-3.7 2.7 2.4L17 9" />
    </svg>
  );
}
