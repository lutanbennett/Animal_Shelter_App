import type { SVGProps } from "react";

/**
 * The Facebook "f", drawn to sit beside lucide icons (24-unit box,
 * currentColor). lucide-react 1.x dropped its brand icons, so the public
 * links that point at a Facebook page — a Shelter Friend's today, the
 * shelter's own in the footer next — use this instead.
 */
export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21.95V14.5h2.52l.38-2.93H13.5V9.7c0-.85.24-1.43 1.45-1.43h1.55V5.65a20.8 20.8 0 0 0-2.26-.12c-2.24 0-3.77 1.37-3.77 3.88v2.16H7.94v2.93h2.53v7.45A10 10 0 1 1 13.5 21.95Z" />
    </svg>
  );
}
