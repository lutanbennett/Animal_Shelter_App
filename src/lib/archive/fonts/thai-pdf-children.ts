import type { ReactNode } from "react";
import { thaiPdfText } from "./thai-pdf-text";

/**
 * thaiPdfText() applied to every string in a Text's children, not only a lone
 * string: `{label}: {value}` and `<Text>…</Text>{c.text}` reach the wrapper as
 * an array, and a ำ there drops letters just the same. Elements are left
 * alone; a nested Text is the file's own wrapper and rewrites its own strings.
 */
export function thaiPdfChildren(children: ReactNode): ReactNode {
  if (typeof children === "string") return thaiPdfText(children);
  if (Array.isArray(children)) return children.map(thaiPdfChildren);
  return children;
}
