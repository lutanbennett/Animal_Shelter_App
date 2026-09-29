import type { SiteContent } from "./content";
import { lineLink, lineMessageLink, socialLinks } from "./content";

/**
 * The ways the public site offers to get in touch, and the one place that
 * decides which comes first (0111, docs/decisions.md 2026-09-29). Every
 * public surface (the profile's sticky bar, the get-in-touch card, the
 * footer, the phone menu) asks `preferredChannels` and takes its buttons
 * from the front of the list, so they cannot disagree.
 */
export const CONTACT_CHANNELS = [
  "line",
  "messenger",
  "whatsapp",
  "instagram",
  "phone",
  "email",
] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export function isContactChannel(value: unknown): value is ContactChannel {
  return (CONTACT_CHANNELS as readonly unknown[]).includes(value);
}

export type ChannelLink = {
  channel: ContactChannel;
  href: string;
  /** What to show for the channel's own detail: the LINE id, phone number or email; null for the rest. */
  value: string | null;
  /** True when the shelter put it in its list (rather than it trailing in the built-in order). */
  chosen: boolean;
  /** Opens outside the browser (a chat app or site) rather than the phone or mail app. */
  external: boolean;
};

/** Text a channel can start the message with, where the channel supports it. */
export type ChannelMessage = { subject?: string; message?: string };

type ChannelSource = Pick<
  SiteContent,
  | "contact_line"
  | "contact_phone"
  | "contact_email"
  | "facebook_url"
  | "instagram_url"
  | "messenger_url"
  | "whatsapp_number"
  | "x_url"
> & { preferred_channels?: string[] | null };

/**
 * Every channel the shelter has a value for, in the order to offer them:
 * the shelter's list first (de-duplicated, unknown values dropped), then
 * the rest in the built-in order. A channel with no value is skipped
 * wherever it sits, so clearing a LINE id passes the front spot to the
 * next channel that is set — and because phone and email close the
 * built-in order, they are the last resort. An empty result means the
 * shelter has published no way to get in touch at all.
 *
 * Instagram opens the profile: it has no pre-filled direct-message link.
 */
export function preferredChannels(
  content: ChannelSource | null | undefined,
  message?: ChannelMessage,
): ChannelLink[] {
  if (!content) return [];
  const social = socialLinks(content);
  const phone = content.contact_phone?.trim();
  const email = content.contact_email?.trim();
  const text = message?.message;

  const available: Record<ContactChannel, Omit<ChannelLink, "channel" | "chosen"> | null> = {
    line: (() => {
      const link = text
        ? lineMessageLink(content.contact_line, text)
        : lineLink(content.contact_line);
      return link ? { href: link.href, value: link.label, external: true } : null;
    })(),
    messenger: social.messenger
      ? { href: social.messenger, value: null, external: true }
      : null,
    whatsapp: social.whatsapp
      ? {
          href: text ? `${social.whatsapp}?text=${encodeURIComponent(text)}` : social.whatsapp,
          value: null,
          external: true,
        }
      : null,
    instagram: social.instagram
      ? { href: social.instagram, value: null, external: true }
      : null,
    phone: phone
      ? { href: `tel:${phone.replace(/\s+/g, "")}`, value: phone, external: false }
      : null,
    email: email
      ? {
          // A subject and a body, or, given only a message, the message as the subject.
          href:
            message?.subject || text
              ? `mailto:${email}?subject=${encodeURIComponent(message?.subject ?? text ?? "")}${
                  message?.subject && text ? `&body=${encodeURIComponent(text)}` : ""
                }`
              : `mailto:${email}`,
          value: email,
          external: false,
        }
      : null,
  };

  const listed = (content.preferred_channels ?? []).filter(isContactChannel);
  const order = [...new Set([...listed, ...CONTACT_CHANNELS])];
  return order.flatMap((channel) => {
    const entry = available[channel];
    return entry ? [{ channel, chosen: listed.includes(channel), ...entry }] : [];
  });
}

/**
 * The channels a contact list shows. Instagram is a follow link that the
 * footer and phone menu carry elsewhere, so it joins only when the shelter
 * chose it; email likewise in the phone menu (`email: false`), which has
 * never had an email button, while the footer always lists it.
 */
export function talkChannels(
  channels: ChannelLink[],
  { email }: { email: boolean },
): ChannelLink[] {
  return channels.filter(
    (c) =>
      c.chosen ||
      (c.channel !== "instagram" && (c.channel !== "email" || email)),
  );
}
