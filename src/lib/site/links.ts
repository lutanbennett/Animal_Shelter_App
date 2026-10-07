/**
 * Links in public text that staff type (site pages, project stories).
 *
 * The text is user input and the public reads it, so this never produces
 * HTML: it splits a string into plain-text and link parts, and the caller
 * renders React elements from them. A link target is accepted only if it
 * is https:, http:, mailto:, tel: or a path on this site; anything else
 * (javascript:, data:, ...) stays as the plain text it was typed as.
 *
 * Forms understood:
 *   [words](target)        a link with words; target as above
 *   https://… / www.…      a bare address, linked on its own
 *   name@example.org       a bare email address, linked as mailto:
 * Bare addresses stop at the first non-ASCII character, so a Thai sentence
 * running straight on from an address is not swallowed into it.
 */
export type TextPart =
  | { type: "text"; text: string }
  | { type: "link"; label: string; href: string; external: boolean };

const SAFE_SCHEMES = new Set(["https:", "http:", "mailto:", "tel:"]);

/** The href for a typed target, or null if it must not become a link. */
export function safeHref(target: string): { href: string; external: boolean } | null {
  const raw = target.trim();
  if (!raw || /[\s\u0000-\u001f<>"\\]/.test(raw)) return null;

  // A path on this site: one leading slash, not protocol-relative.
  if (raw.startsWith("/")) {
    return raw.startsWith("//") ? null : { href: raw, external: false };
  }
  if (/^www\./i.test(raw)) return safeHref(`https://${raw}`);
  if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(raw)) {
    return { href: `mailto:${raw}`, external: false };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!SAFE_SCHEMES.has(url.protocol)) return null;
  if (url.protocol === "http:" || url.protocol === "https:") {
    if (!url.hostname.includes(".")) return null;
    return { href: url.href, external: true };
  }
  if (url.protocol === "tel:") {
    return /^tel:\+?[0-9()-]{3,}$/.test(raw) ? { href: raw, external: false } : null;
  }
  return /^mailto:[^?]+@[^?]+/.test(raw) ? { href: raw, external: false } : null;
}

const MARKDOWN = /\[([^\]\n]+)\]\(([^)\s]+)\)/;
const BARE =
  /(?:https?:\/\/|www\.)[A-Za-z0-9\-._~:/?#@!$&'()*+,;=%[\]]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/;

/** Trailing punctuation a reader does not mean as part of the address. */
function trimTrailing(candidate: string): string {
  let s = candidate;
  for (;;) {
    const last = s[s.length - 1];
    if (last && ".,;:!?'*]".includes(last)) {
      s = s.slice(0, -1);
    } else if (last === ")" && (s.match(/\(/g)?.length ?? 0) < (s.match(/\)/g)?.length ?? 0)) {
      s = s.slice(0, -1);
    } else {
      return s;
    }
  }
}

export function parseLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  const pushText = (t: string) => {
    if (!t) return;
    const last = parts[parts.length - 1];
    if (last?.type === "text") last.text += t;
    else parts.push({ type: "text", text: t });
  };

  let rest = text;
  while (rest) {
    const md = MARKDOWN.exec(rest);
    const bare = BARE.exec(rest);
    // Whichever comes first; a bare match inside a [..](..) is the markdown's.
    const useMd = md && (!bare || md.index <= bare.index);
    if (useMd) {
      pushText(rest.slice(0, md.index));
      const safe = safeHref(md[2]);
      if (safe) parts.push({ type: "link", label: md[1].trim(), ...safe });
      else pushText(md[0]);
      rest = rest.slice(md.index + md[0].length);
    } else if (bare) {
      pushText(rest.slice(0, bare.index));
      const candidate = trimTrailing(bare[0]);
      const safe = candidate ? safeHref(candidate) : null;
      if (safe) parts.push({ type: "link", label: candidate, ...safe });
      else pushText(candidate);
      rest = rest.slice(bare.index + candidate.length);
      if (!candidate) rest = rest.slice(bare[0].length);
    } else {
      pushText(rest);
      break;
    }
  }
  return parts;
}

/** Every link target in the text, sorted, for comparing two versions. */
export function linkTargets(text: string): string[] {
  return parseLinks(text)
    .flatMap((p) => (p.type === "link" ? [p.href] : []))
    .sort();
}

/** True when a translation carries exactly the links its source does. */
export function sameLinks(source: string, translation: string): boolean {
  const a = linkTargets(source);
  const b = linkTargets(translation);
  return a.length === b.length && a.every((href, i) => href === b[i]);
}
