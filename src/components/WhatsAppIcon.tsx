import type { SVGProps } from "react";

/**
 * The WhatsApp round bubble with a handset, drawn like InstagramIcon
 * (24-unit box, currentColor) since lucide-react 1.x has no brand icons.
 * Used by the shelter's WhatsApp chat link on the public site.
 */
export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="m3 21 1.6-4.6A8.8 8.8 0 1 1 7.7 19.6Z" />
      <path d="M9 8.3c0 3.6 3.1 6.7 6.7 6.7l.9-1.6-2.1-1-1 .9a4.6 4.6 0 0 1-2.8-2.8l.9-1-1-2.1Z" />
    </svg>
  );
}
