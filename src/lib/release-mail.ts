import type { Release } from "./releases";

/**
 * The email that tells admins about a major release. Built by
 * scripts/deploy.mjs (Node, type stripping — hence no imports but a type)
 * and handed to the Worker's relay, which adds the environment to the
 * subject and the From address: worker/release-mail.mjs. Keeping the
 * `[UAT]` / `[Production]` label out of here means nothing that runs on a
 * laptop can decide which environment a mail claims to come from.
 */
export type ReleaseMail = { subject: string; text: string; html: string };

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function buildReleaseMail(list: Release[], siteOrigin: string): ReleaseMail {
  const pageUrl = `${siteOrigin}/releases`;
  const newest = list[0];
  const subject =
    list.length === 1
      ? `Lanna Care release ${newest.version}: ${newest.title}`
      : `Lanna Care releases ${list.map((r) => r.version).join(", ")}`;

  const text = [
    ...list.flatMap((r) => [
      `${r.version} — ${r.title} (${r.date})`,
      ...r.notes.map((n) => `  • ${n}`),
      "",
    ]),
    `All release notes: ${pageUrl}`,
    "",
    "You get this because you are an admin in Lanna Care for Animals.",
  ].join("\n");

  const html = [
    `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#222">`,
    ...list.map(
      (r) =>
        `<h2 style="font-size:17px;margin:20px 0 4px">${escapeHtml(r.version)} — ${escapeHtml(r.title)}</h2>` +
        `<p style="margin:0 0 8px;color:#666;font-size:13px">${escapeHtml(r.date)}</p>` +
        `<ul style="margin:0;padding-left:20px">${r.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>`,
    ),
    `<p style="margin-top:24px"><a href="${escapeHtml(pageUrl)}">All release notes</a></p>`,
    `<p style="color:#888;font-size:12px">You get this because you are an admin in Lanna Care for Animals.</p>`,
    `</div>`,
  ].join("\n");

  return { subject, text, html };
}
